import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { candidateName, jobTitle, company, cvText, jdText } = await req.json();

    if (!candidateName || !jobTitle || !company || !cvText) {
      return NextResponse.json(
        { error: "candidateName, jobTitle, company, and cvText are required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert career coach writing a tailored cover letter.

Candidate name: ${candidateName}
Target role: ${jobTitle}
Target company: ${company}

CV (for context):
${cvText.slice(0, 3000)}

Job description (for context):
${jdText ? jdText.slice(0, 1500) : "Not provided"}

Write a professional, compelling 3-paragraph cover letter. Structure:
- Paragraph 1 (3-4 sentences): Hook opening that names the specific role, states genuine interest in the company, and summarises fit in one strong sentence.
- Paragraph 2 (4-5 sentences): Highlight 2-3 concrete achievements from the CV that directly map to the JD requirements. Use specific numbers/outcomes where they appear in the CV.
- Paragraph 3 (2-3 sentences): Express enthusiasm, mention next steps (interview), and a professional sign-off line.

Tone: confident, specific, not generic. Avoid phrases like "I am writing to apply" or "I believe I would be a great fit".
Do NOT include a salutation line ("Dear Hiring Manager") or a formal closing ("Yours sincerely") — just the three paragraphs.

Return a JSON object with:
- "letter": string (the full cover letter, paragraphs separated by \\n\\n)

Return only valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = content
      .replace(/```json\n?|```\n?/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .trim();
    const data = JSON.parse(cleaned) as { letter: string };

    return NextResponse.json(data);
  } catch (err) {
    console.error("cover-letter error:", err);
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
