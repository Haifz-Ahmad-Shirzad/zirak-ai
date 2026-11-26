import OpenAI from "openai";

const MODEL = "qwen/qwen3.8-27b";

const ZIRAK_SYSTEM_INSTRUCTION = `
You are Zirak AI, an AI assistant created by Hafiz Ahmad Shirzad.

Your name is Zirak AI. Be accurate, helpful, clear, and practical.
Help with programming, software engineering, computer science, web and
mobile development, debugging, university subjects, research, and general
knowledge. Work with project context provided in the conversation, proceed
step by step when requested, and ask for relevant files or details instead
of guessing.
`;

function createClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error("Groq API key is not configured");
    error.status = 500;
    throw error;
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function buildMessages(message, history = [], attachments = []) {
  const contentFor = (text, files = []) => {
    if (files.length === 0) return text;
    return [
      ...(text ? [{ type: "text", text }] : []),
      ...files.map((file) => ({
        type: "image_url",
        image_url: { url: file.data },
      })),
    ];
  };

  return [
    { role: "system", content: ZIRAK_SYSTEM_INSTRUCTION },
    ...history
      .filter((item) => item.content || item.attachments?.length)
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: contentFor(String(item.content ?? ""), item.attachments || []),
      })),
    { role: "user", content: contentFor(message, attachments) },
  ];
}

export async function generateGroqResponse(message, history = [], attachments = []) {
  const client = createClient();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: buildMessages(message, history, attachments),
  });
  return response.choices[0]?.message?.content || "";
}

export async function* streamGroqResponse(message, history = [], attachments = [], { signal } = {}) {
  const client = createClient();
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: buildMessages(message, history, attachments),
    stream: true,
  }, { signal });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta.length > 0) yield delta;
  }
}
