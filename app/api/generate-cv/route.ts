import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { CVPDFData } from "@/lib/generateCVPDF";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface EnhancedResponse {
  summary: string;
  experience: CVPDFData["experience"];
  skillSuggestions: Record<string, string[]>;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const formData = (await req.json()) as CVPDFData;

    const experienceSummary = formData.experience
      .map(
        (e) =>
          `${e.title} at ${e.company} (${e.duration}):\n${e.bullets.join("\n")}`
      )
      .join("\n\n");

    const currentSkills = formData.skills
      .map((s) => `${s.category}: ${s.items.join(", ")}`)
      .join("\n");

    const prompt = `You are an expert CV writer. Enhance the following CV content for maximum impact and ATS optimization.

CURRENT SUMMARY:
${formData.summary || "(no summary provided)"}

EXPERIENCE:
${experienceSummary || "(no experience provided)"}

CURRENT SKILLS:
${currentSkills || "(no skills provided)"}

TASKS:
1. Rewrite the summary as a strong 3-4 sentence professional paragraph with impact-focused language.
2. Rewrite each experience bullet with strong action verbs (Led, Developed, Increased, Reduced, Delivered, Architected, Spearheaded, Optimized) and add specific metrics or outcomes where reasonable.
3. For each skill category below, suggest 1-2 additional skills that are genuinely implied by the experience. Use empty arrays for irrelevant categories.

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "summary": "enhanced summary paragraph",
  "experience": [
    {
      "title": "exact job title",
      "company": "exact company",
      "duration": "exact duration",
      "bullets": ["enhanced bullet 1", "enhanced bullet 2"]
    }
  ],
  "skillSuggestions": {
    "Frontend": [],
    "Backend": [],
    "Database": [],
    "Deployment": [],
    "Automation": [],
    "Frameworks": [],
    "Tools": []
  }
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2500,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();

    let enhanced: Partial<EnhancedResponse> = {};
    try {
      enhanced = JSON.parse(cleaned) as EnhancedResponse;
    } catch {
      enhanced = {};
    }

    const mergedSkills = formData.skills.map((sk) => {
      const suggestions: string[] = enhanced.skillSuggestions?.[sk.category] ?? [];
      const existing = new Set(sk.items.map((i) => i.toLowerCase()));
      const newItems = suggestions.filter((s) => !existing.has(s.toLowerCase()));
      return { ...sk, items: [...sk.items, ...newItems] };
    });

    const result: CVPDFData = {
      ...formData,
      summary:
        enhanced.summary && enhanced.summary.trim()
          ? enhanced.summary
          : formData.summary,
      experience:
        enhanced.experience && enhanced.experience.length > 0
          ? enhanced.experience
          : formData.experience,
      skills: mergedSkills,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.log("Generate CV error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate CV" },
      { status: 500 }
    );
  }
}
