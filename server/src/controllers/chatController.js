import { generateOpenAIResponse, streamOpenAIResponse } from "../services/openaiService.js";
import { generateGeminiResponse, streamGeminiResponse } from "../services/geminiService.js";
import { generateOpenRouterResponse, streamOpenRouterResponse } from "../services/openrouterService.js";

const providers = {
  openai: { generate: generateOpenAIResponse, stream: streamOpenAIResponse, label: "OpenAI" },
  gemini: { generate: generateGeminiResponse, stream: streamGeminiResponse, label: "Gemini" },
  openrouter: { generate: generateOpenRouterResponse, stream: streamOpenRouterResponse, label: "OpenRouter" },
};
const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_ATTACHMENTS = 4;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

function validateAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) {
    return { error: "Attach up to 4 files per request." };
  }
  let totalBytes = 0;
  for (const file of attachments) {
    if (!file || typeof file.name !== "string" || file.name.length > 200 ||
        typeof file.type !== "string" || !ALLOWED_FILE_TYPES.has(file.type) ||
        typeof file.data !== "string") {
      return { error: "One of the attached files is not supported." };
    }
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(file.data);
    if (!match || match[1] !== file.type) return { error: "An attached file could not be read." };
    const signature = match[2];
    const hasValidSignature = file.type === "image/jpeg" ? signature.startsWith("/9j/")
      : file.type === "image/png" ? signature.startsWith("iVBORw0KGgo")
      : file.type === "image/webp" ? signature.startsWith("UklGR")
      : signature.startsWith("JVBERi0");
    if (!hasValidSignature) return { error: "The file contents do not match the selected file type." };
    const bytes = Math.floor(match[2].length * 3 / 4) - (match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0);
    const perFileLimit = file.type === "application/pdf" ? MAX_TOTAL_BYTES : 5 * 1024 * 1024;
    if (bytes > perFileLimit) return { error: "An attached file exceeds the size limit." };
    totalBytes += bytes;
  }
  if (totalBytes > MAX_TOTAL_BYTES) return { error: "Attached files must total 10 MB or less." };
  return { attachments, totalBytes };
}

function providerErrorMessage(error, provider) {
  const status = error?.status || error?.statusCode;
  const label = providers[provider]?.label || "AI provider";
  if (status === 429 || error?.code === 429) return `${label} rate limit or quota has been exceeded. Try again later or switch providers.`;
  if (status === 401 || status === 403 || error?.code === 401 || error?.code === 403) return "AI provider authentication failed. Check the server API key configuration.";
  if (status === 503) return "The selected AI provider is temporarily unavailable. Try again or switch providers.";
  return error?.status === 400 ? error.message : "Zirak could not generate a response. Please try again.";
}

export async function chatController(req, res) {
  try {
    const { message, provider = "openai", history = [], attachments = [], stream = false } = req.body ?? {};
    const selectedProvider = providers[provider];

    if (!Array.isArray(attachments)) {
      return res.status(400).json({ success: false, error: "Attachments must be a file list." });
    }
    if (typeof message !== "string" || (!message.trim() && attachments.length === 0)) {
      return res.status(400).json({ success: false, error: "Enter a message or attach a file." });
    }
    if (message.length > 16000) {
      return res.status(413).json({ success: false, error: "Message is too long. Keep it under 16,000 characters." });
    }
    if (!Array.isArray(history) || history.length > 80) {
      return res.status(400).json({ success: false, error: "History must be an array with no more than 80 messages." });
    }
    if (!history.every((item) =>
      item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.length <= 16000
    )) {
      return res.status(400).json({ success: false, error: "Each history item must contain a valid role and text content." });
    }

    const currentFiles = validateAttachments(attachments);
    if (currentFiles.error) return res.status(400).json({ success: false, error: currentFiles.error });
    const historyFiles = [];
    for (const item of history) {
      const result = validateAttachments(item.attachments || []);
      if (result.error) return res.status(400).json({ success: false, error: result.error });
      historyFiles.push(...result.attachments);
    }
    if (currentFiles.totalBytes + historyFiles.reduce((sum, file) => {
      const encoded = file.data.split(",")[1] || "";
      return sum + Math.floor(encoded.length * 3 / 4) - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
    }, 0) > MAX_TOTAL_BYTES) {
      return res.status(413).json({ success: false, error: "Files attached in this conversation exceed the 10 MB request limit. Start a new chat or remove older attachments." });
    }

    if (!selectedProvider) {
      return res.status(400).json({ success: false, error: `Unsupported AI provider: ${provider}` });
    }
    if (provider === "openrouter" && (attachments.length > 0 || historyFiles.length > 0)) {
      return res.status(400).json({ success: false, error: "Image and PDF attachments are available with OpenAI or Gemini. Please switch providers." });
    }
    if ((attachments.length > 0 || historyFiles.length > 0) && stream !== true) {
      return res.status(400).json({ success: false, error: "Attachments require streamed chat requests." });
    }

    if (stream === true) {
      res.status(200);
      res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const abortController = new AbortController();
      const abortOnDisconnect = () => { if (!res.writableEnded) abortController.abort(); };
      res.on("close", abortOnDisconnect);

      try {
        for await (const delta of selectedProvider.stream(message, history, attachments, { signal: abortController.signal })) {
          if (res.destroyed) return;
          res.write(JSON.stringify({ delta }) + "\n");
        }
        if (!res.destroyed) res.write(JSON.stringify({ done: true }) + "\n");
      } catch (error) {
        console.error("Streaming chat error:", { provider, status: error?.status, code: error?.code });
        if (!res.destroyed) {
          res.write(JSON.stringify({ error: providerErrorMessage(error, provider) }) + "\n");
        }
      } finally {
        res.off("close", abortOnDisconnect);
        if (!res.destroyed) res.end();
      }
      return;
    }

    const response = await selectedProvider.generate(message, history);
    return res.json({ success: true, provider, message: response });
  } catch (error) {
    console.error("Chat error:", { provider: req.body?.provider, status: error?.status, code: error?.code });
    const status = error?.status || error?.statusCode;
    const httpStatus = status === 429 ? 429 : status === 401 ? 401 : status === 403 ? 403 : status === 503 ? 503 : 500;
    return res.status(httpStatus).json({ success: false, error: providerErrorMessage(error, req.body?.provider) });
  }
}
