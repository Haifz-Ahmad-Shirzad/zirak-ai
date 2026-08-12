import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChat } from "../hooks/useChat";

// Mock browser APIs
let idCounter = 0;
global.crypto = {
  randomUUID: vi.fn(() => {
    idCounter++;
    return `mock-uuid-${idCounter}`;
  }),
};

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

global.fetch = vi.fn();

describe("useChat Hook Logic", () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    vi.clearAllMocks();
    localStorageMock.clear();
    idCounter = 0;

    // Mock a successful streaming response for fetch
    const mockStream = new ReadableStream({
      start(controller) {
        const message = `data: {"message": "AI response"}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
        controller.close();
      },
    });
    const mockResponse = {
      ok: true,
      body: mockStream,
    };
    fetch.mockResolvedValue(mockResponse);
  });

  it("should create a new chat when localStorage is empty", () => {
    const { result } = renderHook(() => useChat("gemini"));
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe("New Chat");
    expect(crypto.randomUUID).toHaveBeenCalledOnce();
  });

  it("should load conversations from localStorage on initial render", () => {
    const conversations = [{ id: "conv-1", title: "First Chat", messages: [] }];
    localStorage.setItem("conversations", JSON.stringify(conversations));
    localStorage.setItem("activeConversationId", "conv-1");

    const { result } = renderHook(() => useChat("gemini"));

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe("First Chat");
    expect(result.current.activeConversationId).toBe("conv-1");
  });

  it("should create a new conversation when 'New Chat' is clicked", () => {
    const { result } = renderHook(() => useChat("gemini"));
    expect(result.current.conversations).toHaveLength(1);

    act(() => {
      result.current.handleNewChat();
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2);
    expect(result.current.activeConversationId).toBe("mock-uuid-2");
  });

  it("should send a message and receive a streaming response", async () => {
    const { result } = renderHook(() => useChat("gemini"));

    // Check initial state
    expect(result.current.messages).toHaveLength(0);

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // Wait for all state updates to complete
    await waitFor(() => {
      // The hook's `messages` should now contain both user and AI messages
      expect(result.current.messages).toHaveLength(2);
    });

    const finalMessages = result.current.messages;
    expect(finalMessages[0].role).toBe("user");
    expect(finalMessages[0].content).toBe("Test message");

    expect(finalMessages[1].role).toBe("assistant");
    expect(finalMessages[1].content).toBe("AI response");

    // Check if fetch was called correctly
    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Test message",
        provider: "gemini",
        history: [],
        stream: true,
      }),
    });
  });

  it("should stop a streaming response when handleStopGenerating is called", async () => {
    // Mock a stream that doesn't close immediately, allowing us to interrupt it.
    let streamController;
    const mockStream = new ReadableStream({
      start(controller) {
        streamController = controller;
        // Enqueue the first chunk immediately
        const chunk1 = `data: {"message": "First chunk "}\n\n`;
        controller.enqueue(new TextEncoder().encode(chunk1));
      },
    });

    // This mock will throw an AbortError if the signal is aborted during the fetch
    fetch.mockImplementation(async ({ signal }) => {
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("The user aborted a request.", "AbortError"));
        });
        resolve({ ok: true, body: mockStream });
      });
    });

    const { result } = renderHook(() => useChat("gemini"));

    // Start the send operation but don't wait for it to complete
    act(() => {
      result.current.handleSend("Long running query");
    });

    // Wait for the first chunk to be processed and the loading state to be true
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
      expect(result.current.messages[1]?.content).toBe("First chunk ");
    });

    // Now, call the stop function
    act(() => result.current.handleStopGenerating());

    // The loading state should be reset to false, and the response should not continue
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages[1].content).toBe("First chunk ");
  });

  it("should delete a conversation and keep the active one if it was not deleted", () => {
    const conversations = [
      { id: "conv-1", title: "First Chat", messages: [] },
      { id: "conv-2", title: "Second Chat", messages: [] },
    ];
    localStorage.setItem("conversations", JSON.stringify(conversations));
    localStorage.setItem("activeConversationId", "conv-1");

    const { result } = renderHook(() => useChat("gemini"));
    expect(result.current.conversations).toHaveLength(2);

    // Simulate user clicking delete on the second conversation
    act(() => result.current.handleRequestDelete("conv-2"));
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.conversationToDelete).toBe("conv-2");

    // Simulate confirming deletion in the modal
    act(() => result.current.handleDeleteConversation());

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].id).toBe("conv-1");
    expect(result.current.activeConversationId).toBe("conv-1"); // Active ID should not change
    expect(result.current.isModalOpen).toBe(false);
  });

  it("should delete the active conversation and set a new active conversation", () => {
    const conversations = [
      { id: "conv-1", title: "First Chat", messages: [] },
      { id: "conv-2", title: "Second Chat", messages: [] },
    ];
    localStorage.setItem("conversations", JSON.stringify(conversations));
    localStorage.setItem("activeConversationId", "conv-2");

    const { result } = renderHook(() => useChat("gemini"));

    act(() => result.current.handleRequestDelete("conv-2"));
    act(() => result.current.handleDeleteConversation());

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.activeConversationId).toBe("conv-1"); // Active ID should be reset to the first available
  });
});
