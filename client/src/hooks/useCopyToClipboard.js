import { useState, useCallback } from "react";

export function useCopyToClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), timeout);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    },
    [timeout],
  );

  return [isCopied, handleCopy];
}
