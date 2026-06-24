import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { role, location } = await req.json();

    if (!role || !location) {
      return NextResponse.json(
        { error: "role and location are required" },
        { status: 400 }
      );
    }

    const prompt = `Generate 3 realistic and distinct job descriptions for the role "${role}" in "${location}".

Return a JSON array with exactly 3 objects. Each object must have:
- "title": string (job title with a seniority variant, e.g. "Senior", "Lead", "Mid-level")
- "company": string (realistic company name — vary the type: startup, scale-up, enterprise)
- "text": string (full job description, 250-350 words, written in natural prose covering: company overview, role summary, key responsibilities (5-6 bullet points), required skills/experience (6-8 bullet points), and nice-to-have (3-4 bullet points))

Make each JD meaningfully different in focus, seniority, and company culture. Return only valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content ?? "[]";
    const cleaned = content
      .replace(/```json\n?|```\n?/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .trim();
    const jds = JSON.parse(cleaned);

    return NextResponse.json({ jds });
  } catch (err) {
    console.error("fetch-jds error:", err);
    return NextResponse.json(
      { error: "Failed to fetch job descriptions" },
      { status: 500 }
    );
  }
}
