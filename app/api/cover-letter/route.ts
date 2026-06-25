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

    const prompt = `Generate a professional 3-paragraph cover letter for ${candidateName} applying for ${jobTitle} at ${company}.

CV: ${truncatedCV}

Job Description: ${truncatedJD}

Return ONLY the cover letter text, no extra commentary.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
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
