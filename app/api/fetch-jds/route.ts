import { NextRequest, NextResponse } from 'next/server';

const cleanStr = (s: unknown): string => {
  if (typeof s !== 'string') return '';
  return s
    .replace(/\\/g, '\\\\')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const HEADERS = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': 'jsearch.p.rapidapi.com',
  'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
};

async function fetchJobs(query: string, page: number): Promise<Record<string, unknown>[]> {
  const url = `https://jsearch.p.rapidapi.com/search-v2?query=${query}&num_pages=2&page=${page}&country=us&date_posted=all`;
  console.log(`Fetching page ${page}:`, url);

  const response = await fetch(url, {
    method: 'GET',
    headers: HEADERS,
    signal: AbortSignal.timeout(30000),
  });

  console.log(`Response status (page ${page}):`, response.status);

  let rawText = await response.text();
  console.log(`Response text (page ${page}, first 500):`, rawText.slice(0, 500));

  rawText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const data = JSON.parse(rawText);
  return Array.isArray(data.data?.jobs) ? data.data.jobs : [];
}

export async function POST(req: NextRequest) {
  try {
    const { role, location } = await req.json();
    if (!role) return NextResponse.json({ error: 'Role required' }, { status: 400 });

    console.log('RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY?.slice(0, 10));

    const query = encodeURIComponent(role + ' jobs ' + (location || ''));

    let jobs = await fetchJobs(query, 1);
    console.log('Jobs found (page 1):', jobs.length);

    if (jobs.length < 10) {
      const moreJobs = await fetchJobs(query, 3);
      console.log('Jobs found (page 3):', moreJobs.length);

      const seenIds = new Set(jobs.map((j) => j.job_id));
      const unique = moreJobs.filter((j) => !seenIds.has(j.job_id));
      jobs = [...jobs, ...unique];
      console.log('Jobs after merge:', jobs.length);
    }

    const uniqueJobs = jobs.slice(0, 10);

    if (uniqueJobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found, try different role/location' }, { status: 404 });
    }

    const jds = uniqueJobs.map((job) => ({
      title: `${cleanStr(job.job_title)} at ${cleanStr(job.employer_name)}`,
      company: cleanStr(job.employer_name),
      text: cleanStr(job.job_description as string).slice(0, 800),
      source: 'live' as const,
      platform: cleanStr(job.job_publisher) || 'Job Board',
      location: [job.job_city, job.job_state, job.job_country]
        .filter(Boolean)
        .map(cleanStr)
        .join(', '),
    }));

    return NextResponse.json({ jds }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('fetch-jds error:', err);
    return NextResponse.json({ error: 'Failed to fetch JDs' }, { status: 500 });
  }
}
