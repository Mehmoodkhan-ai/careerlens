import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { candidateName, jobTitle, company, cvText, jdText } = req.body;

    if (!candidateName || !jobTitle || !company) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Write a professional cover letter for the following candidate.

Candidate Name: ${candidateName}
Job Title: ${jobTitle}
Company: ${company}

CV Summary:
${cvText?.slice(0, 2000) ?? "Not provided"}

Job Description:
${jdText?.slice(0, 1500) ?? "Not provided"}

Requirements:
- Industry-standard cover letter format
- Under 300 words
- 3 paragraphs: opening hook, value proposition with specific skills/achievements, closing CTA
- Professional but personable tone
- No placeholders or brackets
- Plain text only, no markdown`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 500,
    });

    const letter = completion.choices[0]?.message?.content ?? "";
    return res.json({ letter });
  } catch (err) {
    console.error("cover-letter error:", err);
    return res.status(500).json({ error: "Cover letter generation failed" });
  }
});

export default router;
