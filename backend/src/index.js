import express from "express";
import cors from "cors";
import "dotenv/config";
import { initDb } from "./db/client.js";

import analyzeRouter from "./routes/analyze.js";
import parseCvRouter from "./routes/parse-cv.js";
import generateCvRouter from "./routes/generate-cv.js";
import aiCvChatRouter from "./routes/ai-cv-chat.js";
import coverLetterRouter from "./routes/cover-letter.js";
import rewriteCvRouter from "./routes/rewrite-cv.js";
import fetchJdsRouter from "./routes/fetch-jds.js";
import historyRouter from "./routes/history.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/analyze", analyzeRouter);
app.use("/api/parse-cv", parseCvRouter);
app.use("/api/generate-cv", generateCvRouter);
app.use("/api/ai-cv-chat", aiCvChatRouter);
app.use("/api/cover-letter", coverLetterRouter);
app.use("/api/rewrite-cv", rewriteCvRouter);
app.use("/api/fetch-jds", fetchJdsRouter);
app.use("/api/history", historyRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, async () => {
  console.log(`CareerLens backend running on http://localhost:${PORT}`);
  if (process.env.DATABASE_URL) {
    try {
      await initDb();
    } catch (err) {
      console.error("DB init failed:", err.message);
    }
  } else {
    console.warn("DATABASE_URL not set â€” DB features disabled");
  }
});
