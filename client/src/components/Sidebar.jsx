import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import {
  Plus,
  UserRound,
  ChevronLeft,
  MessageSquare,
  Trash2,
  Pencil,
  MoreHorizontal,
  Check,
  Search,
  X,
} from "lucide-react";

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  locale = "en",
  profileName = "Hafiz Ahmad Shirzad",
  onOpenProfile,
  onNewChat,
  conversations,
  activeConversationId,
  onConversationSelect,
  onDeleteConversation,
  editingConversationId,
  onEditConversation,
  onCancelEditConversation,
  onUpdateConversationTitle,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openMenuId]);

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <nav
      aria-label="Main navigation"
      className={[
        "fixed inset-y-0 left-0 z-20 w-64 bg-gray-900 h-full flex flex-col text-gray-200 transition-all duration-300 border-r border-gray-700 md:static md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-16" : "md:w-64",
      ].join(" ")}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {(!collapsed || mobileOpen) && <span className="font-semibold text-lg">Zirak AI</span>}

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-gray-700 md:hidden"
          aria-label={t(locale, "closeSidebar")}
        >
          <X className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-gray-700 md:inline-flex"
          aria-label={t(locale, collapsed ? "expandSidebar" : "collapseSidebar")}
          aria-expanded={!collapsed}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        aria-label={collapsed ? "New Chat" : undefined}
        title={collapsed ? t(locale, "newChat") : undefined}
        className="flex items-center gap-2 mx-3 mt-4 min-h-10 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
      >
        <Plus className="w-4 h-4 shrink-0" />
        {!collapsed && t(locale, "newChat")}
      </button>

      {!collapsed && (
        <div className="px-3 mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t(locale, "searchConversations")}
              aria-label={t(locale, "searchLabel")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md pl-8 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <ul
        className="mt-4 flex-1 overflow-y-auto px-2"
        aria-label={t(locale, "chatHistory")}
      >
        {filteredConversations.map((conv) => {
          const isEditing = editingConversationId === conv.id;
          const isMenuOpen = openMenuId === conv.id;
          const saveTitle = () => {
            onUpdateConversationTitle(conv.id, editingTitle);
            onCancelEditConversation();
            setEditingTitle("");
          };

          return (
            <li key={conv.id} className="relative">
              <div className="group flex min-h-11 items-center gap-1 rounded-lg">
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <input
                      type="text"
                      aria-label={t(locale, "renameConversation")}
                      value={editingTitle}
                      maxLength={100}
                      autoFocus
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveTitle();
                        } else if (event.key === "Escape") {
                          onCancelEditConversation();
                          setEditingTitle("");
                        }
                      }}
                      className="min-h-10 min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={saveTitle}
                      disabled={!editingTitle.trim()}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-gray-700 disabled:opacity-40"
                      aria-label={t(locale, "save")}
                      title={t(locale, "save")}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onCancelEditConversation();
                        setEditingTitle("");
                      }}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-gray-700"
                      aria-label={t(locale, "cancel")}
                      title={t(locale, "cancel")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onConversationSelect(conv.id)}
                      title={collapsed ? conv.title : undefined}
                      className={`flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                        activeConversationId === conv.id
                          ? "bg-gray-700"
                          : "hover:bg-gray-800"
                      }`}
                      aria-current={activeConversationId === conv.id ? "page" : undefined}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{conv.title}</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenMenuId(isMenuOpen ? null : conv.id)}
                      className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg opacity-100 hover:bg-gray-700 focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                      aria-label={t(locale, "chatActions")}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                      title={t(locale, "chatActions")}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {isMenuOpen && !isEditing && (
                <div
                  role="menu"
                  aria-label={t(locale, "chatActions")}
                  className="absolute right-1 top-10 z-30 min-w-40 rounded-xl border border-gray-700 bg-gray-900 p-1 text-sm shadow-xl"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEditingTitle(conv.title);
                      setOpenMenuId(null);
                      setCollapsed(false);
                      onEditConversation(conv.id);
                    }}
                    className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-gray-800"
                  >
                    <Pencil className="h-4 w-4" />
                    {t(locale, "renameConversation")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenuId(null);
                      onDeleteConversation(conv.id);
                    }}
                    className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-red-400 hover:bg-gray-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t(locale, "deleteConversation")}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="border-t border-gray-700 p-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-800"
          aria-label={t(locale, "profile")}
          title={collapsed ? profileName : undefined}
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold">
            {profileName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "Z"}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{profileName}</span>
              <span className="block text-xs text-gray-400">{t(locale, "profile")}</span>
            </span>
          )}
          {collapsed && <UserRound className="sr-only" />}
        </button>
      </div>
    </nav>
  );
}
