import { generateOpenAIResponse, streamOpenAIResponse } from "../services/openaiService.js";
import { generateGeminiResponse, streamGeminiResponse } from "../services/geminiService.js";
import { generateOpenRouterResponse, streamOpenRouterResponse } from "../services/openrouterService.js";

const providers = {
  openai: { generate: generateOpenAIResponse, stream: streamOpenAIResponse, label: "OpenAI" },
  gemini: { generate: generateGeminiResponse, stream: streamGeminiResponse, label: "Gemini" },
  openrouter: { generate: generateOpenRouterResponse, stream: streamOpenRouterResponse, label: "OpenRouter" },
};

function providerErrorMessage(error, provider) {
  const status = error?.status || error?.statusCode;
  const label = providers[provider]?.label || "AI provider";

  if (status === 429 || error?.code === 429) {
    return `${label} rate limit or quota has been exceeded. Try again later or switch providers.`;
  }
  if (status === 401 || status === 403 || error?.code === 401 || error?.code === 403) {
    return "AI provider authentication failed. Check the server API key configuration.";
  }
  if (status === 503) {
    return "The selected AI provider is temporarily unavailable. Try again or switch providers.";
  }
  return "Zirak could not generate a response. Please try again.";
}

export async function chatController(req, res) {
  try {
    const { message, provider = "openai", history = [], stream = false } = req.body ?? {};
    const selectedProvider = providers[provider];

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required." });
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
    if (!selectedProvider) {
      return res.status(400).json({ success: false, error: `Unsupported AI provider: ${provider}` });
    }

    if (stream === true) {
      res.status(200);
      res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const abortController = new AbortController();
      const abortOnDisconnect = () => {
        if (!res.writableEnded) abortController.abort();
      };
      res.on("close", abortOnDisconnect);

      try {
        for await (const delta of selectedProvider.stream(message, history, { signal: abortController.signal })) {
          if (res.destroyed) return;
          res.write(JSON.stringify({ delta }) + "\n");
        }
        if (!res.destroyed) res.write(JSON.stringify({ done: true }) + "\n");
      } catch (error) {
        console.error("Streaming chat error:", {
          provider,
          status: error?.status,
          code: error?.code,
        });
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
    console.error("Chat error:", {
      provider: req.body?.provider,
      status: error?.status,
      code: error?.code,
    });
    const status = error?.status || error?.statusCode;
    const httpStatus = status === 429 ? 429 : status === 401 ? 401 : status === 403 ? 403 : status === 503 ? 503 : 500;
    return res.status(httpStatus).json({
      success: false,
      error: providerErrorMessage(error, req.body?.provider),
    });
  }
}
