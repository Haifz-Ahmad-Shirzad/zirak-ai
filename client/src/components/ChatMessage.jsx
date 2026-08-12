import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard.js";
import { useFeedback } from "../hooks/useFeedback.js";
import CodeBlock from "./CodeBlock";
import {
  Pencil,
  Clipboard,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";

export default function ChatMessage({
  message,
  isLastUserMessage,
  onStartEdit,
  isEditing,
  onCancelEdit,
  onSaveEdit,
  onFeedback,
}) {
  if (!message) return null;

  const { role, content = "", error } = message;
  const isUser = role === "user";
  const [editText, setEditText] = useState(content);
  const [isCopied, handleCopy] = useCopyToClipboard();
  const [feedback, handleFeedback] = useFeedback(
    message.feedback,
    onFeedback,
    message.id,
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit(editText);
    }
  };

  return (
    <div
      className={`py-6 px-6 flex gap-4 ${
        isUser ? "bg-gray-950" : "bg-gray-800/50"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
        <span role="img" aria-label={isUser ? "User" : "AI Assistant"}>
          {isUser ? "🧑" : "🤖"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              aria-label="Edit your message"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-700 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={Math.max(3, editText.split("\n").length)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => onSaveEdit(editText)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Save & Submit
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} />
            <div>
              <p className="font-bold">An error occurred:</p>
              <p>{content}</p>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none group relative">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }) {
                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock className={className}>{children}</CodeBlock>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleCopy(content)}
                className="p-1 rounded-md bg-gray-700 text-gray-400 hover:text-white"
                aria-label="Copy message"
                disabled={isCopied}
              >
                {isCopied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Clipboard size={14} />
                )}
              </button>
              {isUser ? (
                isLastUserMessage && (
                  <button
                    onClick={() => onStartEdit(message)}
                    className="p-1 rounded-md bg-gray-700 text-gray-400 hover:text-white"
                    aria-label="Edit message"
                  >
                    <Pencil size={14} />
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() => handleFeedback("like")}
                    className={`p-1 rounded-md bg-gray-700 text-gray-400 hover:text-white ${feedback === "like" ? "text-blue-400" : ""}`}
                    aria-label="Like response"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => handleFeedback("dislike")}
                    className={`p-1 rounded-md bg-gray-700 text-gray-400 hover:text-white ${feedback === "dislike" ? "text-red-400" : ""}`}
                    aria-label="Dislike response"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
