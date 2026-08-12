import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const API_URL = import.meta.env.VITE_API_URL;

export function useChat(initialMessages = []) {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const abortController = new AbortController();

  const handleSend = useCallback(
    async (input, { selectedModel }) => {
      if (!input.trim()) return;

      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: input,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantMessageId = uuidv4();
      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model: selectedModel,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `API Error: ${response.status} ${response.statusText}`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          content += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content } : msg,
            ),
          );
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Chat generation stopped by user.");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + " [Stopped]" }
                : msg,
            ),
          );
        } else {
          console.error("Chat error:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: error.message,
                    error: true,
                  }
                : msg,
            ),
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  const handleStop = useCallback(() => {
    abortController.abort();
  }, []);

  return {
    messages,
    setMessages,
    handleSend,
    isLoading,
    handleStop,
  };
}
