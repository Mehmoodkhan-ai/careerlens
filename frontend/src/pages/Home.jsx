import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

/* ── Circular SVG progress ring ─────────────────────────────── */
function CircleProgress({ pct, size = 140, stroke = 10, color = "#2DD4A7" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E6FB" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Thin horizontal progress bar ───────────────────────────── */
function Bar({ label, pct, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[12px] text-[#374151]">{label}</span>
        <span className="text-[12px] font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Floating analysis card (hero right side) ───────────────── */
function AnalysisCard() {
  return (
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[300px]"
      style={{ boxShadow: "0 20px 60px rgba(44,42,110,0.15)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase">Match Analysis</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>

      {/* Circular score */}
      <div className="relative flex items-center justify-center mb-5">
        <CircleProgress pct={87} />
        <div className="absolute flex flex-col items-center">
          <span className="text-[28px] font-bold text-[#111827]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>87%</span>
          <span className="text-[11px] font-medium text-[#2DD4A7]">Strong Match</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="flex flex-col gap-3 mb-5">
        <Bar label="Keyword Match" pct={91} color="#2DD4A7" />
        <Bar label="Skills Match" pct={84} color="#7C78C8" />
        <Bar label="Experience" pct={79} color="#2D2A6E" />
      </div>

      {/* Skill tags */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Python", bg: "#F3F4F6", color: "#374151" },
          { label: "React", bg: "#F3F4F6", color: "#374151" },
          { label: "GraphQL", bg: "#FFF5F0", color: "#C04B1F" },
          { label: "AWS", bg: "#FFF5F0", color: "#C04B1F" },
        ].map((t) => (
          <span key={t.label} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: t.bg, color: t.color }}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const stats = [
  { value: "47,000+", label: "CVs Analyzed" },
  { value: "89%", label: "Success Rate" },
  { value: "4.9 / 5", label: "User Rating" },
  { value: "120+", label: "Job Categories" },
];

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
    title: "ATS-Aware Scoring",
    desc: "Know exactly how ATS systems rank your CV with detailed keyword gap analysis.",
    bg: "#F5F4FF",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DD4A7" strokeWidth="1.8">
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="3" width="18" height="18" rx="3" />
      </svg>
    ),
    title: "Keyword Precision",
    desc: "Surface missing keywords from job descriptions and see exactly where to add them.",
    bg: "#F0FDF9",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" strokeWidth="1.8">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Instant Suggestions",
    desc: "Get AI-powered rewrites and improvement tips in under 10 seconds.",
    bg: "#FFF5F0",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C78C8" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      </svg>
    ),
    title: "Experience Fit",
    desc: "Measure how closely your years and seniority align with each JD requirement.",
    bg: "#F5F4FF",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
      </svg>
    ),
    title: "CV Maker",
    desc: "Build a polished CV from scratch using 6 professional templates and AI guidance.",
    bg: "#F9F8FF",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DD4A7" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Track Your Progress",
    desc: "Review all past analyses and compare how your CV improves over time.",
    bg: "#F0FDF9",
  },
];

const steps = [
  {
    num: "01",
    title: "Upload Your CV",
    desc: "Upload a PDF, DOCX, or paste your CV text directly. We handle the parsing instantly.",
  },
  {
    num: "02",
    title: "Fetch Job Descriptions",
    desc: "Search live remote jobs or paste JDs manually. Minimum 5 required for analysis.",
  },
  {
    num: "03",
    title: "Get AI Analysis",
    desc: "Receive match scores, ATS tips, keyword gaps, and actionable improvement suggestions.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5F4FF 50%, #EBE8FB 100%)" }}>

        {/* Decorative background circles */}
        <div className="absolute right-0 top-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
            <circle cx="400" cy="200" r="280" stroke="#E5E7EB" strokeWidth="1" />
            <circle cx="400" cy="200" r="200" stroke="#E5E7EB" strokeWidth="1" />
            <circle cx="400" cy="200" r="120" stroke="#E5E7EB" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 flex flex-col lg:flex-row items-center gap-16">

          {/* Left copy */}
          <div className="flex-1 max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E6FB] text-[#2D2A6E] text-[13px] font-medium mb-8 shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#2DD4A7">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              AI-Powered Career Intelligence
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-[62px] font-bold leading-[1.1] mb-6 text-[#111827]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              See Exactly How{" "}
              <span className="text-[#2DD4A7]">You</span>
              <br />
              <span className="text-[#2DD4A7]">Match.</span>
              <br />
              Instantly.
            </h1>

            {/* Subtext */}
            <p className="text-[16px] text-[#6B7280] leading-relaxed mb-10 max-w-[440px]">
              CareerLens scores your CV against any job description in seconds — revealing keyword gaps, skill mismatches, and exactly what to fix before you hit send.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2D2A6E] text-white font-semibold text-[15px] hover:bg-[#3D3A9E] transition-colors shadow-lg"
              >
                Analyze My CV
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#D1D5DB] text-[#374151] font-semibold text-[15px] hover:border-[#7C78C8] hover:text-[#2D2A6E] bg-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                See a Sample Result
              </Link>
            </div>

            <p className="text-[12px] text-[#9CA3AF]">
              No sign-up required. Your CV stays private. Results in under 10 seconds.
            </p>
          </div>

          {/* Right card */}
          <div className="flex-1 flex justify-center lg:justify-end relative">
            {/* Decorative teal blob behind card */}
            <div className="absolute bottom-[-40px] left-[50%] w-56 h-56 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #2DD4A7 0%, transparent 70%)", transform: "translateX(-60%)" }} />
            <div className="relative z-10 mt-6 lg:mt-0">
              <AnalysisCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section className="border-y border-[#E5E7EB] bg-white py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-[28px] sm:text-[32px] font-bold text-[#111827]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.value}
              </div>
              <div className="text-[13px] text-[#6B7280] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[36px] font-bold text-[#111827] mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Built for Real Job Seekers
            </h2>
            <p className="text-[#6B7280] text-[15px] max-w-xl mx-auto">
              Everything you need to optimize your application — from the first keyword to the final cover letter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title}
                className="p-6 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#7C78C8] hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: f.bg }}>
                  {f.icon}
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] font-bold text-[#111827] mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How It Works
            </h2>
            <p className="text-[#6B7280] text-[15px]">Three simple steps to unlock your career potential.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-[#E5E7EB]" />

            {steps.map((s, i) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10"
                  style={{ backgroundColor: i === 1 ? "#2D2A6E" : "#F5F4FF" }}>
                  <span className="text-[14px] font-bold"
                    style={{ color: i === 1 ? "#2DD4A7" : "#2D2A6E", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.num}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.title}
                </h3>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="py-20 px-6"
        style={{ background: "linear-gradient(135deg, #2D2A6E 0%, #4340A0 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[36px] font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Get Your Score?
          </h2>
          <p className="text-[#E8E6FB] text-[15px] mb-8 max-w-xl mx-auto">
            Join thousands of job seekers who use CareerLens to land interviews faster.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#2DD4A7] text-[#111827] font-bold text-[15px] hover:opacity-90 transition-opacity shadow-xl"
          >
            Analyze My CV Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border-2 border-[#2DD4A7] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#2DD4A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-[#111827] text-[15px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              CareerLens
            </span>
          </div>
          <p className="text-[12px] text-[#9CA3AF]">
            © {new Date().getFullYear()} CareerLens · Powered by Groq AI · No sign-up required
          </p>
          <div className="flex gap-6">
            <Link to="/analyze" className="text-[13px] text-[#6B7280] hover:text-[#2D2A6E]">Analyze CV</Link>
            <Link to="/cv-maker" className="text-[13px] text-[#6B7280] hover:text-[#2D2A6E]">CV Maker</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
