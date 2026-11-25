import OpenAI from "openai";

const ZIRAK_SYSTEM_INSTRUCTION = `
You are Zirak AI, an AI assistant created by Hafiz Ahmad Shirzad.

Your name is Zirak AI.

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

export async function generateOpenRouterResponse(message, history = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const messages = [
    {
      role: "system",
      content: ZIRAK_SYSTEM_INSTRUCTION,
    },

    ...history.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content ?? ""),
    })),

    {
      role: "user",
      content: message,
    },
  ];

  const response = await client.chat.completions.create({
    model: "openrouter/free",
    messages,
  });

  return response.choices[0].message.content;
}


export async function* streamOpenRouterResponse(message, history = [], { signal } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const error = new Error("OpenRouter API key is not configured");
    error.status = 500;
    throw error;
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const messages = [
    { role: "system", content: ZIRAK_SYSTEM_INSTRUCTION },
    ...history.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content ?? ""),
    })),
    { role: "user", content: message },
  ];

  const stream = await client.chat.completions.create({
    model: "openrouter/free",
    messages,
    stream: true,
  }, { signal });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta.length > 0) yield delta;
  }
}
