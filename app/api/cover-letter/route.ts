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

    const systemPrompt = `You are an expert career coach. Write a professional cover letter in plain industry-standard format.

FORMAT:
[City, Date]

[Hiring Manager Name or 'Hiring Manager']
[Company Name]

Dear Hiring Manager,

[PARAGRAPH 1 - Opening: Why this role and company, show genuine interest, 2-3 sentences]

[PARAGRAPH 2 - Value: 2-3 specific skills and achievements that match the job requirements, use numbers where possible, 3-4 sentences]

[PARAGRAPH 3 - Fit: Why you are the right person, what you will bring to the team, 2-3 sentences]

[PARAGRAPH 4 - Closing: Thank them, call to action, 2 sentences]

Sincerely,
[Candidate Name from CV]

RULES:
- Plain text only, no bullet points, no bold, no markdown
- Professional and concise tone
- Under 300 words total
- Extract candidate name and city from CV if available
- Sound human and natural`;

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
