import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Generate a conversation title from the first user message.
 */
const generateConversationTitle = (text) => {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    return "New Chat";
  }

  const words = cleaned.split(" ");

  let title = words.slice(0, 6).join(" ");

  if (words.length > 6) {
    title += "...";
  }

  return title.charAt(0).toUpperCase() + title.slice(1);
};

export function useChatMessages(
  activeConversation,
  setConversations,
  selectedModel,
) {
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const abortControllerRef = useRef(null);
  const attachmentCacheRef = useRef(new Map());

  /*
   * Keep only the ID as the stable conversation reference.
   */
  const conversationId = activeConversation?.id;

  /*
   * Update messages for the active conversation.
   */
  const updateMessages = useCallback(
    (updater) => {
      if (!conversationId) return;

      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          const newMessages =
            typeof updater === "function"
              ? updater(conversation.messages)
              : updater;

          return {
            ...conversation,
            messages: newMessages,
          };
        }),
      );
    },
    [conversationId, setConversations],
  );

  /*
   * Send a message.
   */
  const handleSend = useCallback(
    async (input, attachments = []) => {
      const text = input.trim();

      if ((!text && attachments.length === 0) || !conversationId || loading) {
        return;
      }

      /*
       * Capture the current history BEFORE
       * adding the new user message.
       */
      const history = (activeConversation?.messages || []).map((item) => ({
        ...item,
        attachments: attachmentCacheRef.current.get(item.id) || [],
      }));

      /*
       * Create user message.
       */
      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: text,
        attachments: attachments.map(({ name, type, size }) => ({ name, type, size })),
      };
      if (attachments.length > 0) {
        attachmentCacheRef.current.set(userMessage.id, attachments);
      }

      /*
       * Add user message immediately.
       */
      updateMessages((prev) => [...prev, userMessage]);

      /*
       * Automatically name a new conversation
       * using the first user message.
       */
      if (
        activeConversation?.messages?.length === 0 &&
        activeConversation?.title === "New Chat"
      ) {
        const title = generateConversationTitle(text);

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  title,
                }
              : conversation,
          ),
        );
      }

      setLoading(true);

      /*
       * Create AbortController for stopping generation.
       */
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: text,
            provider: selectedModel,
            history,
            attachments,

            stream: true,
          }),

          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `API Error: ${response.status} ${response.statusText}`,
          );
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/x-ndjson")) {
          const data = await response.json();
          if (!data.success) throw new Error(data.error || "AI request failed");
          updateMessages((prev) => [
            ...prev,
            { id: uuidv4(), role: "assistant", content: data.message },
          ]);
          return;
        }

        if (!response.body) {
          throw new Error("Streaming is not available in this browser.");
        }

        const assistantMessageId = uuidv4();
        let assistantText = "";
        let buffer = "";
        const decoder = new TextDecoder();

        const saveAssistantText = (content) => {
          updateMessages((prev) => {
            const exists = prev.some((item) => item.id === assistantMessageId);
            const nextMessage = {
              id: assistantMessageId,
              role: "assistant",
              content,
            };
            return exists
              ? prev.map((item) => item.id === assistantMessageId ? nextMessage : item)
              : [...prev, nextMessage];
          });
        };

        const consumeLine = (line) => {
          if (!line.trim()) return;
          const event = JSON.parse(line);
          if (event.error) throw new Error(event.error);
          if (typeof event.delta === "string") {
            assistantText += event.delta;
            saveAssistantText(assistantText);
          }
        };

        const reader = response.body.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) consumeLine(line);
          }
          buffer += decoder.decode();
          if (buffer.trim()) consumeLine(buffer);
        } finally {
          reader.releaseLock();
        }

        if (!assistantText) {
          throw new Error("The selected provider returned an empty response.");
        }
      } catch (error) {
        /*
         * User stopped generation.
         */
        if (error.name === "AbortError") {
          console.log("Chat generation stopped by user.");
          return;
        }

        console.error("Chat error:", error);

        /*
         * Display error inside the conversation.
         */
        const errorMessage = {
          id: uuidv4(),
          role: "assistant",
          content: `⚠️ ${
            error.message || "Something went wrong while contacting Zirak AI."
          }`,
          error: true,
        };

        updateMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [
      activeConversation,
      conversationId,
      selectedModel,
      loading,
      updateMessages,
      setConversations,
    ],
  );

  /*
   * Stop AI generation.
   */
  const handleStopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /*
   * Regenerate the latest assistant response.
   */
  const handleRegenerate = useCallback(() => {
    if (!activeConversation) {
      return;
    }

    const messages = activeConversation.messages || [];

    if (messages.length === 0) {
      return;
    }

    /*
     * Find the latest user message.
     */
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) {
      return;
    }

    /*
     * Remove the latest assistant response.
     */
    updateMessages((prev) => {
      const lastAssistantIndex = [...prev]
        .map((message, index) => ({
          message,
          index,
        }))
        .reverse()
        .find(({ message }) => message.role === "assistant")?.index;

      if (lastAssistantIndex === undefined) {
        return prev;
      }

      return prev.filter((_, index) => index !== lastAssistantIndex);
    });

    /*
     * Generate the response again.
     */
    handleSend(lastUserMessage.content, attachmentCacheRef.current.get(lastUserMessage.id) || []);
  }, [activeConversation, handleSend, updateMessages]);

  /*
   * Start editing a message.
   */
  const handleStartEdit = useCallback((message) => {
    setEditingMessage({
      messageId: message.id,
    });
  }, []);

  /*
   * Cancel message editing.
   */
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  /*
   * Save edited message.
   */
  const handleSaveEdit = useCallback(
    (newContent) => {
      if (!editingMessage || !activeConversation) {
        return;
      }

      const content = newContent.trim();

      if (!content) {
        return;
      }

      /*
       * Find edited message.
       */
      const messageIndex = activeConversation.messages.findIndex(
        (message) => message.id === editingMessage.messageId,
      );

      if (messageIndex === -1) {
        return;
      }

      /*
       * Replace the edited message and
       * remove everything after it.
       */
      updateMessages((prev) =>
        prev.slice(0, messageIndex + 1).map((message) =>
          message.id === editingMessage.messageId
            ? {
                ...message,
                content,
              }
            : message,
        ),
      );

      /*
       * Close editing mode.
       */
      setEditingMessage(null);

      /*
       * Generate a new AI response.
       */
      handleSend(content);
    },
    [editingMessage, activeConversation, handleSend, updateMessages],
  );

  /*
   * Like/dislike feedback.
   */
  const handleFeedback = useCallback(
    (messageId, feedbackType) => {
      updateMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                feedback: feedbackType,
              }
            : message,
        ),
      );
    },
    [updateMessages],
  );

  return {
    messages: activeConversation?.messages || [],

    loading,

    editingMessage,

    handleSend,

    handleRegenerate,

    handleStopGenerating,

    handleStartEdit,

    handleCancelEdit,

    handleSaveEdit,

    handleFeedback,
  };
}
