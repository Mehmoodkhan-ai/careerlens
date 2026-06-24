"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  RotateCcw,
  BarChart3,
  ShieldCheck,
  Tag,
  TrendingUp,
  TrendingDown,
  Wand2,
  Mail,
} from "lucide-react";
import { JobDescription } from "./JDStep";
import CVRewriteSection from "./CVRewriteSection";
import CoverLetterSection from "./CoverLetterSection";
import { saveHistoryEntry, type AnalysisResult, type PerJDScore, type Keyword } from "@/lib/storage";
import { generateAnalysisPDF } from "@/lib/generateAnalysisPDF";

export type { AnalysisResult, PerJDScore, Keyword };

interface AnalysisStepProps {
  cvText: string;
  jds: JobDescription[];
  onReset: () => void;
}

// ── Shared score utilities ────────────────────────────────────────────────────

function scoreLabel(s: number) {
  if (s >= 75) return "Strong";
  if (s >= 50) return "Moderate";
  return "Low";
}

function scoreTextColor(s: number) {
  if (s >= 75) return "text-green-600";
  if (s >= 50) return "text-yellow-600";
  return "text-red-500";
}

function scoreBarColor(s: number) {
  if (s >= 75) return "bg-green-500";
  if (s >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreBadgeCls(s: number) {
  if (s >= 75) return "bg-green-50 text-green-700 border-green-200";
  if (s >= 50) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-600 border-red-200";
}

// ── Animated score bar ────────────────────────────────────────────────────────

function useAnimatedScore(target: number | undefined) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === undefined) return;
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.round(current));
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

// ── ScoreCard component ───────────────────────────────────────────────────────

function ScoreCard({
  label,
  score,
  icon,
  suffix = "Match",
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
  suffix?: string;
}) {
  const anim = useAnimatedScore(score);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 flex-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-4xl font-bold ${scoreTextColor(anim)}`}>
          {anim}<span className="text-xl">/100</span>
        </p>
        <p className={`text-sm font-semibold ${scoreTextColor(anim)}`}>
          {scoreLabel(anim)} {suffix}
        </p>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBarColor(anim)}`}
          style={{ width: `${anim}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "results" | "improve" | "cover-letter";

export default function AnalysisStep({ cvText, jds, onReset }: AnalysisStepProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("results");
  // Guards against React StrictMode double-invoking the mount effect
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    runAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      const analysis = data.analysis as AnalysisResult;
      setResult(analysis);
      saveHistoryEntry({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
        score: analysis.match_score,
        ats_score: analysis.ats_score,
        jd_count: jds.length,
        jd_title: analysis.jd_title,
        summary: analysis.summary?.slice(0, 120) ?? "",
        full_analysis: analysis,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ── PDF generation ──────────────────────────────────────────────────────────

  const downloadPDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      await generateAnalysisPDF(result);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-[#534AB7] animate-spin" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Analyzing your CV against {jds.length} job description{jds.length !== 1 ? "s" : ""}…
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">This may take 15–30 seconds</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAnalysis}
            className="flex items-center gap-2 px-5 py-2 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0]"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          <button onClick={onReset} className="px-5 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const presentKeywords = result.keywords?.filter((k) => k.in_cv) ?? [];
  const missingKeywords = result.keywords?.filter((k) => !k.in_cv) ?? [];
  const jdContext = jds.map((j) => j.text).join("\n\n");
  const bestMatchJD = result.per_jd_scores?.find((s) => s.title === result.jd_title);
  const defaultCompany = bestMatchJD?.company ?? jds[0]?.company ?? "";

  // ── Results ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Analysis Results</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Best match: <span className="font-medium text-gray-700 dark:text-gray-200">{result.jd_title}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          {activeTab === "results" && (
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {pdfLoading ? "Generating…" : "Download PDF"}
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {(
          [
            { id: "results", label: "Results", icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: "improve", label: "Improve CV", icon: <Wand2 className="w-3.5 h-3.5" /> },
            { id: "cover-letter", label: "Cover Letter", icon: <Mail className="w-3.5 h-3.5" /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-[#534AB7] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cover Letter tab */}
      {activeTab === "cover-letter" && (
        <CoverLetterSection
          cvText={cvText}
          jds={jds}
          defaultJobTitle={result.jd_title}
          defaultCompany={defaultCompany}
        />
      )}

      {/* Improve CV tab */}
      {activeTab === "improve" && (
        <CVRewriteSection
          cvText={cvText}
          weakPoints={result.weak_points}
          jdContext={jdContext}
        />
      )}

      {/* Results tab content */}
      {activeTab === "results" && <div className="space-y-6">

      {/* Score Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreCard
          label="Overall Match Score"
          score={result.match_score}
          suffix="Match"
          icon={<BarChart3 className="w-4 h-4 text-[#534AB7]" />}
        />
        <ScoreCard
          label="ATS Compatibility Score"
          score={result.ats_score}
          suffix="ATS"
          icon={<ShieldCheck className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Summary */}
      <div className="bg-[#534AB7]/5 dark:bg-[#534AB7]/10 border border-[#534AB7]/20 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#534AB7] mb-2">Summary</p>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{result.summary}</p>
      </div>

      {/* Per-JD Score Cards */}
      {result.per_jd_scores?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#534AB7]" />
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Per-JD Score Breakdown</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.per_jd_scores.map((jd, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                {/* Title + score badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{jd.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{jd.company}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${scoreBadgeCls(jd.score)}`}>
                    {jd.score}/100
                  </span>
                </div>
                {/* Mini score bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${scoreBarColor(jd.score)}`}
                    style={{ width: `${jd.score}%` }}
                  />
                </div>
                {/* Key match / gap */}
                <div className="space-y-1.5">
                  <div className="flex gap-2 items-start">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                      <span className="font-medium text-green-700 dark:text-green-400">Match: </span>{jd.key_match}
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                      <span className="font-medium text-red-600 dark:text-red-400">Gap: </span>{jd.key_gap}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong & Weak Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="font-semibold text-gray-800 dark:text-gray-100">Strong Points</p>
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
              {result.strong_points.length}
            </span>
          </div>
          <ul className="space-y-2">
            {result.strong_points.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                <span className="text-green-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="font-semibold text-gray-800 dark:text-gray-100">Areas to Improve</p>
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
              {result.weak_points.length}
            </span>
          </div>
          <ul className="space-y-2">
            {result.weak_points.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ATS Tips */}
      {result.ats_tips?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <p className="font-semibold text-gray-800 dark:text-gray-100">ATS Improvement Tips</p>
          </div>
          <ul className="space-y-2">
            {result.ats_tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keywords Tag Cloud */}
      {result.keywords?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#534AB7]" />
              <p className="font-semibold text-gray-800 dark:text-gray-100">Top JD Keywords</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {presentKeywords.length} present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                {missingKeywords.length} missing
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) =>
              kw.in_cv ? (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {kw.word}
                </span>
              ) : (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
                >
                  <XCircle className="w-3 h-3" />
                  {kw.word}
                </span>
              )
            )}
          </div>
        </div>
      )}

      </div>}
    </div>
  );
}
