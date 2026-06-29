import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const QUESTION_TOPICS = [
  "personal contact information",
  "work experience",
  "projects",
  "technical skills",
  "education background",
  "certifications and courses",
];

const SKILL_CATEGORIES = [
  "Frontend", "Backend", "Database", "Deployment", "Automation", "Frameworks", "Tools",
];

const MAX_FOLLOW_UPS = 2;

function cleanJSON(raw: string): string {
  return raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

interface RespondBody {
  action: "respond";
  role: string;
  questionIndex: number;
  userAnswer: string;
  followUpCount: number;
}

interface StructureBody {
  action: "structure";
  role: string;
  conversationLog: string;
  skippedTopics: string[];
  answeredTopics: string[];
  isFullSkip: boolean;
}

type RequestBody = RespondBody | StructureBody;

// ── Cross-question hints per topic ────────────────────────────────────────────

function getFollowUpHint(questionIndex: number, answer: string): string {
  const lower = answer.toLowerCase();
  switch (questionIndex) {
    case 0: // personal info
      if (!lower.includes("@")) return "Tip: if they gave a name but no email, ask for it";
      return "";
    case 1: // experience
      if (lower.split(/\s+/).length < 15)
        return "Tip: if vague, ask for specific tech stack or measurable impact (team size, users served, performance %)";
      if (!lower.match(/\d/))
        return "Tip: no numbers found — consider asking for metrics like team size, users, or % improvements";
      return "";
    case 2: // projects
      if (lower.includes("none") || lower.includes("no project")) return "";
      if (!lower.match(/react|next|vue|angular|node|python|django|flask|spring|laravel|express|typescript/i))
        return "Tip: no tech stack detected — ask what technologies they used";
      return "";
    case 3: // skills
      if (lower.split(",").filter(Boolean).length < 4)
        return "Tip: short list — if only frontend mentioned, ask about backend/database/cloud experience";
      return "";
    default:
      return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const body = (await req.json()) as RequestBody;

    // ── Chat: evaluate answer + smart follow-up ───────────────────────────────
    if (body.action === "respond") {
      const { role, questionIndex, userAnswer, followUpCount } = body;
      const topic = QUESTION_TOPICS[questionIndex] ?? "information";
      const hint = getFollowUpHint(questionIndex, userAnswer);
      const followUpsLeft = MAX_FOLLOW_UPS - followUpCount;

      const prompt = `You are a friendly, sharp CV assistant helping someone build a CV for a "${role}" role.

CONTEXT: You asked about their ${topic}. This is follow-up #${followUpCount + 1} of max ${MAX_FOLLOW_UPS}.
THEIR ANSWER: "${userAnswer}"
FOLLOW-UPS REMAINING: ${followUpsLeft}
${hint ? `CROSS-QUESTION HINT: ${hint}` : ""}

RULES:
1. Accept immediately if: "none", "no", "n/a", already sufficient, or follow-ups left ≤ 0
2. Ask at most ONE focused follow-up — only if clearly missing critical info:
   - Work experience: vague role with no tech or no quantifiable impact
   - Projects: project mentioned but zero tech stack given
   - Skills: list under 4 items AND only one domain (e.g. only frontend, no backend/cloud)
   - Personal info: name given but missing email or phone
3. If follow-up would be minor or cosmetic → accept, don't ask
4. Be warm, conversational, encouraging — 1-2 sentences max
5. If asking follow-up, make it specific and role-aware (role: "${role}")

Return ONLY valid JSON, no markdown:
{"message":"your 1-2 sentence response","accepted":true}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        max_tokens: 140,
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      let result: { message: string; accepted: boolean } = { message: "Got it, thanks!", accepted: true };
      try {
        result = JSON.parse(cleanJSON(raw)) as { message: string; accepted: boolean };
        // Safety: if no follow-ups left, always accept
        if (followUpsLeft <= 0) result.accepted = true;
      } catch {
        result = { message: "Thanks! Moving on.", accepted: true };
      }
      return NextResponse.json(result);
    }

    // ── Structure conversation into CV JSON ───────────────────────────────────
    if (body.action === "structure") {
      const { role, conversationLog, skippedTopics, answeredTopics, isFullSkip } = body;
      const skillsTemplate = SKILL_CATEGORIES.map(c => `{"category":"${c}","items":""}`).join(",");

      let prompt: string;

      if (isFullSkip) {
        // User skipped everything — generate entire CV from role alone
        prompt = `You are a professional CV writer. Generate a complete, realistic CV for a "${role}" candidate.

The user has not provided any personal information. Create realistic but clearly fictional content.

REQUIREMENTS:
- Use a generic realistic name (e.g. "Alex Johnson"), email, phone, UK/US location
- 2-3 relevant job positions with strong action-verb bullet points and metrics
- 2-3 impressive relevant projects with tech stack
- Comprehensive skill set appropriate for ${role}
- Relevant education (e.g. BSc Computer Science or related)
- 1-2 certifications typical for this role
- Professional summary tailored to ${role}
- All content should be ATS-optimized and human-sounding

Skill categories to populate: ${SKILL_CATEGORIES.join(", ")}

Return ONLY this JSON (no markdown):
{
  "personalInfo":{"name":"","title":"${role}","email":"","phone":"","location":"","portfolio":"","github":"","linkedin":""},
  "summary":"",
  "skills":[${skillsTemplate}],
  "experiences":[],
  "projects":[],
  "educations":[],
  "certificates":[]
}

Experience format: {"title":"","company":"","duration":"","bullets":"Led X\\nBuilt Y\\nImproved Z by N%"}
Project format: {"name":"","liveLink":"","description":"","techStack":""}
Education format: {"degree":"","institution":"","dates":""}
Certificate format: {"issuer":"","date":"","names":"Cert Name"}`;
      } else {
        // Mixed: some answered, some skipped — use answers + generate for skipped
        const skippedList = skippedTopics.length > 0
          ? `\nSKIPPED SECTIONS (generate realistic content for these): ${skippedTopics.join(", ")}`
          : "";
        const answeredList = answeredTopics.length > 0
          ? `\nANSWERED SECTIONS (use EXACTLY what user provided): ${answeredTopics.join(", ")}`
          : "";

        prompt = `You are a professional CV writer. Build a structured CV for a "${role}" candidate.

${conversationLog}
${answeredList}${skippedList}

RULES:
- For ANSWERED sections: use the information provided exactly — do not invent or embellish
- For SKIPPED sections: generate realistic, ATS-optimized, professional content that:
  • Matches the seniority implied by the answered sections
  • Is appropriate for a ${role} role
  • Uses relevant technologies, companies, and credentials
  • Sounds human and natural, not generic
- Do NOT invent companies, degrees, or credentials for ANSWERED sections
- Write a strong 2-3 sentence professional summary tailored to ${role}
- For bullets in experience: action verbs + impact. Separate with literal \\n
- For certificate names: separate with literal \\n
- Skills items: comma-separated within each category string

Skill categories: ${SKILL_CATEGORIES.join(", ")}

Return ONLY this JSON (no markdown, no extra text):
{
  "personalInfo":{"name":"","title":"","email":"","phone":"","location":"","portfolio":"","github":"","linkedin":""},
  "summary":"",
  "skills":[${skillsTemplate}],
  "experiences":[],
  "projects":[],
  "educations":[],
  "certificates":[]
}`;
      }

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: isFullSkip ? 0.6 : 0.2,
        max_tokens: 2500,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(cleanJSON(raw)) as unknown;
        return NextResponse.json({ cvData: parsed });
      } catch {
        return NextResponse.json(
          { error: "AI returned invalid JSON. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("AI CV chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 }
    );
  }
}
