import { Router } from "express";
import multer from "multer";
import path from "path";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const ext = path.extname(file.originalname).toLowerCase();
    let text = "";

    if (ext === ".txt") {
      text = file.buffer.toString("utf-8");
    } else if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.default.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else if (ext === ".pdf") {
      const pdfParse = await import("pdf-parse/lib/pdf-parse.js");
      const data = await pdfParse.default(file.buffer);
      text = data.text;
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use .pdf, .docx, or .txt" });
    }

    return res.json({ text });
  } catch (err) {
    console.error("parse-cv error:", err);
    return res.status(500).json({ error: "Failed to parse CV" });
  }
});

export default router;
