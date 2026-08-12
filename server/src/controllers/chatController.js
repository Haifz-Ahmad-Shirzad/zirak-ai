import { generateOpenAIResponse } from "../services/openaiService.js";
import { generateGeminiResponse } from "../services/geminiService.js";
import { generateOpenRouterResponse } from "../services/openrouterService.js";

export async function chatController(req, res) {
  try {
    const { message, provider = "openai", history = [] } = req.body;

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Validate history
    if (!Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        error: "History must be an array",
      });
    }

    let response;

    // Select AI provider
    if (provider === "openai") {
      response = await generateOpenAIResponse(message, history);
    } else if (provider === "gemini") {
      response = await generateGeminiResponse(message, history);
    } else if (provider === "openrouter") {
      response = await generateOpenRouterResponse(message, history);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported AI provider: ${provider}`,
      });
    }

    return res.json({
      success: true,
      provider,
      message: response,
    });
  } catch (error) {
    console.error("Chat error:", error);

    const status = error?.status || error?.statusCode;

    /*
     * Rate limit / quota
     */
    if (status === 429 || error?.code === 429) {
      let providerName = "AI provider";

      if (req.body.provider === "gemini") {
        providerName = "Gemini";
      } else if (req.body.provider === "openrouter") {
        providerName = "OpenRouter";
      } else if (req.body.provider === "openai") {
        providerName = "OpenAI";
      }

      return res.status(429).json({
        success: false,
        error: `${providerName} rate limit or quota has been exceeded. Please try again later or switch to another AI provider.`,
      });
    }

    /*
     * Authentication
     */
    if (
      status === 401 ||
      status === 403 ||
      error?.code === 401 ||
      error?.code === 403
    ) {
      return res.status(status === 401 ? 401 : 403).json({
        success: false,
        error:
          "AI provider authentication failed. Please check your API key and configuration.",
      });
    }

    /*
     * Provider unavailable
     */
    if (status === 503) {
      return res.status(503).json({
        success: false,
        error:
          "The selected AI provider is temporarily unavailable. Please try again or switch to another provider.",
      });
    }

    /*
     * Generic error
     */
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate AI response",
    });
  }
}
