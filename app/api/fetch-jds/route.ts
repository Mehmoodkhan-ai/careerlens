import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface JSearchJob {
  job_title: string;
  employer_name: string;
  job_description: string;
  job_publisher?: string;
  job_country?: string;
  job_city?: string;
  job_state?: string;
}

async function fetchFromGroq(role: string, location: string) {
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

  const jds = JSON.parse(cleaned) as { title: string; company: string; text: string }[];
  return jds.map((jd) => ({ ...jd, source: "ai" as const, platform: undefined }));
}

export async function POST(req: NextRequest) {
  try {
    const { role, location } = await req.json() as { role?: string; location?: string };

    if (!role || !location) {
      return NextResponse.json(
        { error: "role and location are required" },
        { status: 400 }
      );
    }

    console.log("RAPIDAPI_KEY exists:", !!process.env.RAPIDAPI_KEY);

    const page = Math.floor(Math.random() * 10) + 1;
    const dateOptions = ["today", "week", "month", "all"];
    const date_posted = dateOptions[Math.floor(Math.random() * dateOptions.length)];
    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(role + " " + location)}&num_pages=1&page=${page}&date_posted=${date_posted}&remote_jobs_only=false&publishers=linkedin.com,indeed.com,glassdoor.com,monster.com`;
    console.log("Fetch URL:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        },
        signal: AbortSignal.timeout(30000),
      });

      console.log("Response status:", response.status);

      const rawBody = await response.text();
      console.log("Response body:", rawBody);

      if (!response.ok) {
        throw new Error(`JSearch API error ${response.status}: ${rawBody}`);
      }

      const data = JSON.parse(rawBody) as {
        data?: JSearchJob[] | { jobs?: JSearchJob[] };
        jobs?: JSearchJob[];
      };

      console.log("Full API response:", JSON.stringify(data, null, 2));

      const rawJobs = (
        Array.isArray(data.data) ? data.data :
        Array.isArray(data.jobs) ? data.jobs :
        Array.isArray((data.data as { jobs?: JSearchJob[] } | undefined)?.jobs)
          ? (data.data as { jobs?: JSearchJob[] }).jobs!
          : []
      );

      const seen = new Set<string>();
      const jobs = rawJobs.filter((job) => {
        const key = job.job_title + job.employer_name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 5);

      console.log("Jobs found:", jobs.length);

      if (jobs.length === 0) {
        throw new Error("No jobs returned from JSearch");
      }

      const jds = jobs.map((job) => ({
        title: job.job_title + " at " + job.employer_name,
        company: job.employer_name,
        text: job.job_description,
        source: "live" as const,
        platform: job.job_publisher || "Job Board",
        location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", "),
      }));

      return NextResponse.json({ jds });
    } catch (err) {
      console.log("RapidAPI failed, falling back to Groq...", err);
      const jds = await fetchFromGroq(role, location);
      return NextResponse.json({ jds });
    }
  } catch (err) {
    console.error("fetch-jds error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch job descriptions" },
      { status: 500 }
    );
  }
}
