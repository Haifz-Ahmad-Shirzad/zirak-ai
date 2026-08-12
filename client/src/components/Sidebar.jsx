import { useState } from "react";
import {
  Plus,
  Settings,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Trash2,
  Pencil,
  Search,
} from "lucide-react";

export default function Sidebar({
  collapsed,
  setCollapsed,
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
      className={`${
        collapsed
          ? "-translate-x-full md:translate-x-0 md:w-16"
          : "translate-x-0 md:w-64"
      } fixed md:static z-20 w-64 bg-gray-900 h-full flex flex-col text-gray-200 transition-all duration-300 border-r border-gray-700`}
    >
      {/* Toggle + Brand */}
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!collapsed && <span className="font-semibold text-lg">Zirak AI</span>}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-700 rounded"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* New Chat */}
      <button
        onClick={onNewChat}
        aria-label={collapsed ? "New Chat" : undefined}
        className="flex items-center gap-2 mx-3 mt-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
      >
        <Plus className="w-4 h-4" />
        {!collapsed && "New Chat"}
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Conversations */}
      <ul
        className="flex-1 overflow-y-auto mt-4 px-2"
        aria-label="Chat history"
      >
        {filteredConversations.map((conv) => (
          <li key={conv.id}>
            <div className="relative group">
              <button
                onClick={() => onConversationSelect(conv.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm ${
                  activeConversationId === conv.id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800 cursor-pointer"
                }`}
                aria-current={
                  activeConversationId === conv.id ? "true" : "false"
                }
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
                            onCancelEditConversation(); // Cancel editing
                          }
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent button click while editing
                        className="bg-gray-600 text-white w-full rounded px-1 -my-1 text-sm focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    ))}{" "}
                </div>
              </button>
              {!collapsed &&
                editingConversationId !== conv.id &&
                activeConversationId === conv.id && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditConversation(conv.id);
                      }}
                      className="p-1 rounded hover:bg-gray-600"
                      aria-label="Edit title"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1 rounded hover:bg-gray-600"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
            </div>
          </li>
        ))}
      </ul>

      {/* Bottom Actions */}
      <div
        className="p-3 border-t border-gray-700"
        role="group"
        aria-label="Account actions"
      >
        <button
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-gray-800 text-sm"
          aria-label={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4" />
          {!collapsed && "Settings"}
        </button>

        <button
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-gray-800 text-sm text-red-400"
          aria-label={collapsed ? "Log out" : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Log out"}
        </button>
      </div>
    </nav>
  );
}
