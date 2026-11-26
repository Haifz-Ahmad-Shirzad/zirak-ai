import { useState, useEffect, useRef } from "react";
import { useConversations } from "../hooks/useConversations";
import { useChatMessages } from "../hooks/useChatMessages";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import ConfirmModal from "../components/ConfirmModal";
import ProfileDialog from "../components/ProfileDialog";
import ChatMessageSkeleton from "../components/ChatMessageSkeleton";
import { t } from "../i18n.js";

export default function Chat() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem("zirak-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => {
    try {
      return window.localStorage.getItem("zirak-profile-name") || "Hafiz Ahmad Shirzad";
    } catch {
      return "Hafiz Ahmad Shirzad";
    }
  });
  const [locale, setLocale] = useState(() => {
    try {
      const saved = window.localStorage.getItem("zirak-locale");
      return ["en", "ps", "fa"].includes(saved) ? saved : "en";
    } catch {
      return "en";
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem("zirak-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("zirak-sidebar-collapsed", String(collapsed));
    } catch {
      // The app remains usable when browser storage is unavailable.
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem("zirak-locale", locale);
    } catch {
      // The app remains usable when browser storage is unavailable.
    }
  }, [locale]);

  useEffect(() => {
    try {
      window.localStorage.setItem("zirak-profile-name", profileName);
    } catch {
      // The profile remains usable when browser storage is unavailable.
    }
  }, [profileName]);

  useEffect(() => {
    try {
      window.localStorage.setItem("zirak-theme", theme);
    } catch {
      // The app remains usable when browser storage is unavailable.
    }
  }, [theme]);
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
    if (!mobileSidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div id="zirak-app" data-theme={theme} dir={locale === "en" ? "ltr" : "rtl"} className="relative h-screen overflow-hidden bg-gray-950 text-white">
      <div className="flex h-full">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          locale={locale}
          profileName={profileName}
          onOpenProfile={() => setProfileOpen(true)}
          onNewChat={() => {
            handleNewChat();
            setMobileSidebarOpen(false);
          }}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={(id) => {
            handleConversationSelect(id);
            setMobileSidebarOpen(false);
          }}
          onDeleteConversation={handleRequestDelete}
          editingConversationId={editingConversationId}
          onEditConversation={setEditingConversationId}
          onUpdateConversationTitle={handleUpdateConversationTitle}
          onCancelEditConversation={onCancelEditConversation}
        />

        {/* Mobile Overlay Backdrop */}
        {mobileSidebarOpen && (
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/50 md:hidden"
            aria-label="Close navigation"
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
            theme={theme}
            locale={locale}
            setLocale={setLocale}
            onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>{t(locale, "startConversation")}</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  locale={locale}
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

            {loading && messages[messages.length - 1]?.role !== "assistant" && <ChatMessageSkeleton />}

            {/* This empty div is the target for our auto-scrolling */}
            <div ref={messagesEndRef} />

            {/* Regenerate Button */}
            <div className="text-center py-4">
              {loading ? (
                <button
                  onClick={handleStopGenerating}
                  className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 mx-auto animate-pulse"
                  aria-label={t(locale, "stopGenerating")}
                >
                  <span className="w-3 h-3 bg-white rounded-sm"></span>
                  {t(locale, "stopGenerating")}
                </button>
              ) : (
                messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" && (
                  <button
                    onClick={handleRegenerate}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    🔄 {t(locale, "regenerate")}
                  </button>
                )
              )}
            </div>

          </div>
          <ChatInput
            onSend={handleSend}
            onStop={handleStopGenerating}
            disabled={loading}
            locale={locale}
            attachmentsEnabled={selectedModel !== "openrouter"}
            allowPdf={selectedModel !== "groq"}
            maxAttachments={selectedModel === "groq" ? 3 : 4}
            maxTotalBytes={selectedModel === "groq" ? 7 * 1024 * 1024 : 10 * 1024 * 1024}
            provider={selectedModel}
          />
        </div>
      </div>

      <ProfileDialog
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profileName={profileName}
        onSaveProfile={setProfileName}
        theme={theme}
        setTheme={setTheme}
        locale={locale}
        setLocale={setLocale}
      />

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDeleteConversation(conversationToDelete)}
        title={t(locale, "deleteConversation")}
        locale={locale}
      >
        {t(locale, "deleteConfirm")}
      </ConfirmModal>
    </div>
  );
}
