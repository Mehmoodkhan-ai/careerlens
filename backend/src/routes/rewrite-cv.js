import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { cvText, weakPoints, jdContext } = req.body;

    if (!cvText || !weakPoints?.length) {
      return res.status(400).json({ error: "Missing cvText or weakPoints" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert CV rewriter. For each weak point, provide a specific rewrite suggestion for the CV.

CV:
${cvText.slice(0, 3000)}

Job Context: ${jdContext ?? "Not provided"}

Weak Points to Address:
${weakPoints.map((wp, i) => `${i + 1}. ${wp}`).join("\n")}

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "weak_point": "<original weak point>",
      "rewritten": "<specific improved version or addition for the CV>"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);
    return res.json(result);
  } catch (err) {
    console.error("rewrite-cv error:", err);
    return res.status(500).json({ error: "CV rewrite failed" });
  }
});

export default router;
