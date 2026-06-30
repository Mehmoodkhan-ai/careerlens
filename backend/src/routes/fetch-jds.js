import { Router } from "express";

const router = Router();

function cleanStr(str = "") {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchJobs(query, page = 1) {
  const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(query)}&num_pages=2&page=${page}&country=us&date_posted=all`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key":  process.env.RAPIDAPI_KEY ?? "",
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
    signal: AbortSignal.timeout(100000),
  });

  const raw = await response.text();
  const sanitized = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ");
  const data = JSON.parse(sanitized);

  if (!response.ok) {
    throw new Error(data?.message ?? `HTTP ${response.status}`);
  }

  return data?.data?.jobs ?? [];
}

router.post("/", async (req, res) => {
  const { role, location } = req.body;
  if (!role) return res.status(400).json({ error: "role is required" });

  const query = `${role} ${location ?? ""}`.trim();

  let jobs = [];
  try {
    jobs = await fetchJobs(query, 1);
    if (jobs.length < 5) {
      const page2 = await fetchJobs(query, 3);
      const seen = new Set(jobs.map((j) => j.job_id));
      for (const j of page2) {
        if (!seen.has(j.job_id)) { jobs.push(j); seen.add(j.job_id); }
      }
    }
  } catch (err) {
    console.error("fetch-jds error:", err.message);
    return res.status(502).json({ error: `JSearch error: ${err.message}` });
  }

  if (!jobs.length) {
    return res.status(404).json({ error: "No jobs found for this role." });
  }

  const jds = jobs.slice(0, 10).map((job) => ({
    title:     cleanStr(job.job_title       ?? "Unknown Role"),
    company:   cleanStr(job.employer_name   ?? "Unknown Company"),
    text:      cleanStr(job.job_description ?? "").slice(0, 800),
    source:    "live",
    platform:  job.job_publisher ?? "JSearch",
    location:  job.job_city
      ? `${job.job_city}, ${job.job_country ?? ""}`.trim()
      : (job.job_country ?? "Remote"),
    applyLink: job.job_apply_link ?? null,
  }));

  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  return res.json({ jds });
});

export default router;
