import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { cvText, jds } = req.body;

    if (!cvText || !jds || jds.length < 5) {
      return res.status(400).json({ error: "Need at least 5 job descriptions" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const jdBlock = jds
      .slice(0, 10)
      .map((jd, i) => `JD ${i + 1} — ${jd.title} @ ${jd.company}:\n${jd.text}`)
      .join("\n\n---\n\n");

    const prompt = `You are an expert ATS and career coach. Analyze this CV against ${jds.length} job descriptions.

CV:
${cvText}

JOB DESCRIPTIONS:
${jdBlock}

Return ONLY valid JSON matching this exact schema:
{
  "match_score": <0-100 integer, overall match across all JDs>,
  "ats_score": <0-100 integer, ATS parse-ability score>,
  "jd_title": "<title of best-matching JD>",
  "summary": "<2-3 sentence overall assessment>",
  "strong_points": [<exactly 10 strings, specific strengths>],
  "weak_points": [<exactly 10 strings, specific gaps/improvements>],
  "per_jd_scores": [
    {
      "title": "<JD title>",
      "company": "<company>",
      "score": <0-100>,
      "key_match": "<one key match phrase>",
      "key_gap": "<one key gap phrase>"
    }
  ],
  "ats_tips": [<exactly 4 strings, ATS improvement tips>],
  "keywords": [
    { "word": "<keyword>", "in_cv": <true|false> }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const analysis = JSON.parse(raw);

    return res.json({ analysis });
  } catch (err) {
    console.error("analyze error:", err);
    return res.status(500).json({ error: "Analysis failed" });
  }
});

export default router;
