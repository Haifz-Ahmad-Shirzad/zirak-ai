import { useState } from "react";
import { Send, Square } from "lucide-react";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea.js";

export default function ChatInput({ onSend, onStop, disabled }) {
  const [input, setInput] = useState("");
  const textareaRef = useAutoResizeTextarea(input);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 px-6 py-4">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 disabled:opacity-50"
          style={{ maxHeight: "200px" }}
        />
        {disabled ? (
          <button
            onClick={onStop}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors shrink-0"
            aria-label="Stop generating"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-white transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
