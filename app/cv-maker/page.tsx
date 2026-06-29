"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, Plus, Trash2, Loader2, Download, ChevronLeft, ChevronRight, FileText, CheckCircle2, Sparkles, Clock } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import CVHistoryDrawer from "@/components/CVHistoryDrawer";
import AIGenerateFlow, { type AIGeneratedData } from "@/components/AIGenerateFlow";
import type { CVPDFData, TemplateId, PageMode } from "@/lib/generateCVPDF";
import {
  type PersonalInfo,
  type SkillCategoryEntry,
  type ExperienceEntry,
  type ProjectEntry,
  type EducationEntry,
  type CertificateEntry,
  type CVHistoryEntry,
  loadHistory,
  saveToHistory,
} from "@/lib/cvHistory";

// ── Constants ─────────────────────────────────────────────────────────────────

const SKILL_CATEGORIES = ["Frontend", "Backend", "Database", "Deployment", "Automation", "Frameworks", "Tools"] as const;
const STEPS = ["Template", "Personal", "Summary", "Skills", "Experience", "Projects", "Education", "Certificates"] as const;

const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic",       name: "Classic",       description: "Name left-aligned, skills table, horizontal dividers — ATS-friendly" },
  { id: "professional",  name: "Professional",  description: "Name & contact centered, company-first experience, clean minimal layout" },
  { id: "modern-purple", name: "Modern Purple", description: "Purple accents, left-bar section headers" },
  { id: "executive",     name: "Executive",     description: "Two-column dark sidebar with white content" },
  { id: "minimal-dark",  name: "Minimal Dark",  description: "Dark header, clean white body, bold type" },
  { id: "creative-tech", name: "Creative Tech", description: "Teal accents, skill tags, dev-focused layout" },
];

const SKILL_PLACEHOLDERS: Record<string, string> = {
  Frontend: "React, Next.js, TypeScript, TailwindCSS",
  Backend: "Node.js, Express, Python, FastAPI",
  Database: "PostgreSQL, MongoDB, Redis",
  Deployment: "Docker, AWS, Vercel, CI/CD",
  Automation: "Selenium, Playwright, GitHub Actions",
  Frameworks: "Next.js, NestJS, Django, Laravel",
  Tools: "Git, VS Code, Postman, Figma",
};

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultPersonal: PersonalInfo = { name: "", title: "", email: "", phone: "", location: "", portfolio: "", github: "", linkedin: "" };
const defaultSkills: SkillCategoryEntry[] = SKILL_CATEGORIES.map(c => ({ category: c, items: "" }));
const uid = () => Math.random().toString(36).slice(2);
const makeExp = (): ExperienceEntry => ({ id: uid(), title: "", company: "", duration: "", bullets: "" });
const makeProject = (): ProjectEntry => ({ id: uid(), name: "", liveLink: "", description: "", techStack: "" });
const makeEdu = (): EducationEntry => ({ id: uid(), degree: "", institution: "", dates: "" });
const makeCert = (): CertificateEntry => ({ id: uid(), issuer: "", date: "", names: "" });
const splitCSV = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
const splitLines = (s: string) => s.split("\n").map(x => x.trim()).filter(Boolean);

// ── Template preview thumbnails ───────────────────────────────────────────────

function TemplatePreview({ id }: { id: TemplateId }) {
  if (id === "classic") return (
    <div className="w-full h-20 bg-white rounded border border-gray-200 p-2 space-y-1.5">
      <div className="h-2 w-16 bg-gray-800 rounded-sm" />
      <div className="h-px bg-gray-300" />
      <div className="space-y-1"><div className="h-1 w-full bg-gray-200 rounded-sm" /><div className="h-1 w-3/4 bg-gray-200 rounded-sm" /></div>
      <div className="h-px bg-gray-300" />
      <div className="space-y-1"><div className="h-1 w-full bg-gray-200 rounded-sm" /><div className="h-1 w-5/6 bg-gray-200 rounded-sm" /></div>
    </div>
  );
  if (id === "professional") return (
    <div className="w-full h-20 bg-white rounded border border-gray-200 p-2 space-y-1.5">
      <div className="flex flex-col items-center gap-1">
        <div className="h-2 w-16 bg-gray-800 rounded-sm" />
        <div className="h-1 w-24 bg-gray-300 rounded-sm" />
      </div>
      <div className="h-px bg-gray-300" />
      <div className="space-y-1 pt-0.5">
        <div className="h-1.5 w-14 bg-gray-700 rounded-sm" />
        <div className="h-1 w-full bg-gray-200 rounded-sm" />
        <div className="h-1 w-4/5 bg-gray-200 rounded-sm" />
      </div>
    </div>
  );
  if (id === "modern-purple") return (
    <div className="w-full h-20 bg-white rounded border border-gray-200 p-2 space-y-2">
      <div className="h-2 w-16 bg-[#534AB7] rounded-sm" />
      <div className="flex gap-1.5 items-start">
        <div className="w-1 h-10 bg-[#534AB7] shrink-0 rounded-sm" />
        <div className="space-y-1 flex-1 pt-0.5">
          <div className="h-1.5 w-14 bg-[#534AB7]/70 rounded-sm" />
          <div className="h-1 w-full bg-gray-200 rounded-sm" />
          <div className="h-1 w-4/5 bg-gray-200 rounded-sm" />
          <div className="h-1 w-full bg-gray-200 rounded-sm" />
        </div>
      </div>
    </div>
  );
  if (id === "executive") return (
    <div className="w-full h-20 rounded overflow-hidden flex border border-gray-200">
      <div className="w-1/3 bg-[#1C2032] p-1.5 space-y-1">
        <div className="h-2 w-full bg-white/60 rounded-sm" />
        <div className="h-px bg-white/20" />
        <div className="h-1 w-full bg-white/30 rounded-sm" /><div className="h-1 w-3/4 bg-white/30 rounded-sm" />
        <div className="h-px bg-white/20" />
        <div className="h-1 w-full bg-white/30 rounded-sm" /><div className="h-1 w-2/3 bg-white/30 rounded-sm" />
      </div>
      <div className="flex-1 bg-white p-1.5 space-y-1.5">
        <div className="h-1.5 w-12 bg-gray-700 rounded-sm" />
        <div className="h-1 w-full bg-gray-200 rounded-sm" /><div className="h-1 w-5/6 bg-gray-200 rounded-sm" />
        <div className="h-1.5 w-12 bg-gray-700 rounded-sm mt-1" />
        <div className="h-1 w-full bg-gray-200 rounded-sm" /><div className="h-1 w-4/5 bg-gray-200 rounded-sm" />
      </div>
    </div>
  );
  if (id === "minimal-dark") return (
    <div className="w-full h-20 bg-white rounded border border-gray-200 overflow-hidden">
      <div className="h-8 bg-gray-900 px-2 pt-1.5 space-y-1">
        <div className="h-2 w-16 bg-white rounded-sm" />
        <div className="h-1 w-10 bg-white/50 rounded-sm" />
      </div>
      <div className="p-2 space-y-1.5">
        <div className="h-1.5 w-10 bg-gray-800 rounded-sm" />
        <div className="h-1 w-full bg-gray-200 rounded-sm" /><div className="h-1 w-5/6 bg-gray-200 rounded-sm" />
        <div className="h-1.5 w-10 bg-gray-800 rounded-sm" />
        <div className="h-1 w-full bg-gray-200 rounded-sm" />
      </div>
    </div>
  );
  // creative-tech
  return (
    <div className="w-full h-20 bg-white rounded border border-gray-200 p-2 space-y-1.5">
      <div className="h-2 w-14 bg-gray-800 rounded-sm" />
      <div className="h-1 w-10 bg-[#0D9488] rounded-sm" />
      <div className="flex gap-1 flex-wrap">
        {[8, 11, 7, 9, 6].map((w, k) => (
          <div key={k} style={{ width: `${w * 3}px` }} className="h-3 bg-[#0D9488]/15 border border-[#0D9488]/40 rounded" />
        ))}
      </div>
      <div className="h-1.5 w-10 bg-[#0D9488] rounded-sm" />
      <div className="h-1 w-full bg-gray-200 rounded-sm" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CVMakerPage() {
  const [mode, setMode] = useState<"landing" | "manual" | "ai">("landing");
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [aiDisclaimer, setAiDisclaimer] = useState("");
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [pageMode, setPageMode] = useState<PageMode>("2-page");
  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<SkillCategoryEntry[]>(defaultSkills);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([makeExp()]);
  const [projects, setProjects] = useState<ProjectEntry[]>([makeProject()]);
  const [educations, setEducations] = useState<EducationEntry[]>([makeEdu()]);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([makeCert()]);
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<CVHistoryEntry[]>([]);

  useEffect(() => {
    if (!done) { setSuccessVisible(false); return; }
    const t = setTimeout(() => setSuccessVisible(true), 16);
    return () => clearTimeout(t);
  }, [done]);

  // Sync badge count: on mount and whenever drawer closes
  useEffect(() => { setHistory(loadHistory()); }, [historyOpen]);

  // Pre-fill form when navigated from home page CV History "Edit & Regen"
  useEffect(() => {
    const prefillId = sessionStorage.getItem("cv_prefill_id");
    if (!prefillId) return;
    sessionStorage.removeItem("cv_prefill_id");
    const entry = loadHistory().find(e => e.id === prefillId);
    if (!entry) return;
    setPersonal(entry.formData.personal);
    setSummary(entry.formData.summary);
    setSkills(entry.formData.skills);
    setExperiences(entry.formData.experiences);
    setProjects(entry.formData.projects);
    setEducations(entry.formData.educations);
    setCertificates(entry.formData.certificates);
    setTemplateId(entry.template);
    setPageMode(entry.pageMode);
    setStep(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPayload = (): CVPDFData => ({
    personalInfo: personal,
    summary,
    skills: skills.map(sk => ({ category: sk.category, items: splitCSV(sk.items) })).filter(sk => sk.items.length > 0),
    experience: experiences.map(e => ({ title: e.title, company: e.company, duration: e.duration, bullets: splitLines(e.bullets) })),
    projects: projects.filter(p => p.name.trim()).map(p => ({ name: p.name, liveLink: p.liveLink, description: p.description, techStack: p.techStack })),
    education: educations.filter(e => e.degree.trim()).map(e => ({ degree: e.degree, institution: e.institution, dates: e.dates })),
    certificates: certificates.filter(c => c.issuer.trim() || c.names.trim()).map(c => ({ issuer: c.issuer, date: c.date, names: splitLines(c.names) })),
  });

  const handleGenerate = async (enhance: boolean) => {
    setLoading(true); setAiMode(enhance); setError(""); setDone(false);
    try {
      const payload = buildPayload();
      let finalData: CVPDFData = payload;

      if (enhance) {
        const res = await fetch("/api/generate-cv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const b = (await res.json()) as { error?: string }; throw new Error(b.error ?? "AI enhancement failed"); }
        finalData = (await res.json()) as CVPDFData;
      }

      const { generateCVPDF } = await import("@/lib/generateCVPDF");
      await generateCVPDF(finalData, templateId, pageMode);

      saveToHistory({ name: personal.name || "Untitled", template: templateId, pageMode, formData: { personal, summary, skills, experiences, projects, educations, certificates } });
      setHistory(loadHistory());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleEditAndRegenerate = (entry: CVHistoryEntry) => {
    setPersonal(entry.formData.personal);
    setSummary(entry.formData.summary);
    setSkills(entry.formData.skills);
    setExperiences(entry.formData.experiences);
    setProjects(entry.formData.projects);
    setEducations(entry.formData.educations);
    setCertificates(entry.formData.certificates);
    setTemplateId(entry.template);
    setPageMode(entry.pageMode);
    setStep(1);
    setDone(false);
    setError("");
    setHistoryOpen(false);
  };

  const handleAIComplete = (data: AIGeneratedData, disclaimer: string) => {
    setPersonal(data.personalInfo);
    setSummary(data.summary);
    // Merge AI skills into all 7 fixed categories
    const aiSkillMap = new Map(data.skills.map(s => [s.category, s.items]));
    setSkills(SKILL_CATEGORIES.map(cat => ({ category: cat, items: aiSkillMap.get(cat) ?? "" })));
    setExperiences(data.experiences.length > 0 ? data.experiences.map(e => ({ ...e, id: uid() })) : [makeExp()]);
    setProjects(data.projects.length > 0 ? data.projects.map(p => ({ ...p, id: uid() })) : [makeProject()]);
    setEducations(data.educations.length > 0 ? data.educations.map(e => ({ ...e, id: uid() })) : [makeEdu()]);
    setCertificates(data.certificates.length > 0 ? data.certificates.map(c => ({ ...c, id: uid() })) : [makeCert()]);
    setIsAIGenerated(true);
    setAiDisclaimer(disclaimer);
    setDone(false);
    setError("");
    setStep(0);
    setMode("manual");
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const inp = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent transition-colors";
  const lbl = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";
  const addBtn = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#534AB7] border border-[#534AB7] rounded-lg hover:bg-[#534AB7]/10 transition-colors";
  const card = "p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 relative";

  // ── Step 0: Template ──────────────────────────────────────────────────────

  const renderTemplate = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Choose a CV Template</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Select the visual style for your PDF. You can change this at any time.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map(tmpl => (
          <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id)}
            className={`text-left p-3 rounded-xl border-2 transition-all ${templateId === tmpl.id ? "border-[#534AB7] bg-[#534AB7]/5 dark:bg-[#534AB7]/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
            <TemplatePreview id={tmpl.id} />
            <p className="mt-2.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{tmpl.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{tmpl.description}</p>
            {templateId === tmpl.id && <span className="inline-block mt-1.5 text-[10px] font-semibold text-[#534AB7] dark:text-[#8B85E8]">✓ Selected</span>}
          </button>
        ))}
      </div>

      {/* Page mode selector */}
      <div className="pt-5 border-t border-gray-100 dark:border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Page Length</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "1-page" as PageMode, label: "1 Page", icon: "▣", desc: "Compact sizing — reduced fonts & margins, bullets truncated to fit" },
            { id: "2-page" as PageMode, label: "2 Pages", icon: "▤", desc: "Comfortable spacing — full fonts, complete bullets, auto page break" },
          ].map(opt => (
            <button key={opt.id} onClick={() => setPageMode(opt.id)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${pageMode === opt.id ? "border-[#534AB7] bg-[#534AB7]/5 dark:bg-[#534AB7]/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{opt.icon}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{opt.label}</span>
                {pageMode === opt.id && <span className="ml-auto text-[10px] font-semibold text-[#534AB7] dark:text-[#8B85E8]">✓</span>}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{opt.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600">Page numbers are added automatically to both modes.</p>
      </div>
    </div>
  );

  // ── Step 1: Personal ──────────────────────────────────────────────────────

  const personalFields: { key: keyof PersonalInfo; label: string; placeholder: string; type?: string; wide?: boolean }[] = [
    { key: "name", label: "Full Name", placeholder: "Jane Doe" },
    { key: "title", label: "Professional Title", placeholder: "Full-Stack Developer | React | Node.js", wide: true },
    { key: "email", label: "Email", placeholder: "jane@example.com", type: "email" },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000" },
    { key: "location", label: "Location", placeholder: "New York, NY" },
    { key: "portfolio", label: "Portfolio URL", placeholder: "portfolio.example.com" },
    { key: "github", label: "GitHub URL", placeholder: "github.com/janedoe" },
    { key: "linkedin", label: "LinkedIn URL", placeholder: "linkedin.com/in/janedoe" },
  ];

  const renderPersonal = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Personal Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {personalFields.map(({ key, label: lb, placeholder, type, wide }) => (
          <div key={key} className={wide ? "sm:col-span-2" : ""}>
            <label className={lbl}>{lb}</label>
            <input type={type ?? "text"} value={personal[key]}
              onChange={e => setPersonal(p => ({ ...p, [key]: e.target.value } as PersonalInfo))}
              placeholder={placeholder} className={inp} />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step 2: Summary ───────────────────────────────────────────────────────

  const renderSummary = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Professional Summary</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Write 3-4 sentences. AI will enhance it with stronger professional language.</p>
      </div>
      <textarea value={summary} onChange={e => setSummary(e.target.value)}
        placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean code and user-centred design."
        rows={6} className={`${inp} resize-y`} />
    </div>
  );

  // ── Step 3: Skills ────────────────────────────────────────────────────────

  const renderSkills = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Skills by Category</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Comma-separated. AI will suggest additional skills based on your experience.</p>
      </div>
      <div className="space-y-3">
        {skills.map((sk, i) => (
          <div key={sk.category} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400">{sk.category}</span>
            <input type="text" value={sk.items}
              onChange={e => setSkills(l => l.map((s, j) => j === i ? { ...s, items: e.target.value } : s))}
              placeholder={SKILL_PLACEHOLDERS[sk.category] ?? ""} className={inp} />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Step 4: Experience ────────────────────────────────────────────────────

  const renderExperience = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Work Experience</h2>
        <button onClick={() => setExperiences(e => [...e, makeExp()])} className={addBtn}><Plus className="w-3.5 h-3.5" />Add Job</button>
      </div>
      {experiences.map((exp, i) => (
        <div key={exp.id} className={card}>
          {experiences.length > 1 && <button onClick={() => setExperiences(e => e.filter(x => x.id !== exp.id))} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Position {i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={lbl}>Job Title</label><input type="text" value={exp.title} onChange={e => setExperiences(l => l.map(x => x.id === exp.id ? { ...x, title: e.target.value } : x))} placeholder="Software Engineer" className={inp} /></div>
            <div><label className={lbl}>Company</label><input type="text" value={exp.company} onChange={e => setExperiences(l => l.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} placeholder="Acme Corp" className={inp} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Dates</label><input type="text" value={exp.duration} onChange={e => setExperiences(l => l.map(x => x.id === exp.id ? { ...x, duration: e.target.value } : x))} placeholder="Jan 2022 – Present" className={inp} /></div>
          </div>
          <div>
            <label className={lbl}>Bullet Points (one per line — AI will enhance with action verbs and metrics)</label>
            <textarea value={exp.bullets} onChange={e => setExperiences(l => l.map(x => x.id === exp.id ? { ...x, bullets: e.target.value } : x))}
              placeholder={`Built REST APIs using Node.js\nReduced page load time by 40%\nLed team of 3 engineers`} rows={4} className={`${inp} resize-y`} />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 5: Projects ──────────────────────────────────────────────────────

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Projects</h2>
        <button onClick={() => setProjects(p => [...p, makeProject()])} className={addBtn}><Plus className="w-3.5 h-3.5" />Add Project</button>
      </div>
      {projects.map((proj, i) => (
        <div key={proj.id} className={card}>
          {projects.length > 1 && <button onClick={() => setProjects(p => p.filter(x => x.id !== proj.id))} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Project {i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={lbl}>Project Name</label><input type="text" value={proj.name} onChange={e => setProjects(l => l.map(x => x.id === proj.id ? { ...x, name: e.target.value } : x))} placeholder="CareerLens" className={inp} /></div>
            <div><label className={lbl}>Live Link (optional)</label><input type="text" value={proj.liveLink} onChange={e => setProjects(l => l.map(x => x.id === proj.id ? { ...x, liveLink: e.target.value } : x))} placeholder="careerlens.vercel.app" className={inp} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Description</label><textarea value={proj.description} onChange={e => setProjects(l => l.map(x => x.id === proj.id ? { ...x, description: e.target.value } : x))} placeholder="AI-powered career tool that analyzes CVs against job descriptions." rows={2} className={`${inp} resize-y`} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Tech Stack</label><input type="text" value={proj.techStack} onChange={e => setProjects(l => l.map(x => x.id === proj.id ? { ...x, techStack: e.target.value } : x))} placeholder="Next.js, TypeScript, Groq API, TailwindCSS" className={inp} /></div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 6: Education ─────────────────────────────────────────────────────

  const renderEducation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Education</h2>
        <button onClick={() => setEducations(e => [...e, makeEdu()])} className={addBtn}><Plus className="w-3.5 h-3.5" />Add Education</button>
      </div>
      {educations.map((edu, i) => (
        <div key={edu.id} className={card}>
          {educations.length > 1 && <button onClick={() => setEducations(e => e.filter(x => x.id !== edu.id))} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Entry {i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className={lbl}>Degree</label><input type="text" value={edu.degree} onChange={e => setEducations(l => l.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))} placeholder="BSc Computer Science" className={inp} /></div>
            <div><label className={lbl}>Institution</label><input type="text" value={edu.institution} onChange={e => setEducations(l => l.map(x => x.id === edu.id ? { ...x, institution: e.target.value } : x))} placeholder="MIT" className={inp} /></div>
            <div><label className={lbl}>Dates</label><input type="text" value={edu.dates} onChange={e => setEducations(l => l.map(x => x.id === edu.id ? { ...x, dates: e.target.value } : x))} placeholder="Sep 2020 – Jun 2024" className={inp} /></div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Step 7: Certificates ──────────────────────────────────────────────────

  const renderCertificates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Certificates</h2>
        <button onClick={() => setCertificates(c => [...c, makeCert()])} className={addBtn}><Plus className="w-3.5 h-3.5" />Add Issuer</button>
      </div>
      {certificates.map((cert, i) => (
        <div key={cert.id} className={card}>
          {certificates.length > 1 && <button onClick={() => setCertificates(c => c.filter(x => x.id !== cert.id))} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Issuer {i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={lbl}>Issuer / Organization</label><input type="text" value={cert.issuer} onChange={e => setCertificates(l => l.map(x => x.id === cert.id ? { ...x, issuer: e.target.value } : x))} placeholder="Amazon Web Services" className={inp} /></div>
            <div><label className={lbl}>Date</label><input type="text" value={cert.date} onChange={e => setCertificates(l => l.map(x => x.id === cert.id ? { ...x, date: e.target.value } : x))} placeholder="2024" className={inp} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Certificate Names (one per line)</label><textarea value={cert.names} onChange={e => setCertificates(l => l.map(x => x.id === cert.id ? { ...x, names: e.target.value } : x))} placeholder={`AWS Certified Solutions Architect\nAWS Certified Developer`} rows={3} className={`${inp} resize-y`} /></div>
          </div>
        </div>
      ))}

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>}

      {done ? (
        <div className={`transition-all duration-300 ease-out ${successVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center space-y-4">
            <div className="flex justify-center"><CheckCircle2 className="w-12 h-12 text-green-500" /></div>
            <div>
              <p className="text-base font-semibold text-green-700 dark:text-green-400">Your CV is ready!</p>
              <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-1">
                {aiMode ? "Enhanced by AI and downloaded" : "Downloaded exactly as you wrote it"} — check your downloads folder
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => handleGenerate(aiMode)} disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#534AB7] text-[#534AB7] dark:text-[#8B85E8] dark:border-[#8B85E8] rounded-lg hover:bg-[#534AB7]/10 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download Again
              </button>
              <Link href="/" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#534AB7] text-white rounded-lg hover:bg-[#4840A0] transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Primary: generate with raw user data */}
          <button onClick={() => handleGenerate(false)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#534AB7] text-white text-sm font-semibold rounded-xl hover:bg-[#4840A0] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            {loading && !aiMode
              ? <><Loader2 className="w-4 h-4 animate-spin" />Generating PDF…</>
              : <><FileText className="w-4 h-4" />Generate &amp; Download CV</>}
          </button>

          {/* Optional: send to Groq first */}
          <button onClick={() => handleGenerate(true)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-[#534AB7] text-[#534AB7] dark:text-[#8B85E8] dark:border-[#8B85E8] text-sm font-semibold rounded-xl hover:bg-[#534AB7]/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            {loading && aiMode
              ? <><Loader2 className="w-4 h-4 animate-spin" />Enhancing with AI…</>
              : <><Sparkles className="w-4 h-4" />Enhance with AI</>}
          </button>
        </div>
      )}
    </div>
  );

  // ── Step −1: Landing ─────────────────────────────────────────────────────

  const renderLanding = () => (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Create Your CV</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">Choose how you&apos;d like to build it</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Manual */}
        <button onClick={() => setMode("manual")}
          className="group text-left p-5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-[#534AB7] dark:hover:border-[#534AB7] hover:bg-[#534AB7]/5 dark:hover:bg-[#534AB7]/10 transition-all duration-150 space-y-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 group-hover:bg-[#534AB7]/10 rounded-xl flex items-center justify-center transition-colors">
            <FileText className="w-5 h-5 text-gray-500 group-hover:text-[#534AB7] transition-colors" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Fill Manually</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
              Step-by-step form with full control over every field. Best if you know exactly what to write.
            </p>
          </div>
          <p className="text-xs font-medium text-[#534AB7] dark:text-[#8B85E8] opacity-0 group-hover:opacity-100 transition-opacity">
            Start form →
          </p>
        </button>

        {/* AI Generate */}
        <button onClick={() => setMode("ai")}
          className="group text-left p-5 border-2 border-[#534AB7]/30 bg-gradient-to-br from-[#534AB7]/5 to-purple-500/5 dark:from-[#534AB7]/10 dark:to-purple-500/10 rounded-2xl hover:border-[#534AB7] hover:from-[#534AB7]/10 hover:to-purple-500/10 transition-all duration-150 space-y-3">
          <div className="w-10 h-10 bg-[#534AB7]/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#534AB7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">AI Generate My CV</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#534AB7] text-white rounded-full leading-none">NEW</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
              Answer 6 quick questions. AI structures your experience into a professional CV — then you review and edit.
            </p>
          </div>
          <p className="text-xs font-medium text-[#534AB7] dark:text-[#8B85E8]">Try it →</p>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ["⚡", "Instant", "PDF in minutes"],
          ["✏️", "Editable", "Full control before download"],
          ["📋", "ATS-ready", "6 professional templates"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-base mb-1">{icon}</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center shrink-0"><Brain className="w-5 h-5 text-white" /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">CareerLens</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5 hidden sm:block">CV Maker</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setHistoryOpen(true)}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#534AB7] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {history.length > 9 ? "9+" : history.length}
                </span>
              )}
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Step indicator — only in manual mode */}
        {mode === "manual" && (
          <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
            {STEPS.map((name, i) => (
              <div key={name} className="flex items-center gap-1">
                <button onClick={() => { if (i < step) setStep(i); }} disabled={i >= step}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${i === step ? "bg-[#534AB7] text-white" : i < step ? "bg-[#534AB7]/15 text-[#534AB7] dark:text-[#8B85E8] hover:bg-[#534AB7]/25 cursor-pointer" : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"}`}>
                  <span className="font-bold w-4 text-center">{i + 1}</span>
                  <span className="hidden lg:inline pr-0.5">{name}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`w-2.5 h-px ${i < step ? "bg-[#534AB7]" : "bg-gray-200 dark:bg-gray-700"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-8">

          {/* ── Landing ── */}
          {mode === "landing" && renderLanding()}

          {/* ── AI flow ── */}
          {mode === "ai" && (
            <AIGenerateFlow
              onComplete={handleAIComplete}
              onCancel={() => setMode("landing")}
            />
          )}

          {/* ── Manual form ── */}
          {mode === "manual" && (
            <>
              {/* AI-generated banner */}
              {isAIGenerated && aiDisclaimer && (
                <div className={`mb-5 flex items-start gap-3 p-3 rounded-xl border ${
                  aiDisclaimer.startsWith("⚠️")
                    ? "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700/40"
                    : "bg-[#534AB7]/8 border-[#534AB7]/25"
                }`}>
                  <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${aiDisclaimer.startsWith("⚠️") ? "text-amber-500" : "text-[#534AB7]"}`} />
                  <p className={`flex-1 text-xs font-medium ${aiDisclaimer.startsWith("⚠️") ? "text-amber-700 dark:text-amber-400" : "text-[#534AB7] dark:text-[#8B85E8]"}`}>
                    {aiDisclaimer}
                  </p>
                  <button onClick={() => setIsAIGenerated(false)}
                    className={`text-sm font-bold transition-colors leading-none ${aiDisclaimer.startsWith("⚠️") ? "text-amber-400 hover:text-amber-600" : "text-[#534AB7]/50 hover:text-[#534AB7]"}`}>
                    ×
                  </button>
                </div>
              )}

              {step === 0 && renderTemplate()}
              {step === 1 && renderPersonal()}
              {step === 2 && renderSummary()}
              {step === 3 && renderSkills()}
              {step === 4 && renderExperience()}
              {step === 5 && renderProjects()}
              {step === 6 && renderEducation()}
              {step === 7 && renderCertificates()}

              <div className={`flex mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 ${step === 0 ? "justify-between" : "justify-between"}`}>
                <button
                  onClick={() => step === 0 ? setMode("landing") : setStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                  {step === 0 ? "Back" : "Back"}
                </button>
                {step < STEPS.length - 1 && (
                  <button onClick={() => setStep(s => s + 1)}
                    className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[#534AB7] text-white rounded-xl hover:bg-[#4840A0] transition-colors">
                    Next<ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {mode === "manual" && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        )}
      </main>

      <CVHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onEditAndRegenerate={handleEditAndRegenerate}
      />
    </div>
  );
}
