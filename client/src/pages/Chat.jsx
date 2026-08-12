import { useState, useEffect, useRef } from "react";
import { useConversations } from "../hooks/useConversations";
import { useChatMessages } from "../hooks/useChatMessages";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import ConfirmModal from "../components/ConfirmModal";
import ChatMessageSkeleton from "../components/ChatMessageSkeleton";

export default function Chat() {
  const [collapsed, setCollapsed] = useState(false);
  // const [selectedModel, setSelectedModel] = useState("gemini");
  const [selectedModel, setSelectedModel] = useState("openrouter");

  const {
    conversations,
    activeConversationId,
    activeConversation,
    isModalOpen,
    conversationToDelete,
    editingConversationId,
    handleNewChat,
    handleConversationSelect,
    handleRequestDelete,
    handleDeleteConversation,
    handleUpdateConversationTitle,
    setEditingConversationId,
    onCancelEditConversation,
    setIsModalOpen,
    setConversations,
  } = useConversations();

  const {
    messages,
    loading,
    editingMessage,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleSend,
    handleRegenerate,
    handleStopGenerating,
    handleFeedback,
  } = useChatMessages(activeConversation, setConversations, selectedModel);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="relative h-screen overflow-hidden bg-gray-950 text-white">
      <div className="flex h-full">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNewChat={handleNewChat}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={handleConversationSelect}
          onDeleteConversation={handleRequestDelete}
          editingConversationId={editingConversationId}
          onEditConversation={setEditingConversationId}
          onUpdateConversationTitle={handleUpdateConversationTitle}
          onCancelEditConversation={onCancelEditConversation}
        />

        {/* Mobile Overlay Backdrop */}
        {!collapsed && (
          <div
            onClick={() => setCollapsed(true)}
            className="fixed inset-0 z-10 bg-black/50 md:hidden"
            aria-hidden="true"
          ></div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>Start a conversation</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLastUserMessage={
                    msg.role === "user" && index === messages.length - 1
                  }
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  isEditing={editingMessage?.messageId === msg.id}
                  onFeedback={handleFeedback}
                />
              ))
            )}

            {loading && <ChatMessageSkeleton />}

            {/* This empty div is the target for our auto-scrolling */}
            <div ref={messagesEndRef} />

            {/* Regenerate Button */}
            <div className="text-center py-4">
              {loading ? (
                <button
                  onClick={handleStopGenerating}
                  className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 mx-auto animate-pulse"
                >
                  <span className="w-3 h-3 bg-white rounded-sm"></span>
                  Stop generating
                </button>
              ) : (
                messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" && (
                  <button
                    onClick={handleRegenerate}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    🔄 Regenerate response
                  </button>
                )
              )}
            </div>

            <ChatInput
              onSend={handleSend}
              onStop={handleStopGenerating}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDeleteConversation(conversationToDelete)}
        title="Delete Conversation"
      >
        Are you sure you want to permanently delete this conversation? This
        action cannot be undone.
      </ConfirmModal>
    </div>
  );
}
