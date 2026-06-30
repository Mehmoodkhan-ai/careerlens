import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

const QUESTION_TOPICS = [
  "personal contact information",
  "work experience",
  "projects",
  "technical skills",
  "education background",
  "certifications and courses",
];

const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Deployment",
  "Automation",
  "Frameworks",
  "Tools",
];

router.post("/", async (req, res) => {
  try {
    const { action, role, messages, log } = req.body;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    if (action === "respond") {
      const systemPrompt = `You are a friendly, professional CV assistant helping collect information for a ${role} CV.
You are asking about: ${QUESTION_TOPICS.join(", ")}.
Ask one focused follow-up question at a time. Be encouraging and concise.
Evaluate the user's answer briefly (1 sentence), then ask the next relevant question.
Keep responses under 80 words.`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 140,
      });

      const reply = completion.choices[0]?.message?.content ?? "";
      return res.json({ reply });

    } else if (action === "structure") {
      const conversation = log
        .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
        .join("\n");

      const prompt = `Based on this CV interview conversation, extract and structure all the information into a CV JSON.

Target role: ${role}
Conversation:
${conversation}

Return ONLY valid JSON matching this exact structure:
{
  "personalInfo": {
    "name": "", "title": "", "email": "", "phone": "",
    "location": "", "portfolio": "", "github": "", "linkedin": ""
  },
  "summary": "",
  "skills": [
    ${SKILL_CATEGORIES.map((c) => `{"category": "${c}", "items": []}`).join(",\n    ")}
  ],
  "experience": [
    {"title": "", "company": "", "duration": "", "bullets": []}
  ],
  "projects": [
    {"name": "", "liveLink": "", "description": "", "techStack": ""}
  ],
  "education": [
    {"degree": "", "institution": "", "dates": ""}
  ],
  "certificates": [
    {"issuer": "", "date": "", "names": []}
  ]
}

Fill in only what was mentioned. Leave empty strings/arrays for missing info. The title should match the role: "${role}".`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const structured = JSON.parse(raw);
      return res.json({ structured });

    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error("ai-cv-chat error:", err);
    return res.status(500).json({ error: "AI chat failed" });
  }
});

export default router;
