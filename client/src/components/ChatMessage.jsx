import { useState } from "react";
import { t } from "../i18n.js";
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
  locale = "en",
  isLastUserMessage,
  onStartEdit,
  isEditing,
  onCancelEdit,
  onSaveEdit,
  onFeedback,
}) {
  const safeMessage = message || { id: "", role: "assistant", content: "" };
  const { role, content = "", error } = safeMessage;
  const isUser = role === "user";
  const [editText, setEditText] = useState(content);
  const [isCopied, handleCopy] = useCopyToClipboard();
  const [feedback, handleFeedback] = useFeedback(
    safeMessage.feedback,
    onFeedback,
    safeMessage.id,
  );

  if (!message) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit(editText);
    }
  };

  return (
    <div
      className={`mx-auto w-full max-w-4xl py-6 px-4 sm:px-6 flex gap-4 ${
        isUser ? "bg-gray-950" : "bg-gray-800/50"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
        <span role="img" aria-label={t(locale, isUser ? "user" : "assistant")}>
          {isUser ? "🧑" : "🤖"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              aria-label={t(locale, "editMessage")}
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
                {t(locale, "saveSubmit")}
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-md"
              >
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} />
            <div>
              <p className="font-bold">{t(locale, "errorOccurred")}</p>
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
                aria-label={t(locale, "copyMessage")}
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
                    aria-label={t(locale, "editMessage")}
                  >
                    <Pencil size={14} />
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() => handleFeedback("like")}
                    className={`p-1 rounded-md bg-gray-700 text-gray-400 hover:text-white ${feedback === "like" ? "text-blue-400" : ""}`}
                    aria-label={t(locale, "like")}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => handleFeedback("dislike")}
                    className={`p-1 rounded-md bg-gray-700 text-gray-400 hover:text-white ${feedback === "dislike" ? "text-red-400" : ""}`}
                    aria-label={t(locale, "dislike")}
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
