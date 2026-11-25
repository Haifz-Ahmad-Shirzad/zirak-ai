import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json({ limit: "1mb" }));

const chatWindowMs = 60_000;
const chatRequestLimit = Math.max(1, Number(process.env.CHAT_RATE_LIMIT) || 20);
const chatRequests = new Map();

app.use("/api/chat", (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = chatRequests.get(key);

  if (!current || now - current.startedAt >= chatWindowMs) {
    chatRequests.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (current.count >= chatRequestLimit) {
    return res.status(429).json({
      success: false,
      error: "Too many chat requests. Please wait a minute and try again.",
    });
  }

  current.count += 1;
  return next();
});

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - chatWindowMs;
  for (const [key, value] of chatRequests) {
    if (value.startedAt < cutoff) chatRequests.delete(key);
  }
}, chatWindowMs);
cleanupTimer.unref();

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Zirak AI server is running",
  });
});

app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Zirak AI server running on http://localhost:${PORT}`);
});
