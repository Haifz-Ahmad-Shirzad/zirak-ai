import { useState } from "react";
import { Send, Square } from "lucide-react";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea.js";
import { t } from "../i18n.js";

export default function ChatInput({ onSend, onStop, disabled, locale = "en" }) {
  const [input, setInput] = useState("");
  const textareaRef = useAutoResizeTextarea(input);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 px-4 py-4 sm:px-6">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t(locale, "typeMessage")}
          aria-label={t(locale, "typeMessage")}
          rows={1}
          disabled={disabled}
          className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 disabled:opacity-50"
          style={{ maxHeight: "200px" }}
        />
        {disabled ? (
          <button
            type="button"
            onClick={onStop}
            className="min-h-11 min-w-11 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors shrink-0"
            aria-label={t(locale, "stopGenerating")}
            title={t(locale, "stopGenerating")}
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="min-h-11 min-w-11 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-white transition-colors shrink-0"
            aria-label={t(locale, "sendMessage")}
            title={t(locale, "sendMessage")}
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
