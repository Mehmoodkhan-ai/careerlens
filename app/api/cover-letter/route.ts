import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const { candidateName, jobTitle, company, cvText, jdText } = await req.json() as {
      candidateName?: string;
      jobTitle?: string;
      company?: string;
      cvText?: string;
      jdText?: string;
    };

    if (!candidateName || !jobTitle || !company || !cvText) {
      return NextResponse.json(
        { error: "candidateName, jobTitle, company, and cvText are required" },
        { status: 400 }
      );
    }

    const truncatedCV = cvText.slice(0, 1500);
    const truncatedJD = jdText ? jdText.slice(0, 400) : "Not provided";

    const systemPrompt = `You are an expert career coach who writes highly effective cover letters with a 98% interview callback rate.

Write a cover letter using this proven structure:

PARAGRAPH 1 - HOOK (2-3 sentences):
- Never start with 'I am applying for'
- Start with a specific achievement or insight that connects to the role
- Show you understand the company's mission/product

PARAGRAPH 2 - VALUE PROPOSITION (3-4 sentences):
- Mention 2-3 specific achievements with numbers/metrics where possible
- Directly reference technologies and skills from the job description
- Show impact, not just responsibilities

PARAGRAPH 3 - WHY THIS COMPANY (2-3 sentences):
- Reference something specific about the company
- Connect their mission to your personal goals
- Show genuine interest, not desperation

CLOSING (2 sentences):
- Confident call to action
- Professional sign-off

RULES:
- Never use generic phrases like 'I am a hard worker', 'team player', 'passionate'
- Always use active voice
- Keep total length under 350 words
- Make it specific to the JD and CV provided
- Sound human, not robotic
- Extract candidate name from CV if available`;

    const userPrompt = `Write a cover letter for ${candidateName} applying for ${jobTitle} at ${company}.

CV:
${truncatedCV}

Job Description:
${truncatedJD}

Return ONLY the cover letter text, no extra commentary.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: false,
    });

    const letter = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ letter });
  } catch (err) {
    console.log("Cover letter error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
