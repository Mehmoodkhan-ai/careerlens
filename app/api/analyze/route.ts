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
    const { cvText, jds } = await req.json();

    if (!cvText || !jds || !Array.isArray(jds) || jds.length === 0) {
      return NextResponse.json(
        { error: "cvText and jds array are required" },
        { status: 400 }
      );
    }

    const jdSummaries = jds
      .map(
        (jd: { title: string; company: string; text: string }, i: number) =>
          `--- JD ${i + 1}: ${jd.title} at ${jd.company} ---\n${jd.text}`
      )
      .join("\n\n");

    const prompt = `You are an expert CV analyst, ATS specialist, and career coach. Analyze the candidate's CV against the provided job descriptions thoroughly.

CV:
${cvText}

Job Descriptions:
${jdSummaries}

Return a single JSON object with EXACTLY these fields:

- "match_score": number 0-100 — overall fit score across ALL job descriptions combined
- "strong_points": string[] — exactly 10 specific strengths citing concrete evidence from the CV
- "weak_points": string[] — exactly 10 specific gaps or improvement areas relative to the JDs
- "summary": string — 2-3 sentence executive summary of the candidate's overall fit
- "jd_title": string — the single best-matching JD title from the list
- "per_jd_scores": array with one object per JD (in order), each with:
    - "title": string (exact JD title)
    - "company": string (exact company name)
    - "score": number 0-100 (fit score for this specific JD)
    - "key_match": string (one specific skill or experience from the CV that strongly matches this JD)
    - "key_gap": string (one specific skill or requirement from this JD that is missing or weak in the CV)
- "ats_score": number 0-100 — ATS-friendliness score based on: (1) keyword density relative to JD requirements, (2) presence of standard section headers (Experience, Education, Skills, Summary), (3) clean formatting signals (no tables/columns/graphics inferred from text structure), (4) consistent date formatting, (5) use of common action verbs
- "ats_tips": string[] — exactly 4 specific, actionable tips to improve the ATS score (reference actual CV content)
- "keywords": array of exactly 15 objects for the most important technical/professional keywords extracted from the JDs combined, each with:
    - "word": string (the keyword, e.g. "React", "Python", "Agile", "REST APIs")
    - "in_cv": boolean (true if this keyword or a recognisable variant appears in the CV)

Be specific. Reference actual content from the CV and JDs. Return only valid JSON, no markdown, no explanation.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = content
      .replace(/```json\n?|```\n?/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .trim();
    const analysis: AnalysisResult = JSON.parse(cleaned);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("analyze error:", err);
    return NextResponse.json(
      { error: "Failed to analyze CV" },
      { status: 500 }
    );
  }
}
