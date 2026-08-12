import { useState, useEffect, useCallback, useRef } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/chat";

export function useChat(selectedModel) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const abortControllerRef = useRef(null);

  const handleNewChat = useCallback(() => {
    if (loading && conversations.length > 0) return;

    const newConversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
    };

    setConversations((prev) => [...prev, newConversation]);
    setActiveConversationId(newConversation.id);
  }, [loading, conversations.length]);

  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem("conversations");
      const savedActiveId = localStorage.getItem("activeConversationId");
      const loadedConversations = savedConversations
        ? JSON.parse(savedConversations)
        : [];

      if (loadedConversations.length > 0) {
        setConversations(loadedConversations);
        const activeIdIsValid = loadedConversations.some(
          (c) => c.id === savedActiveId,
        );
        setActiveConversationId(
          activeIdIsValid ? savedActiveId : loadedConversations[0].id,
        );
      } else {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      handleNewChat();
    }
  }, [handleNewChat]);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("conversations", JSON.stringify(conversations));
    }
    if (activeConversationId) {
      localStorage.setItem("activeConversationId", activeConversationId);
    }
  }, [conversations, activeConversationId]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );
  const messages = activeConversation?.messages || [];

  const handleConversationSelect = useCallback(
    (id) => {
      if (loading) return;
      setActiveConversationId(id);
    },
    [loading],
  );

  const handleRequestDelete = useCallback((id) => {
    setConversationToDelete(id);
    setIsModalOpen(true);
  }, []);

  const handleDeleteConversation = useCallback(() => {
    if (loading || !conversationToDelete) return;

    const updatedConversations = conversations.filter(
      (conv) => conv.id !== conversationToDelete,
    );

    if (activeConversationId === conversationToDelete) {
      if (updatedConversations.length > 0) {
        setActiveConversationId(updatedConversations[0].id);
      } else {
        handleNewChat();
      }
    }

    setConversations(updatedConversations);
    setIsModalOpen(false);
    setConversationToDelete(null);
  }, [
    loading,
    conversationToDelete,
    conversations,
    activeConversationId,
    handleNewChat,
  ]);

  const handleUpdateConversationTitle = useCallback((id, newTitle) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title: trimmedTitle } : conv,
      ),
    );
    setEditingConversationId(null);
  }, []);

  const handleStartEdit = useCallback(
    (message) => {
      if (loading) return;
      setEditingMessage({
        conversationId: activeConversationId,
        messageId: message.id,
      });
    },
    [loading, activeConversationId],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const generateTitle = useCallback(
    async (messageContent) => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Generate a very short title (4 words max) for this user query: "${messageContent}"`,
            provider: selectedModel,
            history: [],
          }),
        });
        const data = await response.json();
        if (data.success && data.message) {
          return data.message.replace(/["."]/g, "").trim();
        }
      } catch (error) {
        console.error("Title generation failed:", error);
      }
      return messageContent.substring(0, 40) + "...";
    },
    [selectedModel],
  );

  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleSend = useCallback(
    async (text, historyOverride, isEdit = false) => {
      if (!text.trim() || loading) return;

      const history = historyOverride ? historyOverride : messages;
      const currentConvId = isEdit
        ? editingMessage.conversationId
        : activeConversationId;

      if (isEdit) {
        const editedUserMessage = {
          role: "user",
          content: text,
          id: editingMessage.messageId,
        };
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConvId
              ? { ...conv, messages: [...history, editedUserMessage] }
              : conv,
          ),
        );
      } else if (!historyOverride) {
        const userMessage = { role: "user", content: text, id: Date.now() };
        if (history.length === 0 && activeConversation?.title === "New Chat") {
          generateTitle(text).then((newTitle) => {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === currentConvId ? { ...conv, title: newTitle } : conv,
              ),
            );
          });
        }
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConvId
              ? { ...conv, messages: [...conv.messages, userMessage] }
              : conv,
          ),
        );
      }

      setLoading(true);
      setEditingMessage(null);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            provider: selectedModel,
            history,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `API request failed: ${response.status}`,
          );
        }

        const assistantMessageId = Date.now() + 1;
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConvId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    { id: assistantMessageId, role: "assistant", content: "" },
                  ],
                }
              : conv,
          ),
        );

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.substring(6);
              if (jsonString === "[DONE]") continue;
              const data = JSON.parse(jsonString);
              const textChunk = data.message;

              setConversations((prev) =>
                prev.map((conv) => {
                  if (conv.id === currentConvId) {
                    const newMessages = [...conv.messages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.id === assistantMessageId) {
                      lastMessage.content += textChunk;
                    }
                    return { ...conv, messages: newMessages };
                  }
                  return conv;
                }),
              );
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        if (error.name === "AbortError") {
          console.log("Stream generation stopped.");
          // The `finally` block will handle setting loading to false.
          return;
        }
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === activeConversationId) {
              const lastMessage = conv.messages[conv.messages.length - 1];
              if (
                lastMessage &&
                lastMessage.role === "assistant" &&
                lastMessage.content === ""
              ) {
                const updatedMessages = [...conv.messages];
                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  content: `⚠️ ${error.message || "Something went wrong."}`,
                };
                return { ...conv, messages: updatedMessages };
              }
              return {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    role: "assistant",
                    content: `⚠️ ${error.message || "Something went wrong."}`,
                    id: Date.now() + 1,
                  },
                ],
              };
            }
            return conv;
          }),
        );
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      loading,
      messages,
      activeConversationId,
      activeConversation,
      editingMessage,
      selectedModel,
      generateTitle,
    ],
  );

  const handleSaveEdit = useCallback(
    async (newText) => {
      if (!editingMessage || !newText.trim()) {
        handleCancelEdit();
        return;
      }
      const { conversationId, messageId } = editingMessage;
      const conversation = conversations.find((c) => c.id === conversationId);
      const messageIndex = conversation.messages.findIndex(
        (m) => m.id === messageId,
      );
      const historyForEdit = conversation.messages.slice(0, messageIndex);
      await handleSend(newText, historyForEdit, true);
    },
    [editingMessage, conversations, handleCancelEdit, handleSend],
  );

  const handleRegenerate = useCallback(async () => {
    if (loading || !activeConversation) return;
    const currentMessages = activeConversation.messages;
    if (currentMessages.length === 0) return;
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (lastMessage.role !== "assistant") return;

    let lastUserMessage = null;
    for (let i = currentMessages.length - 2; i >= 0; i--) {
      if (currentMessages[i].role === "user") {
        lastUserMessage = currentMessages[i];
        break;
      }
    }
    if (!lastUserMessage) return;

    const historyForRegen = currentMessages.slice(0, -1);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: historyForRegen }
          : conv,
      ),
    );
    await handleSend(lastUserMessage.content, historyForRegen);
  }, [loading, activeConversation, handleSend, activeConversationId]);

  const handleFeedback = useCallback(
    (messageId, feedback) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) => {
                if (msg.id === messageId) {
                  // If the same feedback is clicked again, toggle it off.
                  return {
                    ...msg,
                    feedback: msg.feedback === feedback ? null : feedback,
                  };
                }
                return msg;
              }),
            };
          }
          return conv;
        }),
      );
    },
    [activeConversationId],
  );

  return {
    conversations,
    activeConversationId,
    loading,
    messages,
    isModalOpen,
    conversationToDelete,
    editingConversationId,
    editingMessage,
    handleNewChat,
    handleConversationSelect,
    handleRequestDelete,
    handleDeleteConversation,
    handleUpdateConversationTitle,
    setEditingConversationId,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleSend,
    handleRegenerate,
    handleStopGenerating,
    handleFeedback,
    setIsModalOpen,
  };
}
