import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface PerJDScore {
  title: string;
  company: string;
  score: number;
  key_match: string;
  key_gap: string;
}

export interface Keyword {
  word: string;
  in_cv: boolean;
}

export interface AnalysisResult {
  match_score: number;
  strong_points: string[];
  weak_points: string[];
  summary: string;
  jd_title: string;
  per_jd_scores: PerJDScore[];
  ats_score: number;
  ats_tips: string[];
  keywords: Keyword[];
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting analysis...");

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const { cvText, jds } = await req.json();

    if (!cvText || !jds || !Array.isArray(jds) || jds.length === 0) {
      return NextResponse.json(
        { error: "cvText and jds array are required" },
        { status: 400 }
      );
    }

    if (jds.length < 5) {
      return NextResponse.json(
        { error: "Minimum 5 JDs required" },
        { status: 400 }
      );
    }

    const jdItems = jds.slice(0, 5);

    const truncatedCV = cvText.slice(0, 2000);

    const truncatedJDs = jdItems.map((jd: { title: string; company: string; text: string }) => ({
      ...jd,
      text: jd.text.slice(0, 300),
    }));

    const jdSummaries = truncatedJDs
      .map(
        (jd: { title: string; company: string; text: string }, i: number) =>
          `--- JD ${i + 1}: ${jd.title} at ${jd.company} ---\n${jd.text}`
      )
      .join("\n\n");

    const prompt = `Analyze this CV against the job descriptions. Return ONLY valid JSON, no markdown.

CV: ${truncatedCV}

JDs: ${jdSummaries}

JSON schema (all fields required):
{"match_score":0-100,"ats_score":0-100,"strong_points":["10 strings"],"weak_points":["10 strings"],"summary":"2 sentences","jd_title":"best matching JD title","per_jd_scores":[{"title":"","company":"","score":0-100,"key_match":"","key_gap":""}],"ats_tips":["4 strings"],"keywords":[{"word":"","in_cv":true}]}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = content
      .replace(/```json\n?|```\n?/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .trim();
    const analysis: AnalysisResult = JSON.parse(cleaned);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.log("Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze CV" },
      { status: 500 }
    );
  }
}
