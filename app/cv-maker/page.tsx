"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Plus,
  Trash2,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import type { CVPDFData } from "@/lib/generateCVPDF";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  portfolio: string;
  github: string;
  linkedin: string;
}

interface SkillCategoryEntry {
  category: string;
  items: string;
}

interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  duration: string;
  bullets: string;
}

interface ProjectEntry {
  id: string;
  name: string;
  liveLink: string;
  description: string;
  techStack: string;
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  dates: string;
}

interface CertificateEntry {
  id: string;
  issuer: string;
  date: string;
  names: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Deployment",
  "Automation",
  "Frameworks",
  "Tools",
] as const;

const STEPS = [
  "Personal",
  "Summary",
  "Skills",
  "Experience",
  "Projects",
  "Education",
  "Certificates",
] as const;

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultPersonal: PersonalInfo = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  portfolio: "",
  github: "",
  linkedin: "",
};

const defaultSkills: SkillCategoryEntry[] = SKILL_CATEGORIES.map((c) => ({
  category: c,
  items: "",
}));

const uid = () => Math.random().toString(36).slice(2);

const makeExp = (): ExperienceEntry => ({
  id: uid(),
  title: "",
  company: "",
  duration: "",
  bullets: "",
});

const makeProject = (): ProjectEntry => ({
  id: uid(),
  name: "",
  liveLink: "",
  description: "",
  techStack: "",
});

const makeEdu = (): EducationEntry => ({
  id: uid(),
  degree: "",
  institution: "",
  dates: "",
});

const makeCert = (): CertificateEntry => ({
  id: uid(),
  issuer: "",
  date: "",
  names: "",
});

// ── Utils ─────────────────────────────────────────────────────────────────────

const splitCSV = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const splitLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

const SKILL_PLACEHOLDERS: Record<string, string> = {
  Frontend: "React, Next.js, TypeScript, TailwindCSS",
  Backend: "Node.js, Express, Python, FastAPI",
  Database: "PostgreSQL, MongoDB, Redis",
  Deployment: "Docker, AWS, Vercel, CI/CD",
  Automation: "Selenium, Playwright, GitHub Actions",
  Frameworks: "Next.js, NestJS, Django, Laravel",
  Tools: "Git, VS Code, Postman, Figma",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CVMakerPage() {
  const [step, setStep] = useState(0);
  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<SkillCategoryEntry[]>(defaultSkills);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([makeExp()]);
  const [projects, setProjects] = useState<ProjectEntry[]>([makeProject()]);
  const [educations, setEducations] = useState<EducationEntry[]>([makeEdu()]);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([
    makeCert(),
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (!done) {
      setSuccessVisible(false);
      return;
    }
    const t = setTimeout(() => setSuccessVisible(true), 16);
    return () => clearTimeout(t);
  }, [done]);

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const payload: CVPDFData = {
        personalInfo: personal,
        summary,
        skills: skills
          .map((sk) => ({ category: sk.category, items: splitCSV(sk.items) }))
          .filter((sk) => sk.items.length > 0),
        experience: experiences.map((e) => ({
          title: e.title,
          company: e.company,
          duration: e.duration,
          bullets: splitLines(e.bullets),
        })),
        projects: projects
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name,
            liveLink: p.liveLink,
            description: p.description,
            techStack: p.techStack,
          })),
        education: educations
          .filter((e) => e.degree.trim())
          .map((e) => ({
            degree: e.degree,
            institution: e.institution,
            dates: e.dates,
          })),
        certificates: certificates
          .filter((c) => c.issuer.trim() || c.names.trim())
          .map((c) => ({
            issuer: c.issuer,
            date: c.date,
            names: splitLines(c.names),
          })),
      };

      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to generate CV");
      }

      const enhanced = (await res.json()) as CVPDFData;
      const { generateCVPDF } = await import("@/lib/generateCVPDF");
      await generateCVPDF(enhanced);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent transition-colors";

  const labelCls =
    "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  const addBtnCls =
    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#534AB7] border border-[#534AB7] rounded-lg hover:bg-[#534AB7]/10 transition-colors";

  const cardCls =
    "p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 relative";

  // ── Step 0: Personal Info ─────────────────────────────────────────────────

  const personalFields: {
    key: keyof PersonalInfo;
    label: string;
    placeholder: string;
    type?: string;
    wide?: boolean;
  }[] = [
    { key: "name", label: "Full Name", placeholder: "Jane Doe" },
    {
      key: "title",
      label: "Professional Title",
      placeholder: "Full-Stack Developer | React | Node.js",
      wide: true,
    },
    {
      key: "email",
      label: "Email",
      placeholder: "jane@example.com",
      type: "email",
    },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000" },
    { key: "location", label: "Location", placeholder: "New York, NY" },
    {
      key: "portfolio",
      label: "Portfolio URL",
      placeholder: "portfolio.example.com",
    },
    {
      key: "github",
      label: "GitHub URL",
      placeholder: "github.com/janedoe",
    },
    {
      key: "linkedin",
      label: "LinkedIn URL",
      placeholder: "linkedin.com/in/janedoe",
    },
  ];

  const renderPersonal = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        Personal Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {personalFields.map(({ key, label: lbl, placeholder, type, wide }) => (
          <div key={key} className={wide ? "sm:col-span-2" : ""}>
            <label className={labelCls}>{lbl}</label>
            <input
              type={type ?? "text"}
              value={personal[key]}
              onChange={(e) =>
                setPersonal((p) => ({
                  ...p,
                  [key]: e.target.value,
                } as PersonalInfo))
              }
              placeholder={placeholder}
              className={inputCls}
            />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step 1: Summary ───────────────────────────────────────────────────────

  const renderSummary = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Professional Summary
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Write 3-4 sentences. AI will enhance it with professional language and
          stronger impact.
        </p>
      </div>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean code and user-centred design. Experienced in leading cross-functional teams and delivering products on schedule."
        rows={6}
        className={`${inputCls} resize-y`}
      />
    </div>
  );

  // ── Step 2: Skills ────────────────────────────────────────────────────────

  const renderSkills = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Skills by Category
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Comma-separated values. Leave empty categories blank. AI will suggest
          additional skills.
        </p>
      </div>
      <div className="space-y-3">
        {skills.map((sk, i) => (
          <div key={sk.category} className="flex items-start gap-3">
            <span className="w-28 shrink-0 pt-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
              {sk.category}
            </span>
            <input
              type="text"
              value={sk.items}
              onChange={(e) =>
                setSkills((list) =>
                  list.map((s, j) =>
                    j === i ? { ...s, items: e.target.value } : s
                  )
                )
              }
              placeholder={SKILL_PLACEHOLDERS[sk.category] ?? ""}
              className={inputCls}
            />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step 3: Experience ────────────────────────────────────────────────────

  const renderExperience = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Work Experience
        </h2>
        <button
          onClick={() => setExperiences((e) => [...e, makeExp()])}
          className={addBtnCls}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Job
        </button>
      </div>

      {experiences.map((exp, i) => (
        <div key={exp.id} className={cardCls}>
          {experiences.length > 1 && (
            <button
              onClick={() =>
                setExperiences((e) => e.filter((x) => x.id !== exp.id))
              }
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove job"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Position {i + 1}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Job Title</label>
              <input
                type="text"
                value={exp.title}
                onChange={(e) =>
                  setExperiences((l) =>
                    l.map((x) =>
                      x.id === exp.id ? { ...x, title: e.target.value } : x
                    )
                  )
                }
                placeholder="Software Engineer"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) =>
                  setExperiences((l) =>
                    l.map((x) =>
                      x.id === exp.id ? { ...x, company: e.target.value } : x
                    )
                  )
                }
                placeholder="Acme Corp"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Dates</label>
              <input
                type="text"
                value={exp.duration}
                onChange={(e) =>
                  setExperiences((l) =>
                    l.map((x) =>
                      x.id === exp.id
                        ? { ...x, duration: e.target.value }
                        : x
                    )
                  )
                }
                placeholder="Jan 2022 – Present"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Bullet Points (one per line — AI will enhance with action verbs
              and metrics)
            </label>
            <textarea
              value={exp.bullets}
              onChange={(e) =>
                setExperiences((l) =>
                  l.map((x) =>
                    x.id === exp.id ? { ...x, bullets: e.target.value } : x
                  )
                )
              }
              placeholder={`Built REST APIs using Node.js\nReduced page load time by 40%\nLed team of 3 engineers to deliver features on schedule`}
              rows={4}
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 4: Projects ──────────────────────────────────────────────────────

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Projects
        </h2>
        <button
          onClick={() => setProjects((p) => [...p, makeProject()])}
          className={addBtnCls}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Project
        </button>
      </div>

      {projects.map((proj, i) => (
        <div key={proj.id} className={cardCls}>
          {projects.length > 1 && (
            <button
              onClick={() =>
                setProjects((p) => p.filter((x) => x.id !== proj.id))
              }
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Project {i + 1}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Project Name</label>
              <input
                type="text"
                value={proj.name}
                onChange={(e) =>
                  setProjects((l) =>
                    l.map((x) =>
                      x.id === proj.id ? { ...x, name: e.target.value } : x
                    )
                  )
                }
                placeholder="CareerLens"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Live Link (optional)</label>
              <input
                type="text"
                value={proj.liveLink}
                onChange={(e) =>
                  setProjects((l) =>
                    l.map((x) =>
                      x.id === proj.id
                        ? { ...x, liveLink: e.target.value }
                        : x
                    )
                  )
                }
                placeholder="careerlens.vercel.app"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                value={proj.description}
                onChange={(e) =>
                  setProjects((l) =>
                    l.map((x) =>
                      x.id === proj.id
                        ? { ...x, description: e.target.value }
                        : x
                    )
                  )
                }
                placeholder="AI-powered career tool that analyzes CVs against job descriptions and provides tailored improvement suggestions."
                rows={2}
                className={`${inputCls} resize-y`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Tech Stack</label>
              <input
                type="text"
                value={proj.techStack}
                onChange={(e) =>
                  setProjects((l) =>
                    l.map((x) =>
                      x.id === proj.id
                        ? { ...x, techStack: e.target.value }
                        : x
                    )
                  )
                }
                placeholder="Next.js, TypeScript, Groq API, TailwindCSS, Vercel"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 5: Education ─────────────────────────────────────────────────────

  const renderEducation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Education
        </h2>
        <button
          onClick={() => setEducations((e) => [...e, makeEdu()])}
          className={addBtnCls}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Education
        </button>
      </div>

      {educations.map((edu, i) => (
        <div key={edu.id} className={cardCls}>
          {educations.length > 1 && (
            <button
              onClick={() =>
                setEducations((e) => e.filter((x) => x.id !== edu.id))
              }
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove education"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Entry {i + 1}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Degree</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) =>
                  setEducations((l) =>
                    l.map((x) =>
                      x.id === edu.id ? { ...x, degree: e.target.value } : x
                    )
                  )
                }
                placeholder="BSc Computer Science"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Institution</label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) =>
                  setEducations((l) =>
                    l.map((x) =>
                      x.id === edu.id
                        ? { ...x, institution: e.target.value }
                        : x
                    )
                  )
                }
                placeholder="MIT"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Dates</label>
              <input
                type="text"
                value={edu.dates}
                onChange={(e) =>
                  setEducations((l) =>
                    l.map((x) =>
                      x.id === edu.id ? { ...x, dates: e.target.value } : x
                    )
                  )
                }
                placeholder="Sep 2020 – Jun 2024"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 6: Certificates ──────────────────────────────────────────────────

  const renderCertificates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Certificates
        </h2>
        <button
          onClick={() => setCertificates((c) => [...c, makeCert()])}
          className={addBtnCls}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Issuer
        </button>
      </div>

      {certificates.map((cert, i) => (
        <div key={cert.id} className={cardCls}>
          {certificates.length > 1 && (
            <button
              onClick={() =>
                setCertificates((c) => c.filter((x) => x.id !== cert.id))
              }
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove issuer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Issuer {i + 1}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Issuer / Organization</label>
              <input
                type="text"
                value={cert.issuer}
                onChange={(e) =>
                  setCertificates((l) =>
                    l.map((x) =>
                      x.id === cert.id ? { ...x, issuer: e.target.value } : x
                    )
                  )
                }
                placeholder="Amazon Web Services"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="text"
                value={cert.date}
                onChange={(e) =>
                  setCertificates((l) =>
                    l.map((x) =>
                      x.id === cert.id ? { ...x, date: e.target.value } : x
                    )
                  )
                }
                placeholder="2024"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Certificate Names (one per line)
              </label>
              <textarea
                value={cert.names}
                onChange={(e) =>
                  setCertificates((l) =>
                    l.map((x) =>
                      x.id === cert.id ? { ...x, names: e.target.value } : x
                    )
                  )
                }
                placeholder={`AWS Certified Solutions Architect\nAWS Certified Developer`}
                rows={3}
                className={`${inputCls} resize-y`}
              />
            </div>
          </div>
        </div>
      ))}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {done ? (
        <div
          className={`transition-all duration-300 ease-out ${
            successVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-green-700 dark:text-green-400">
                Your CV is ready!
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-1">
                Check your downloads folder
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#534AB7] text-[#534AB7] dark:text-[#8B85E8] dark:border-[#8B85E8] rounded-lg hover:bg-[#534AB7]/10 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download Again
              </button>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#534AB7] text-white rounded-lg hover:bg-[#4840A0] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#534AB7] text-white text-sm font-semibold rounded-xl hover:bg-[#4840A0] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enhancing with AI &amp; generating PDF…
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate &amp; Download CV
            </>
          )}
        </button>
      )}
    </div>
  );

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center shrink-0"
          >
            <Brain className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">
              CareerLens
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5 hidden sm:block">
              CV Maker
            </p>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
          {STEPS.map((name, i) => (
            <div key={name} className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (i < step) setStep(i);
                }}
                disabled={i >= step}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i === step
                    ? "bg-[#534AB7] text-white"
                    : i < step
                    ? "bg-[#534AB7]/15 text-[#534AB7] dark:text-[#8B85E8] hover:bg-[#534AB7]/25 cursor-pointer"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
                }`}
              >
                <span className="font-bold">{i + 1}</span>
                <span className="hidden md:inline">{name}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-3 h-px ${
                    i < step
                      ? "bg-[#534AB7]"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-8">
          {step === 0 && renderPersonal()}
          {step === 1 && renderSummary()}
          {step === 2 && renderSkills()}
          {step === 3 && renderExperience()}
          {step === 4 && renderProjects()}
          {step === 5 && renderEducation()}
          {step === 6 && renderCertificates()}

          {/* Navigation */}
          <div
            className={`flex mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 ${
              step === 0 ? "justify-end" : "justify-between"
            }`}
          >
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[#534AB7] text-white rounded-xl hover:bg-[#4840A0] transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </main>
    </div>
  );
}
