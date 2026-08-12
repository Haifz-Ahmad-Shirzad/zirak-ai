import { Clipboard, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard.js";

export default function CodeBlock({ className, children }) {
  const [isCopied, handleCopy] = useCopyToClipboard();

  // The children prop is the raw code string.
  const code = String(children).replace(/\n$/, "");

  // Extract language from className (e.g., 'language-javascript')
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  return (
    <div className="relative bg-gray-900 rounded-lg my-4 text-sm">
      <div className="flex items-center justify-between px-4 py-1 bg-gray-800 rounded-t-lg">
        <span className="text-xs text-gray-400">{language}</span>
        <button
          onClick={() => handleCopy(code)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:cursor-not-allowed"
          disabled={isCopied}
        >
          {isCopied ? <Check size={14} /> : <Clipboard size={14} />}
          {isCopied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
        codeTagProps={{ style: { fontFamily: "inherit" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
