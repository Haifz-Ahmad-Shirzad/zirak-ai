import { GoogleGenAI } from "@google/genai";

const ZIRAK_SYSTEM_INSTRUCTION = `
You are Zirak AI, an AI assistant created by Hafiz Ahmad Shirzad.

Your name is Zirak AI.

Gemini is the underlying AI model/provider you use.
Your assistant identity is Zirak AI.

You help users with:

- Programming
- Software engineering
- Computer science
- Web development
- Mobile development
- Debugging
- University subjects
- Research
- General knowledge

Be accurate, helpful, clear, and practical.

When the user asks about an existing project, work with their existing
project and the information provided in the conversation.

When the user asks to complete something step by step, proceed
incrementally and don't unnecessarily create a different project.

If you don't know something about the user's project, ask for the
relevant file or information instead of guessing.
`;

export async function generateGeminiResponse(message, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error("Gemini API key is not configured");
    error.status = 500;
    throw error;
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  // Convert frontend messages into Gemini format.
  const contents = [
    ...history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: String(item.content ?? ""),
        },
      ],
    })),

    {
      role: "user",
      parts: [
        {
          text: message,
        },
      ],
    },
  ];

  console.log("===== ZIRAK DEBUG =====");
  console.log("Current message:", message);
  console.log("History messages:", history.length);
  console.log("=======================");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",

      config: {
        systemInstruction: ZIRAK_SYSTEM_INSTRUCTION,
      },

      contents,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API error:", {
      status: error?.status,
      code: error?.code,
      message: error?.message,
    });

    // Preserve Gemini's HTTP status for the controller.
    if (error?.status) {
      const apiError = new Error(error.message || "Gemini API request failed");

      apiError.status = error.status;
      apiError.code = error.code;

      throw apiError;
    }

    throw error;
  }
}


export async function* streamGeminiResponse(message, history = [], attachments = [], { signal } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured");
    error.status = 500;
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey });
  const toParts = (text, files = []) => [
    ...(text ? [{ text }] : []),
    ...files.map((file) => ({
      inlineData: {
        mimeType: file.type,
        data: file.data.slice(file.data.indexOf(",") + 1),
      },
    })),
  ];
  const contents = [
    ...history
      .filter((item) => item.content || item.attachments?.length)
      .map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: toParts(String(item.content ?? ""), item.attachments || []),
      })),
    { role: "user", parts: toParts(message, attachments) },
  ];

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      config: { systemInstruction: ZIRAK_SYSTEM_INSTRUCTION, abortSignal: signal },
      contents,
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error) {
    if (error?.status) {
      const apiError = new Error(error.message || "Gemini API request failed");
      apiError.status = error.status;
      apiError.code = error.code;
      throw apiError;
    }
    throw error;
  }
}
