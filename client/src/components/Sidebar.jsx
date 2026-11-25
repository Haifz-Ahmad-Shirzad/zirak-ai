import { useState } from "react";
import { t } from "../i18n.js";
import {
  Plus,
  Settings,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Trash2,
  Pencil,
  Search,
  X,
} from "lucide-react";

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  locale = "en",
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
        className="flex-1 overflow-y-auto mt-4 px-2"
        aria-label={t(locale, "chatHistory")}
      >
        {filteredConversations.map((conv) => (
          <li key={conv.id}>
            <div className="relative group">
              <button
                type="button"
                onClick={() => onConversationSelect(conv.id)}
                title={collapsed ? conv.title : undefined}
                className={`w-full min-h-10 flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm ${
                  activeConversationId === conv.id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800 cursor-pointer"
                }`}
                aria-current={activeConversationId === conv.id ? "page" : undefined}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 truncate">
                  {!collapsed &&
                    (editingConversationId === conv.id ? (
                      <input
                        type="text"
                        aria-label="Edit conversation title"
                        defaultValue={conv.title}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) =>
                          onUpdateConversationTitle(conv.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onUpdateConversationTitle(conv.id, e.target.value);
                          } else if (e.key === "Escape") {
                            onCancelEditConversation();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-600 text-white w-full rounded px-1 -my-1 text-sm focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    ))}
                </div>
              </button>
              {!collapsed &&
                editingConversationId !== conv.id &&
                activeConversationId === conv.id && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditConversation(conv.id);
                      }}
                      className="min-h-10 min-w-10 rounded-lg hover:bg-gray-600"
                      aria-label={t(locale, "editTitle")}
                    >
                      <Pencil className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="min-h-10 min-w-10 rounded-lg hover:bg-gray-600"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                )}
            </div>
          </li>
        ))}
      </ul>

      <div className="p-3 border-t border-gray-700" role="group" aria-label="Account actions">
        <button
          type="button"
          className="flex items-center gap-3 px-3 py-2 w-full min-h-10 rounded-lg hover:bg-gray-800 text-sm"
          aria-label={collapsed ? t(locale, "settings") : undefined}
          title={collapsed ? t(locale, "settings") : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && t(locale, "settings")}
        </button>
        <button
          type="button"
          className="flex items-center gap-3 px-3 py-2 w-full min-h-10 rounded-lg hover:bg-gray-800 text-sm text-red-400"
          aria-label={collapsed ? t(locale, "logout") : undefined}
          title={collapsed ? t(locale, "logout") : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && t(locale, "logout")}
        </button>
      </div>
    </nav>
  );
}
