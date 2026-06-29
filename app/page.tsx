"use client";

import Link from "next/link";
import {
  Brain, Sparkles, BarChart3, ShieldCheck,
  ChevronRight, CheckCircle2, Pencil,
} from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">

      {/* ── Navbar ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">CareerLens</span>
          </div>
          <nav className="flex items-center gap-1 shrink-0">
            <Link
              href="/analyze"
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block"
            >
              Analyze CV
            </Link>
            <Link
              href="/cv-maker"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-[#534AB7] text-white rounded-lg hover:bg-[#4840A0] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CV Maker</span>
            </Link>
            <DarkModeToggle />
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#534AB7]/8 via-purple-500/4 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#534AB7]/10 text-[#534AB7] dark:text-[#8B85E8] rounded-full text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Anas · Premium
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-50 leading-tight tracking-tight mb-6">
            Land More Interviews
            <br className="hidden sm:block" />
            <span className="text-[#534AB7]"> with AI-Powered</span>
            <br className="hidden sm:block" />
            CV Intelligence
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your CV, paste job descriptions, and get instant AI analysis on match scores,
            skill gaps, and ATS optimization — or let AI build your entire CV from scratch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="flex items-center gap-2 px-7 py-3.5 bg-[#534AB7] text-white font-semibold rounded-xl shadow-lg shadow-[#534AB7]/30 hover:bg-[#4840A0] hover:shadow-xl hover:shadow-[#534AB7]/40 hover:scale-105 active:scale-95 transition-all duration-150 text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Analyze My CV
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cv-maker"
              className="flex items-center gap-2 px-7 py-3.5 border-2 border-[#534AB7] text-[#534AB7] dark:text-[#8B85E8] dark:border-[#534AB7]/60 font-semibold rounded-xl hover:bg-[#534AB7]/8 hover:scale-105 active:scale-95 transition-all duration-150 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Build My CV
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Everything you need to get hired
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              AI tools built for job seekers who want results — not just advice.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-6 h-6 text-[#534AB7]" />,
                title: "CV Match Analysis",
                desc: "Paste any job description and instantly see your match score, keyword gaps, and ATS compatibility rating.",
                href: "/analyze",
              },
              {
                icon: <Pencil className="w-6 h-6 text-[#534AB7]" />,
                title: "AI CV Builder",
                desc: "Fill a guided form or let AI generate your entire CV through a smart conversation — 5 premium templates.",
                href: "/cv-maker",
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-[#534AB7]" />,
                title: "ATS Optimization",
                desc: "Score your CV against applicant tracking systems and get actionable tips to pass automated screening.",
                href: "/analyze",
              },
            ].map(({ icon, title, desc, href }) => (
              <Link
                key={title}
                href={href}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md hover:border-[#534AB7]/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#534AB7]/10 flex items-center justify-center mb-4 group-hover:bg-[#534AB7]/15 transition-colors">
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Get started in 3 steps
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              From upload to actionable insights in under a minute.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your CV",
                desc: "Paste text or upload a PDF — we extract everything automatically.",
              },
              {
                step: "02",
                title: "Add Job Descriptions",
                desc: "Paste up to 3 JDs at once and compare your match against each role.",
              },
              {
                step: "03",
                title: "Get AI Insights",
                desc: "Receive your match score, keyword analysis, and ATS tips in seconds.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#534AB7] text-white font-bold text-lg flex items-center justify-center mb-4 shadow-lg shadow-[#534AB7]/30">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────────── */}
      <section className="bg-[#534AB7] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: "100%", label: "Free to use" },
              { value: "<10s", label: "Analysis time" },
              { value: "5", label: "CV templates" },
              { value: "Groq", label: "AI powered" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{value}</div>
                <div className="text-sm text-purple-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#534AB7]/10 rounded-2xl mb-6">
            <CheckCircle2 className="w-7 h-7 text-[#534AB7]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to land your dream job?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Start for free — no account needed. Analyze your CV or build one from scratch in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="flex items-center gap-2 px-7 py-3.5 bg-[#534AB7] text-white font-semibold rounded-xl shadow-lg shadow-[#534AB7]/30 hover:bg-[#4840A0] hover:scale-105 active:scale-95 transition-all duration-150 text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Analyze My CV
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cv-maker"
              className="flex items-center gap-2 px-7 py-3.5 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-[#534AB7] hover:text-[#534AB7] dark:hover:text-[#8B85E8] dark:hover:border-[#534AB7]/60 hover:scale-105 active:scale-95 transition-all duration-150 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Build My CV
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#534AB7] rounded-md flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-600 dark:text-gray-400">CareerLens</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/analyze" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              Analyze CV
            </Link>
            <Link href="/cv-maker" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              CV Maker
            </Link>
          </div>
          <p>Powered by Groq AI · Free forever</p>
        </div>
      </footer>
    </div>
  );
}
