import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import AIGenerateFlow from "../components/AIGenerateFlow.jsx";
import { generateCVPDF } from "../lib/generateCVPDF.js";
import { generateCV } from "../lib/api.js";
import { loadCVHistory, saveToCVHistory, deleteFromCVHistory, clearCVHistory, formatHistoryDate } from "../lib/cvHistory.js";

const DEFAULT_PERSONAL = { name: "", title: "", email: "", phone: "", location: "", portfolio: "", github: "", linkedin: "" };
const DEFAULT_SKILL_CATEGORIES = ["Frontend", "Backend", "Database", "Deployment", "Automation", "Frameworks", "Tools"];
const DEFAULT_SKILLS = DEFAULT_SKILL_CATEGORIES.map((c) => ({ category: c, items: "" }));

const mkExp  = () => ({ id: Math.random().toString(36).slice(2), title: "", company: "", duration: "", bullets: "" });
const mkProj = () => ({ id: Math.random().toString(36).slice(2), name: "", liveLink: "", description: "", techStack: "" });
const mkEdu  = () => ({ id: Math.random().toString(36).slice(2), degree: "", institution: "", dates: "" });
const mkCert = () => ({ id: Math.random().toString(36).slice(2), issuer: "", date: "", names: "" });

const TEMPLATES = [
  { id: "classic",        label: "Classic",       color: "#1F2937" },
  { id: "professional",   label: "Professional",  color: "#0F172A" },
  { id: "modern-purple",  label: "Modern Purple", color: "#534AB7" },
  { id: "executive",      label: "Executive",     color: "#1C2032" },
  { id: "minimal-dark",   label: "Minimal Dark",  color: "#111827" },
  { id: "creative-tech",  label: "Creative Tech", color: "#0D9488" },
];

const STEPS = ["Template", "Personal", "Summary", "Skills", "Experience", "Projects", "Education", "Certificates"];

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-sm focus:outline-none focus:border-[#7C78C8] focus:ring-2 focus:ring-[#7C78C8]/20 transition-colors placeholder-[#9CA3AF]";
const textareaCls = `${inputCls} resize-none`;

function formToPDF(state) {
  return {
    personalInfo: state.personal,
    summary: state.summary,
    skills: state.skills.map((s) => ({ category: s.category, items: s.items.split(",").map((i) => i.trim()).filter(Boolean) })),
    experience: state.experiences.map((e) => ({ ...e, bullets: e.bullets.split("\n").map((b) => b.trim()).filter(Boolean) })),
    projects: state.projects,
    education: state.educations,
    certificates: state.certificates.map((c) => ({ ...c, names: c.names.split("\n").map((n) => n.trim()).filter(Boolean) })),
  };
}

function pdfToForm(data) {
  return {
    personal: data.personalInfo || DEFAULT_PERSONAL,
    summary: data.summary || "",
    skills: DEFAULT_SKILL_CATEGORIES.map((cat) => {
      const found = (data.skills || []).find((s) => s.category === cat);
      return { category: cat, items: found ? found.items.join(", ") : "" };
    }),
    experiences:  (data.experience    || []).map((e) => ({ ...e, id: Math.random().toString(36).slice(2), bullets: (e.bullets || []).join("\n") })),
    projects:     (data.projects      || []).map((p) => ({ ...p, id: Math.random().toString(36).slice(2) })),
    educations:   (data.education     || []).map((e) => ({ ...e, id: Math.random().toString(36).slice(2) })),
    certificates: (data.certificates  || []).map((c) => ({ ...c, id: Math.random().toString(36).slice(2), names: (c.names || []).join("\n") })),
  };
}

export default function CVMaker() {
  const navigate = useNavigate();
  const [mode, setMode]               = useState("landing");
  const [step, setStep]               = useState(0);
  const [template, setTemplate]       = useState("classic");
  const [pageMode, setPageMode]       = useState("2-page");
  const [personal, setPersonal]       = useState(DEFAULT_PERSONAL);
  const [summary, setSummary]         = useState("");
  const [skills, setSkills]           = useState(DEFAULT_SKILLS);
  const [experiences, setExperiences] = useState([mkExp()]);
  const [projects, setProjects]       = useState([mkProj()]);
  const [educations, setEducations]   = useState([mkEdu()]);
  const [certificates, setCertificates] = useState([mkCert()]);
  const [cvHistory, setCvHistory]     = useState([]);
  const [aiLoading, setAiLoading]     = useState(false);
  const [generating, setGenerating]   = useState(false);

  useEffect(() => {
    setCvHistory(loadCVHistory());
    const prefill = sessionStorage.getItem("cv-prefill");
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        const form = pdfToForm(data);
        setPersonal(form.personal);
        setSummary(form.summary);
        setSkills(form.skills);
        setExperiences(form.experiences.length ? form.experiences : [mkExp()]);
        setProjects(form.projects.length ? form.projects : [mkProj()]);
        setEducations(form.educations.length ? form.educations : [mkEdu()]);
        setCertificates(form.certificates.length ? form.certificates : [mkCert()]);
        sessionStorage.removeItem("cv-prefill");
        setMode("manual");
      } catch {}
    }
  }, []);

  const getState = () => ({ personal, summary, skills, experiences, projects, educations, certificates });

  const handleDownload = async () => {
    setGenerating(true);
    try { await generateCVPDF(formToPDF(getState()), template, pageMode); }
    finally { setGenerating(false); }
  };

  const handleSaveHistory = () => {
    const entry = saveToCVHistory({ name: personal.name || "Unnamed CV", template, pageMode, formData: getState() });
    setCvHistory((prev) => [entry, ...prev].slice(0, 20));
  };

  const handleAIEnhance = async () => {
    setAiLoading(true);
    try {
      const enhanced = await generateCV(formToPDF(getState()));
      const form = pdfToForm(enhanced);
      setPersonal(form.personal);
      setSummary(form.summary);
      setSkills(form.skills);
      setExperiences(form.experiences.length ? form.experiences : [mkExp()]);
    } catch { alert("AI enhancement failed. Try again."); }
    finally { setAiLoading(false); }
  };

  const handleAIComplete = (structuredData) => {
    const form = pdfToForm(structuredData);
    setPersonal(form.personal);
    setSummary(form.summary);
    setSkills(form.skills);
    setExperiences(form.experiences.length ? form.experiences : [mkExp()]);
    setProjects(form.projects.length ? form.projects : [mkProj()]);
    setEducations(form.educations.length ? form.educations : [mkEdu()]);
    setCertificates(form.certificates.length ? form.certificates : [mkCert()]);
    setMode("manual");
    setStep(1);
  };

  const restoreFromHistory = (entry) => {
    const f = entry.formData;
    setPersonal(f.personal);
    setSummary(f.summary);
    setSkills(f.skills);
    setExperiences(f.experiences?.length ? f.experiences : [mkExp()]);
    setProjects(f.projects?.length ? f.projects : [mkProj()]);
    setEducations(f.educations?.length ? f.educations : [mkEdu()]);
    setCertificates(f.certificates?.length ? f.certificates : [mkCert()]);
    setTemplate(entry.template);
    setPageMode(entry.pageMode);
    setMode("manual");
    setStep(0);
  };

  const deleteHistory = (id) => setCvHistory(deleteFromCVHistory(id));

  /* ── Landing ───────────────────────────────────────────────── */
  if (mode === "landing") return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <div className="py-12 px-6" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5F4FF 60%, #EBE8FB 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E6FB] text-[#2D2A6E] text-[13px] font-medium mb-5 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2DD4A7" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" strokeLinecap="round" />
            </svg>
            AI-Powered CV Builder
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CV Maker
          </h1>
          <p className="text-[#6B7280] text-lg max-w-md mx-auto">Choose how you want to build your professional CV</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <button onClick={() => setMode("manual")}
            className="p-8 rounded-3xl border border-[#E5E7EB] bg-white hover:border-[#7C78C8] hover:shadow-lg transition-all text-left group">
            <div className="w-14 h-14 rounded-2xl bg-[#E8E6FB] flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="1.8">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2 group-hover:text-[#2D2A6E] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Manual Builder
            </h3>
            <p className="text-[#6B7280] text-sm leading-relaxed">Fill in a structured form with full control over every section of your CV.</p>
          </button>

          <button onClick={() => setMode("ai")}
            className="p-8 rounded-3xl border border-[#E8E6FB] bg-[#F5F4FF] hover:border-[#7C78C8] hover:shadow-lg transition-all text-left group">
            <div className="w-14 h-14 rounded-2xl bg-[#2D2A6E] flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2DD4A7" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2 group-hover:text-[#2D2A6E] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              AI Chat Builder
            </h3>
            <p className="text-[#6B7280] text-sm leading-relaxed">Answer conversational questions and let AI structure your CV automatically.</p>
          </button>
        </div>

        {cvHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#111827]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent CVs</h3>
              <button onClick={() => { clearCVHistory(); setCvHistory([]); }}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors">
                Clear all
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {cvHistory.slice(0, 4).map((h) => (
                <div key={h.id} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#7C78C8] transition-colors flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111827] truncate">{h.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{h.template} · {h.pageMode} · {formatHistoryDate(h.timestamp)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => restoreFromHistory(h)}
                      className="px-3 py-1.5 rounded-full bg-[#E8E6FB] text-[#2D2A6E] text-xs font-medium hover:bg-[#2D2A6E] hover:text-white transition-colors">
                      Restore
                    </button>
                    <button onClick={() => deleteHistory(h.id)}
                      className="p-1.5 text-[#D1D5DB] hover:text-red-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── AI mode ───────────────────────────────────────────────── */
  if (mode === "ai") return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => setMode("landing")}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2A6E] mb-6 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-8 shadow-sm">
          <AIGenerateFlow onComplete={handleAIComplete} onCancel={() => setMode("landing")} />
        </div>
      </div>
    </div>
  );

  /* ── Manual mode ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* Header strip */}
      <div className="border-b border-[#E5E7EB] bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => setMode("landing")}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2D2A6E] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleSaveHistory}
              className="px-4 py-2 rounded-full border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#7C78C8] hover:text-[#2D2A6E] bg-white transition-all">
              Save Draft
            </button>
            <button onClick={handleAIEnhance} disabled={aiLoading}
              className="px-4 py-2 rounded-full bg-[#E8E6FB] text-[#2D2A6E] text-sm font-semibold hover:bg-[#2D2A6E] hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5">
              {aiLoading
                ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                : <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    AI Enhance
                  </>
              }
            </button>
            <button onClick={handleDownload} disabled={generating}
              className="px-4 py-2 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-all disabled:opacity-50 flex items-center gap-1.5">
              {generating
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                : <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download PDF
                  </>
              }
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step tabs */}
        <div className="flex gap-1 p-1 bg-[#F5F4FF] rounded-2xl mb-6 overflow-x-auto border border-[#E8E6FB]">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                step === i
                  ? "bg-white text-[#2D2A6E] shadow-sm border border-[#E8E6FB]"
                  : "text-[#6B7280] hover:text-[#2D2A6E]"
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-8 shadow-sm">

          {/* Step 0: Template */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-[#2D2A6E] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Choose Template</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      template === t.id ? "border-[#2D2A6E] shadow-lg" : "border-[#E5E7EB] hover:border-[#7C78C8]"
                    }`}>
                    <div className="w-full h-20 rounded-xl mb-3 flex items-end p-2" style={{ backgroundColor: t.color }}>
                      <div className="space-y-1 w-full">
                        <div className="h-1.5 rounded bg-white/30 w-3/4" />
                        <div className="h-1 rounded bg-white/20 w-1/2" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-[#374151]">{t.label}</p>
                    {template === t.id && <p className="text-xs text-[#2DD4A7] font-semibold mt-0.5">Selected ✓</p>}
                  </button>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-[#374151] mb-3">Page Mode</h3>
              <div className="flex gap-3">
                {["1-page", "2-page"].map((m) => (
                  <button key={m} onClick={() => setPageMode(m)}
                    className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                      pageMode === m
                        ? "border-[#2D2A6E] bg-[#E8E6FB] text-[#2D2A6E]"
                        : "border-[#E5E7EB] text-[#6B7280] hover:border-[#7C78C8]"
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Personal */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#2D2A6E] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: "name",      label: "Full Name",      placeholder: "Jane Doe" },
                  { key: "title",     label: "Job Title",      placeholder: "Full Stack Developer" },
                  { key: "email",     label: "Email",          placeholder: "jane@example.com" },
                  { key: "phone",     label: "Phone",          placeholder: "+1 234 567 8900" },
                  { key: "location",  label: "Location",       placeholder: "New York, USA" },
                  { key: "portfolio", label: "Portfolio URL",  placeholder: "jane.dev" },
                  { key: "github",    label: "GitHub",         placeholder: "github.com/jane" },
                  { key: "linkedin",  label: "LinkedIn",       placeholder: "linkedin.com/in/jane" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
                    <input value={personal[key]} onChange={(e) => setPersonal({ ...personal, [key]: e.target.value })}
                      placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Summary */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-[#2D2A6E] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Professional Summary</h2>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a compelling 2-3 sentence professional summary that highlights your key skills and experience..."
                rows={6} className={textareaCls} />
              <p className="text-xs text-[#9CA3AF] mt-2">{summary.length} characters</p>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-[#2D2A6E] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Technical Skills</h2>
              <div className="space-y-4">
                {skills.map((sk, i) => (
                  <div key={sk.category}>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">{sk.category}</label>
                    <input value={sk.items}
                      onChange={(e) => setSkills(skills.map((s, idx) => idx === i ? { ...s, items: e.target.value } : s))}
                      placeholder="e.g. React, Vue, TypeScript (comma-separated)"
                      className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Experience */}
          {step === 4 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Work Experience</h2>
                <button onClick={() => setExperiences([...experiences, mkExp()])}
                  className="px-4 py-1.5 rounded-full bg-[#E8E6FB] text-[#2D2A6E] text-sm font-semibold hover:bg-[#2D2A6E] hover:text-white transition-all">
                  + Add
                </button>
              </div>
              <div className="space-y-5">
                {experiences.map((exp, i) => (
                  <div key={exp.id} className="p-5 rounded-2xl border border-[#E5E7EB] space-y-3 relative hover:border-[#7C78C8] transition-colors">
                    <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-[#D1D5DB] hover:text-red-400 transition-colors">✕</button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: "title",    ph: "Job Title" },
                        { key: "company",  ph: "Company" },
                        { key: "duration", ph: "Duration (e.g. Jan 2022 – Present)" },
                      ].map(({ key, ph }) => (
                        <input key={key} value={exp[key]} placeholder={ph}
                          onChange={(e) => setExperiences(experiences.map((x, idx) => idx === i ? { ...x, [key]: e.target.value } : x))}
                          className={inputCls} />
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Bullet Points (one per line)</label>
                      <textarea value={exp.bullets} rows={4}
                        placeholder={"• Developed feature X that increased Y by Z%\n• Led a team of N engineers..."}
                        onChange={(e) => setExperiences(experiences.map((x, idx) => idx === i ? { ...x, bullets: e.target.value } : x))}
                        className={textareaCls} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Projects */}
          {step === 5 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Projects</h2>
                <button onClick={() => setProjects([...projects, mkProj()])}
                  className="px-4 py-1.5 rounded-full bg-[#E8E6FB] text-[#2D2A6E] text-sm font-semibold hover:bg-[#2D2A6E] hover:text-white transition-all">
                  + Add
                </button>
              </div>
              <div className="space-y-5">
                {projects.map((p, i) => (
                  <div key={p.id} className="p-5 rounded-2xl border border-[#E5E7EB] space-y-3 relative hover:border-[#7C78C8] transition-colors">
                    <button onClick={() => setProjects(projects.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-[#D1D5DB] hover:text-red-400 transition-colors">✕</button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: "name",      ph: "Project Name" },
                        { key: "liveLink",  ph: "Live Link (optional)" },
                        { key: "techStack", ph: "Tech Stack (e.g. React, Node.js, PostgreSQL)" },
                      ].map(({ key, ph }) => (
                        <input key={key} value={p[key]} placeholder={ph}
                          onChange={(e) => setProjects(projects.map((x, idx) => idx === i ? { ...x, [key]: e.target.value } : x))}
                          className={inputCls} />
                      ))}
                    </div>
                    <textarea value={p.description} rows={3} placeholder="Project description..."
                      onChange={(e) => setProjects(projects.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))}
                      className={textareaCls} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Education */}
          {step === 6 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Education</h2>
                <button onClick={() => setEducations([...educations, mkEdu()])}
                  className="px-4 py-1.5 rounded-full bg-[#E8E6FB] text-[#2D2A6E] text-sm font-semibold hover:bg-[#2D2A6E] hover:text-white transition-all">
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {educations.map((e, i) => (
                  <div key={e.id} className="p-5 rounded-2xl border border-[#E5E7EB] space-y-3 relative hover:border-[#7C78C8] transition-colors">
                    <button onClick={() => setEducations(educations.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-[#D1D5DB] hover:text-red-400 transition-colors">✕</button>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { key: "degree",      ph: "Degree" },
                        { key: "institution", ph: "Institution" },
                        { key: "dates",       ph: "Dates (e.g. 2018 – 2022)" },
                      ].map(({ key, ph }) => (
                        <input key={key} value={e[key]} placeholder={ph}
                          onChange={(ev) => setEducations(educations.map((x, idx) => idx === i ? { ...x, [key]: ev.target.value } : x))}
                          className={inputCls} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Certificates */}
          {step === 7 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Certificates</h2>
                <button onClick={() => setCertificates([...certificates, mkCert()])}
                  className="px-4 py-1.5 rounded-full bg-[#E8E6FB] text-[#2D2A6E] text-sm font-semibold hover:bg-[#2D2A6E] hover:text-white transition-all">
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {certificates.map((cert, i) => (
                  <div key={cert.id} className="p-5 rounded-2xl border border-[#E5E7EB] space-y-3 relative hover:border-[#7C78C8] transition-colors">
                    <button onClick={() => setCertificates(certificates.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-[#D1D5DB] hover:text-red-400 transition-colors">✕</button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input value={cert.issuer} placeholder="Issuer (e.g. AWS, Google)"
                        onChange={(e) => setCertificates(certificates.map((x, idx) => idx === i ? { ...x, issuer: e.target.value } : x))}
                        className={inputCls} />
                      <input value={cert.date} placeholder="Date (e.g. 2023)"
                        onChange={(e) => setCertificates(certificates.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7280] mb-1">Certificate Names (one per line)</label>
                      <textarea value={cert.names} rows={3}
                        placeholder={"AWS Solutions Architect\nAWS Developer Associate"}
                        onChange={(e) => setCertificates(certificates.map((x, idx) => idx === i ? { ...x, names: e.target.value } : x))}
                        className={textareaCls} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-[#F5F4FF] border border-[#E8E6FB]">
                <h3 className="font-bold text-[#2D2A6E] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ready to download?</h3>
                <p className="text-sm text-[#6B7280] mb-4">Your CV will be generated as a PDF with the {template} template.</p>
                <div className="flex gap-3">
                  <button onClick={handleDownload} disabled={generating}
                    className="flex-1 py-3 rounded-full bg-[#2D2A6E] text-white font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {generating
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                      : <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Download PDF
                        </>
                    }
                  </button>
                  <button onClick={handleSaveHistory}
                    className="px-6 py-3 rounded-full border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#7C78C8] hover:text-[#2D2A6E] bg-white transition-all">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
              className="px-6 py-2.5 rounded-full border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#7C78C8] hover:text-[#2D2A6E] bg-white transition-all disabled:opacity-40">
              ← Back
            </button>
            {step < STEPS.length - 1 && (
              <button onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
