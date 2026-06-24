import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface RewriteSuggestion {
  weak_point: string;
  rewritten: string;
}

export async function POST(req: NextRequest) {
  try {
    const { cvText, weakPoints, jdContext } = await req.json();

    if (!cvText || !weakPoints || !Array.isArray(weakPoints) || weakPoints.length === 0) {
      return NextResponse.json(
        { error: "cvText and weakPoints are required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert CV writer and career coach. A candidate's CV has been analysed and the following weak points were identified relative to their target job descriptions.

For each weak point, write a specific, improved CV bullet point that:
- Directly addresses that weakness
- Uses a strong action verb
- Includes quantifiable results where plausible (estimate if needed)
- Is concise (one sentence, under 20 words)
- Sounds natural and is tailored to the job context

CV text (for context):
${cvText.slice(0, 3000)}

Job description context:
${jdContext.slice(0, 1500)}

Weak points to address:
${weakPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

Return a JSON object with:
- "suggestions": array with one object per weak point, in the same order:
    - "weak_point": string (the original weak point, verbatim)
    - "rewritten": string (the improved CV bullet point — start directly with the action verb, no leading dash or bullet character)

Return only valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = content
      .replace(/```json\n?|```\n?/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .trim();
    const data = JSON.parse(cleaned) as { suggestions: RewriteSuggestion[] };

    return NextResponse.json(data);
  } catch (err) {
    console.error("rewrite-cv error:", err);
    return NextResponse.json(
      { error: "Failed to generate rewrite suggestions" },
      { status: 500 }
    );
  }
}
