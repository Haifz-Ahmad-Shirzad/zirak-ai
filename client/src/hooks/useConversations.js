import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Persistent state backed by localStorage.
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);

      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Failed to read localStorage key "${key}":`, error);

      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Failed to save localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export function useConversations() {
  const [conversations, setConversations] = useLocalStorage(
    "conversations",
    [],
  );

  const [activeConversationId, setActiveConversationId] = useLocalStorage(
    "activeConversationId",
    null,
  );

  const [editingConversationId, setEditingConversationId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [conversationToDelete, setConversationToDelete] = useState(null);

  /**
   * Make sure at least one conversation exists.
   */
  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = {
        id: uuidv4(),
        title: "New Chat",
        messages: [],
      };

      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);

      return;
    }

    /**
     * If the stored active conversation no longer exists,
     * select the first available conversation.
     */
    const activeExists = conversations.some(
      (conversation) => conversation.id === activeConversationId,
    );

    if (!activeExists) {
      setActiveConversationId(conversations[0].id);
    }
  }, [
    conversations,
    activeConversationId,
    setConversations,
    setActiveConversationId,
  ]);

  /**
   * Create a completely new conversation.
   */
  const handleNewChat = useCallback(() => {
    const newConversation = {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
    };

    setConversations((prev) => [newConversation, ...prev]);

    setActiveConversationId(newConversation.id);

    setEditingConversationId(null);
  }, [setConversations, setActiveConversationId]);

  /**
   * Switch conversation.
   */
  const handleConversationSelect = useCallback(
    (id) => {
      setActiveConversationId(id);
      setEditingConversationId(null);
    },
    [setActiveConversationId],
  );

  /**
   * Open delete confirmation.
   */
  const handleRequestDelete = useCallback((id) => {
    setConversationToDelete(id);
    setIsModalOpen(true);
  }, []);

  /**
   * Delete conversation.
   */
  const handleDeleteConversation = useCallback(() => {
    if (!conversationToDelete) {
      return;
    }

    setConversations((prev) => {
      const remaining = prev.filter(
        (conversation) => conversation.id !== conversationToDelete,
      );

      /*
       * If we're deleting the active conversation,
       * select another conversation.
       */
      if (activeConversationId === conversationToDelete) {
        const nextConversation = remaining[0];

        setActiveConversationId(nextConversation?.id || null);
      }

      return remaining;
    });

    setIsModalOpen(false);
    setConversationToDelete(null);
    setEditingConversationId(null);
  }, [
    conversationToDelete,
    activeConversationId,
    setConversations,
    setActiveConversationId,
  ]);

  /**
   * Rename conversation.
   */
  const handleUpdateConversationTitle = useCallback(
    (id, newTitle) => {
      const title = newTitle.trim() || "New Chat";

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                title,
              }
            : conversation,
        ),
      );

      setEditingConversationId(null);
    },
    [setConversations],
  );

  /**
   * Find the currently selected conversation.
   */
  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) || null;

  return {
    conversations,

    activeConversationId,

    activeConversation,

    editingConversationId,

    isModalOpen,

    conversationToDelete,

    handleNewChat,

    handleConversationSelect,

    handleRequestDelete,

    handleDeleteConversation,

    handleUpdateConversationTitle,

    setEditingConversationId,

    onCancelEditConversation: () => setEditingConversationId(null),

    setIsModalOpen,

    setConversations,
  };
}
