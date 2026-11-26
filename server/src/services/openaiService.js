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

export async function generateOpenAIResponse(message, history = []) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error("OpenAI API key is not configured");

    error.status = 500;
    throw error;
  }

  const openai = new OpenAI({
    apiKey,
  });

  const input = [
    {
      role: "developer",
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

  console.log("===== OPENAI DEBUG =====");
  console.log("Current message:", message);
  console.log("History messages:", history.length);
  console.log("=======================");

  try {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input,
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned an empty response");
    }

    return response.output_text;
  } catch (error) {
    console.error("OpenAI API error:", {
      status: error?.status,
      code: error?.code,
      message: error?.message,
    });

    throw error;
  }
}


export async function* streamOpenAIResponse(message, history = [], attachments = [], { signal } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OpenAI API key is not configured");
    error.status = 500;
    throw error;
  }

  const openai = new OpenAI({ apiKey });
  const contentFor = (text, files = []) => [
    ...(text ? [{ type: "input_text", text }] : []),
    ...files.map((file) => file.type === "application/pdf"
      ? { type: "input_file", filename: file.name, file_data: file.data }
      : { type: "input_image", image_url: file.data }),
  ];
  const input = [
    { role: "developer", content: ZIRAK_SYSTEM_INSTRUCTION },
    ...history
      .filter((item) => item.content || item.attachments?.length)
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: contentFor(String(item.content ?? ""), item.attachments || []),
      })),
    { role: "user", content: contentFor(message, attachments) },
  ];

  const stream = await openai.responses.create({
    model: "gpt-5-mini",
    input,
    stream: true,
  }, { signal });

  for await (const event of stream) {
    if (event.type === "response.output_text.delta" && event.delta) yield event.delta;
  }
}
