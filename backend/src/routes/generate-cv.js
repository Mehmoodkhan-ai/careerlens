import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert CV writer. Enhance the following CV data to be more professional and impactful.
Return ONLY valid JSON with the SAME structure as the input.

Rules:
1. Enhance the summary to be concise, punchy, 2-3 sentences
2. Rewrite experience bullets to start with strong action verbs and include quantified results where possible
3. Suggest additional relevant skills based on experience (keep existing ones)
4. Keep all personal info, education, projects, and certificates unchanged
5. Do not add fabricated data — only enhance what's there

INPUT CV DATA:
${JSON.stringify(data, null, 2)}

Return the enhanced CV data as JSON with the exact same structure.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const enhanced = JSON.parse(raw);

    return res.json(enhanced);
  } catch (err) {
    console.error("generate-cv error:", err);
    return res.status(500).json({ error: "CV enhancement failed" });
  }
});

export default router;
