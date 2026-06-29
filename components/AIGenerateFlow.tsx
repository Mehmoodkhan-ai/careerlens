"use client";

import { useState, useRef } from "react";
import {
  Sparkles, Loader2, ArrowLeft, Brain,
  ChevronRight, CheckCircle2, MinusCircle, AlertTriangle,
} from "lucide-react";
import type { PersonalInfo, SkillCategoryEntry } from "@/lib/cvHistory";

// ── Form field ────────────────────────────────────────────────────────────────

interface FormField {
  key: string;
  label: string;
  placeholder: string;
  fieldType?: "text" | "email" | "textarea";
  wide?: boolean;
}

// ── Question config ───────────────────────────────────────────────────────────

interface QuestionConfig {
  label: string;
  topic: string;
  question: string;
  fields: FormField[];
  skippable?: boolean;
}

const QUESTION_CONFIGS: QuestionConfig[] = [
  {
    label: "Personal Information",
    topic: "personal contact information",
    question: "Let's start with your personal details.",
    skippable: true,
    fields: [
      { key: "name",      label: "Full Name",  placeholder: "Jane Doe",              wide: true },
      { key: "email",     label: "Email",       placeholder: "jane@email.com",        fieldType: "email" },
      { key: "phone",     label: "Phone",       placeholder: "+1 555-0000" },
      { key: "location",  label: "Location",    placeholder: "New York, NY" },
      { key: "portfolio", label: "Portfolio",   placeholder: "portfolio.dev" },
      { key: "github",    label: "GitHub",      placeholder: "github.com/jane" },
      { key: "linkedin",  label: "LinkedIn",    placeholder: "linkedin.com/in/jane" },
    ],
  },
  {
    label: "Work Experience",
    topic: "work experience",
    question: "Tell me about your work experience. Skip if you're a fresher.",
    skippable: true,
    fields: [
      { key: "title",            label: "Job Title",        placeholder: "Software Engineer" },
      { key: "company",          label: "Company",          placeholder: "Acme Corp" },
      { key: "duration",         label: "Duration",         placeholder: "Jan 2022 – Present",                                                   wide: true },
      { key: "responsibilities", label: "Responsibilities", placeholder: "Built REST APIs with Node.js, reduced load time 40%, led team of 3", fieldType: "textarea", wide: true },
    ],
  },
  {
    label: "Projects",
    topic: "projects",
    question: "Describe a project you've built. Skip if you have none.",
    skippable: true,
    fields: [
      { key: "name",        label: "Project Name", placeholder: "CareerLens" },
      { key: "liveLink",    label: "Live Link",    placeholder: "careerlens.vercel.app" },
      { key: "techStack",   label: "Tech Stack",   placeholder: "Next.js, TypeScript, TailwindCSS",                        wide: true },
      { key: "description", label: "Description",  placeholder: "AI career tool that analyses CVs against job descriptions", fieldType: "textarea", wide: true },
    ],
  },
  {
    label: "Technical Skills",
    topic: "technical skills",
    question: "What are your technical skills?",
    skippable: true,
    fields: [
      { key: "frontend",   label: "Frontend",   placeholder: "React, Next.js, TypeScript, TailwindCSS", wide: true },
      { key: "backend",    label: "Backend",    placeholder: "Node.js, Express, Python, FastAPI",        wide: true },
      { key: "database",   label: "Database",   placeholder: "PostgreSQL, MongoDB, Redis",               wide: true },
      { key: "deployment", label: "Deployment", placeholder: "Docker, AWS, Vercel, CI/CD",              wide: true },
    ],
  },
  {
    label: "Education",
    topic: "education background",
    question: "What's your educational background?",
    skippable: true,
    fields: [
      { key: "degree",      label: "Degree",      placeholder: "BSc Computer Science", wide: true },
      { key: "institution", label: "Institution",  placeholder: "MIT" },
      { key: "year",        label: "Year",         placeholder: "2024" },
    ],
  },
  {
    label: "Certifications",
    topic: "certifications and courses",
    question: "Any certifications or courses? Skip if none.",
    skippable: true,
    fields: [
      { key: "issuer",   label: "Issuer",           placeholder: "Amazon Web Services" },
      { key: "date",     label: "Date",             placeholder: "2024" },
      { key: "certName", label: "Certificate Name", placeholder: "AWS Solutions Architect", wide: true },
    ],
  },
];

const TOTAL_QUESTIONS = QUESTION_CONFIGS.length;
const QUESTION_TOPICS = QUESTION_CONFIGS.map(q => q.topic);
const QUESTION_LABELS = QUESTION_CONFIGS.map(q => q.label);

const ROLE_PRESETS: { label: string; value: string }[] = [
  { label: "Frontend",   value: "Frontend Developer" },
  { label: "Backend",    value: "Backend Developer" },
  { label: "Full Stack", value: "Full Stack Developer" },
  { label: "AI/ML",      value: "AI/ML Engineer" },
  { label: "Other",      value: "" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  id: number;
}

export interface AIGeneratedData {
  personalInfo: PersonalInfo;
  summary: string;
  skills: SkillCategoryEntry[];
  experiences: Array<{ title: string; company: string; duration: string; bullets: string }>;
  projects: Array<{ name: string; liveLink: string; description: string; techStack: string }>;
  educations: Array<{ degree: string; institution: string; dates: string }>;
  certificates: Array<{ issuer: string; date: string; names: string }>;
}

function normalizeAIData(raw: unknown): AIGeneratedData {
  const r = raw as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const pi = (r.personalInfo ?? {}) as Record<string, unknown>;
  return {
    personalInfo: {
      name: str(pi.name), title: str(pi.title), email: str(pi.email), phone: str(pi.phone),
      location: str(pi.location), portfolio: str(pi.portfolio), github: str(pi.github), linkedin: str(pi.linkedin),
    },
    summary: str(r.summary),
    skills: Array.isArray(r.skills)
      ? (r.skills as Record<string, unknown>[]).map(s => ({ category: str(s.category), items: str(s.items) }))
      : [],
    experiences: Array.isArray(r.experiences)
      ? (r.experiences as Record<string, unknown>[]).map(e => ({
          title: str(e.title), company: str(e.company), duration: str(e.duration), bullets: str(e.bullets),
        }))
      : [],
    projects: Array.isArray(r.projects)
      ? (r.projects as Record<string, unknown>[]).map(p => ({
          name: str(p.name), liveLink: str(p.liveLink), description: str(p.description), techStack: str(p.techStack),
        }))
      : [],
    educations: Array.isArray(r.educations)
      ? (r.educations as Record<string, unknown>[]).map(e => ({
          degree: str(e.degree), institution: str(e.institution), dates: str(e.dates),
        }))
      : [],
    certificates: Array.isArray(r.certificates)
      ? (r.certificates as Record<string, unknown>[]).map(c => ({
          issuer: str(c.issuer), date: str(c.date), names: str(c.names),
        }))
      : [],
  };
}

interface Props {
  onComplete: (data: AIGeneratedData, disclaimer: string) => void;
  onCancel: () => void;
}

// ── Pill button style (role phase) ────────────────────────────────────────────

const pill = (selected = false) =>
  `px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer ${
    selected
      ? "bg-[#534AB7] border-[#534AB7] text-white"
      : "bg-white dark:bg-gray-900 border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7]/10 dark:hover:bg-[#534AB7]/20"
  }`;

// ── Field styles inside form bubble ──────────────────────────────────────────

const fieldCls =
  "w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#534AB7] focus:border-[#534AB7] transition-colors";
const labelCls =
  "block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIGenerateFlow({ onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<"role" | "chat" | "confirm" | "processing">("role");
  const [role, setRole] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const msgIdRef = useRef(0);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>(Array(TOTAL_QUESTIONS).fill(""));
  const [skippedQuestions, setSkippedQuestions] = useState<boolean[]>(Array(TOTAL_QUESTIONS).fill(false));
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allQuestionsAnswered = currentQuestionIndex >= TOTAL_QUESTIONS;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addAIMessage = (content: string) => {
    const id = ++msgIdRef.current;
    setMessages(prev => [...prev, { role: "ai", content, id }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const addUserMessage = (content: string) => {
    const id = ++msgIdRef.current;
    setMessages(prev => [...prev, { role: "user", content, id }]);
  };

  const advanceToNext = (qi: number, ack: string) => {
    const next = qi + 1;
    setCurrentQuestionIndex(next);
    setFormValues({});
    if (next < TOTAL_QUESTIONS) {
      addAIMessage(`${ack}\n\n${QUESTION_CONFIGS[next].question}`);
    } else {
      addAIMessage(`${ack}\n\nThat's all the questions! Click "Review Summary" below.`);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartChat = () => {
    const r = role.trim();
    if (!r) return;
    setPhase("chat");
    addAIMessage(
      `I'll help you build a strong ${r} CV. Let's go through ${TOTAL_QUESTIONS} quick questions.\n\n${QUESTION_CONFIGS[0].question}`
    );
  };

  const handleFormSubmit = () => {
    const qi = currentQuestionIndex;
    const config = QUESTION_CONFIGS[qi];
    const lines = config.fields
      .map(f => {
        const val = (formValues[f.key] ?? "").trim();
        return val ? `${f.label}: ${val}` : null;
      })
      .filter((v): v is string => v !== null);
    if (lines.length === 0) return;
    const summary = lines.join("\n");
    addUserMessage(summary);
    setQuestionAnswers(prev => prev.map((a, i) => i === qi ? summary : a));
    advanceToNext(qi, "Got it!");
  };

  const handleSkip = () => {
    const qi = currentQuestionIndex;
    setSkippedQuestions(prev => prev.map((v, i) => i === qi ? true : v));
    const next = qi + 1;
    setCurrentQuestionIndex(next);
    setFormValues({});
    if (next < TOTAL_QUESTIONS) {
      addAIMessage(`No problem — I'll handle that later.\n\n${QUESTION_CONFIGS[next].question}`);
    } else {
      addAIMessage(`No problem! Click "Review Summary" below.`);
    }
  };

  const handleProcessCV = async () => {
    setPhase("processing");
    setError("");

    const skippedTopics = QUESTION_TOPICS.filter((_, i) => skippedQuestions[i]);
    const answeredTopics = QUESTION_TOPICS.filter((_, i) => !skippedQuestions[i] && questionAnswers[i]);
    const isFullSkip = answeredTopics.length === 0;
    const skippedCount = skippedQuestions.filter(Boolean).length;

    const log = QUESTION_TOPICS.map((topic, i) => {
      if (skippedQuestions[i]) return `${topic.toUpperCase()}:\n(user skipped — generate realistic content)`;
      const answer = questionAnswers[i];
      return `${topic.toUpperCase()}:\n${answer || "(no answer provided)"}`;
    }).join("\n\n");

    const conversationLog = `TARGET ROLE: ${role.trim()}\n\n${log}`;

    const disclaimer =
      isFullSkip
        ? "⚠️ AI generated this entire CV — please review and edit all content carefully before use"
        : skippedCount >= 3
        ? `AI completed ${skippedCount} skipped sections — review all fields before generating your PDF`
        : "Form pre-filled by AI — review all fields before generating your PDF";

    try {
      const res = await fetch("/api/ai-cv-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "structure", role: role.trim(), conversationLog, skippedTopics, answeredTopics, isFullSkip }),
      });
      if (!res.ok) throw new Error("Failed to structure CV");
      const result = (await res.json()) as { cvData?: unknown; error?: string };
      if (result.error) throw new Error(result.error);
      if (!result.cvData) throw new Error("No CV data returned");
      onComplete(normalizeAIData(result.cvData), disclaimer);
    } catch (err) {
      setPhase("confirm");
      setError(err instanceof Error ? err.message : "Failed to generate CV. Please try again.");
    }
  };

  // ── Phase: Role ────────────────────────────────────────────────────────────

  if (phase === "role") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">AI Generate My CV</h2>
            <p className="text-xs text-gray-400 mt-0.5">Answer {TOTAL_QUESTIONS} quick questions — AI structures everything</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#534AB7]/8 to-purple-500/5 border border-[#534AB7]/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#534AB7] rounded-xl flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">What role are you applying for?</p>
              <p className="text-xs text-gray-400 mt-0.5">Pick a preset or type your own</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ROLE_PRESETS.map(({ label, value }) => (
              <button key={label} onClick={() => setRole(value)} className={pill(!!value && role === value)}>
                {label}
              </button>
            ))}
          </div>

          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleStartChat(); }}
            placeholder="Or type a custom role…"
            autoFocus
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent transition-colors"
          />

          <button onClick={handleStartChat} disabled={!role.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#534AB7] text-white text-sm font-semibold rounded-xl hover:bg-[#4840A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Sparkles className="w-4 h-4" />
            Start AI Generation
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["1", `${TOTAL_QUESTIONS} questions`, "Quick forms about your background"],
            ["2", "Structured fields", "Fill in labelled inputs per section"],
            ["3", "Review & edit", "Full control before PDF"],
          ].map(([num, title, desc]) => (
            <div key={num} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center space-y-1.5">
              <div className="w-6 h-6 bg-[#534AB7]/10 text-[#534AB7] rounded-full flex items-center justify-center text-xs font-bold mx-auto">{num}</div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{title}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Phase: Confirm ─────────────────────────────────────────────────────────

  if (phase === "confirm") {
    const skippedCount = skippedQuestions.filter(Boolean).length;
    const answeredCount = TOTAL_QUESTIONS - skippedCount;
    const isFullSkip = answeredCount === 0;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase("chat")} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Review & Confirm</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              You answered <span className="font-semibold text-gray-600 dark:text-gray-300">{answeredCount}</span> of{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{TOTAL_QUESTIONS}</span> sections
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {QUESTION_LABELS.map((label, i) => {
            const skipped = skippedQuestions[i];
            return (
              <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${
                skipped
                  ? "border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/10"
                  : "border-green-200 bg-green-50/60 dark:border-green-800/40 dark:bg-green-900/10"
              }`}>
                {skipped
                  ? <MinusCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                  <p className={`text-[11px] mt-0.5 ${skipped ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
                    {skipped ? "AI will generate optimized content" : "Your answer saved"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {isFullSkip && (
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">AI will generate your entire CV</p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 leading-snug">
                Please review every field carefully before generating your PDF.
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={() => setPhase("chat")}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <button onClick={() => { void handleProcessCV(); }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#534AB7] text-white text-sm font-semibold rounded-xl hover:bg-[#4840A0] transition-colors">
            <Sparkles className="w-4 h-4" />
            {isFullSkip ? "Generate Full CV with AI" : "Confirm & Generate"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Processing ──────────────────────────────────────────────────────

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-5">
        <div className="relative">
          <div className="w-16 h-16 bg-[#534AB7]/10 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#534AB7] animate-spin" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#534AB7] rounded-full flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Structuring your CV…</p>
          <p className="text-xs text-gray-400">AI is organising your information into a professional format</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Phase: Chat ────────────────────────────────────────────────────────────

  const answeredCount = Math.min(currentQuestionIndex, TOTAL_QUESTIONS);
  const currentConfig = currentQuestionIndex < TOTAL_QUESTIONS ? QUESTION_CONFIGS[currentQuestionIndex] : null;
  const hasAnyValue = Object.values(formValues).some(v => v.trim().length > 0);

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cv-msg { animation: fadeSlideIn 0.22s ease-out; }
      `}</style>

      <div className="flex flex-col" style={{ height: "600px" }}>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{role}</p>
              <p className="text-xs text-gray-400">AI CV Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5">
              {QUESTION_CONFIGS.map((_, i) => {
                const isSkipped = skippedQuestions[i];
                const isDone = i < answeredCount;
                return (
                  <div key={i} className={`h-1.5 w-4 rounded-full transition-all ${
                    isDone && !isSkipped ? "bg-[#534AB7]"
                    : isDone && isSkipped  ? "bg-amber-400"
                    : i === answeredCount  ? "bg-[#534AB7]/40"
                    : "bg-gray-200 dark:bg-gray-700"
                  }`} />
                );
              })}
            </div>
            <span className="text-xs text-gray-400 tabular-nums">{answeredCount}/{TOTAL_QUESTIONS}</span>
          </div>
        </div>

        {/* Messages + inline form — single scrollable area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">

          {messages.map(msg => (
            <div key={msg.id} className={`cv-msg flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-7 h-7 bg-[#534AB7] rounded-lg flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#534AB7] text-white rounded-tr-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Structured form bubble — appears inline after AI question */}
          {!allQuestionsAnswered && currentConfig && (
            <div className="cv-msg flex justify-end">
              <div className="w-full max-w-[92%] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tr-sm shadow-sm overflow-hidden">

                {/* Bubble header */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] font-semibold text-[#534AB7] dark:text-[#8B85E8] uppercase tracking-wide">
                    {currentConfig.label}
                  </p>
                </div>

                {/* Fields */}
                <div className="px-4 py-3">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {currentConfig.fields.map((field, fi) => (
                      <div key={field.key} className={field.wide ? "col-span-2" : ""}>
                        <label className={labelCls}>{field.label}</label>
                        {field.fieldType === "textarea" ? (
                          <textarea
                            value={formValues[field.key] ?? ""}
                            onChange={e => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={3}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus={fi === 0}
                            className={`${fieldCls} resize-none`}
                          />
                        ) : (
                          <input
                            type={field.fieldType ?? "text"}
                            value={formValues[field.key] ?? ""}
                            onChange={e => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === "Enter" && fi === currentConfig.fields.length - 1) {
                                e.preventDefault();
                                if (hasAnyValue) handleFormSubmit();
                              }
                            }}
                            placeholder={field.placeholder}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus={fi === 0}
                            className={fieldCls}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 pb-3 pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                  {currentConfig.skippable && (
                    <button onClick={handleSkip}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      Skip
                    </button>
                  )}
                  <button
                    onClick={handleFormSubmit}
                    disabled={!hasAnyValue}
                    className="px-5 py-1.5 bg-[#534AB7] text-white text-xs font-semibold rounded-lg hover:bg-[#4840A0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Summary — inline when all questions done */}
          {allQuestionsAnswered && (
            <div className="cv-msg flex justify-center py-3">
              <button onClick={() => setPhase("confirm")}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#534AB7] text-white text-sm font-semibold rounded-xl hover:bg-[#4840A0] transition-colors shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                Review Summary
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <p className="text-xs text-red-500 py-1 shrink-0">{error}</p>}
      </div>
    </>
  );
}
