import { useState, useEffect, useRef } from "react";
import { analyzeCV } from "../lib/api.js";
import { generateAnalysisPDF } from "../lib/generateAnalysisPDF.js";
import CoverLetterSection from "./CoverLetterSection.jsx";
import CVRewriteSection from "./CVRewriteSection.jsx";

function ScoreCard({ label, score }) {
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    let start = 0;
    const step = () => {
      start += 2;
      if (start >= score) { setDisplayed(score); return; }
      setDisplayed(start);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [score]);

  const scoreColor = score >= 75 ? "#2DD4A7" : score >= 50 ? "#FF8A5B" : "#EF4444";
  const barColor = score >= 75 ? "bg-[#2DD4A7]" : score >= 50 ? "bg-[#FF8A5B]" : "bg-red-400";
  const textColor = score >= 75 ? "text-[#2DD4A7]" : score >= 50 ? "text-[#FF8A5B]" : "text-red-400";

  return (
    <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB]">
      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">{label}</p>
      <div className={`text-3xl font-bold ${textColor} mb-3`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {displayed}<span className="text-lg text-[#D1D5DB]">/100</span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#F5F4FF]">
        <div className={`h-2 rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AnalysisStep({ cvText, jds, onReset }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("results");
  const [analyzed, setAnalyzed] = useState(false);

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const { analysis } = await analyzeCV(cvText, jds);
      setResult(analysis);
      setAnalyzed(true);

      const entry = {
        id: Math.random().toString(36).slice(2) + Date.now(),
        date: new Date().toISOString(),
        score: analysis.match_score,
        ats_score: analysis.ats_score,
        jd_count: jds.length,
        jd_title: analysis.jd_title,
        summary: analysis.summary,
        full_analysis: analysis,
      };
      try {
        const history = JSON.parse(localStorage.getItem("cv-analyzer-history") || "[]");
        if (!history.some((e) => e.id === entry.id)) {
          history.unshift(entry);
          localStorage.setItem("cv-analyzer-history", JSON.stringify(history.slice(0, 20)));
        }
      } catch {}
    } catch {
      setError("Analysis failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!analyzed) run(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="w-16 h-16 border-4 border-[#2D2A6E] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#374151] font-medium">Analyzing your CV against {jds.length} job descriptions...</p>
      <p className="text-sm text-[#9CA3AF]">This may take 10–20 seconds</p>
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#111827] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Analysis Failed</h3>
      <p className="text-[#6B7280] mb-6 text-sm">{error}</p>
      <button onClick={run} className="px-7 py-3 rounded-full bg-[#2D2A6E] text-white font-semibold hover:bg-[#3D3A9E] transition-colors">
        Try Again
      </button>
    </div>
  );

  if (!result) return null;

  const tabs = ["results", "improve", "cover-letter"];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-full bg-[#F5F4FF] mb-6 border border-[#E8E6FB]">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all capitalize ${
              tab === t
                ? "bg-white text-[#2D2A6E] shadow-sm border border-[#E8E6FB]"
                : "text-[#6B7280] hover:text-[#2D2A6E]"
            }`}>
            {t === "cover-letter" ? "Cover Letter" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "results" && (
        <div className="space-y-5">
          {/* Score cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ScoreCard label="Match Score" score={result.match_score} />
            <ScoreCard label="ATS Score" score={result.ats_score} />
          </div>

          {/* Summary */}
          <div className="p-5 rounded-2xl bg-[#F5F4FF] border border-[#E8E6FB]">
            <p className="text-xs font-semibold text-[#7C78C8] uppercase tracking-wide mb-2">AI Summary</p>
            <p className="text-sm text-[#374151] leading-relaxed">{result.summary}</p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Best match: <strong className="text-[#2D2A6E]">{result.jd_title}</strong>
            </p>
          </div>

          {/* Strong & Weak */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F0FDF9] border border-[#BBF7E0]">
              <p className="text-xs font-semibold text-[#047857] uppercase tracking-wide mb-3">Strong Points</p>
              <ul className="space-y-1.5">
                {result.strong_points?.slice(0, 5).map((p, i) => (
                  <li key={i} className="text-xs text-[#065F46] flex gap-2">
                    <span className="text-[#2DD4A7] shrink-0 font-bold">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Areas to Improve</p>
              <ul className="space-y-1.5">
                {result.weak_points?.slice(0, 5).map((p, i) => (
                  <li key={i} className="text-xs text-red-700 flex gap-2">
                    <span className="text-red-400 shrink-0">✗</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ATS Tips */}
          {result.ats_tips?.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#FFF5F0] border border-[#FFD5C0]">
              <p className="text-xs font-semibold text-[#C04B1F] uppercase tracking-wide mb-3">ATS Tips</p>
              <ul className="space-y-2">
                {result.ats_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-[#7C2D12] flex gap-2">
                    <span className="shrink-0 font-semibold text-[#FF8A5B]">{i + 1}.</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords */}
          {result.keywords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((k, i) => (
                  <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    k.in_cv
                      ? "bg-[#F0FDF9] text-[#047857] border border-[#BBF7E0]"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {k.in_cv ? "✓ " : "✗ "}{k.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-JD */}
          {result.per_jd_scores?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Per-JD Scores</p>
              <div className="space-y-2">
                {result.per_jd_scores.map((jd, i) => {
                  const color = jd.score >= 75 ? "text-[#2DD4A7]" : jd.score >= 50 ? "text-[#FF8A5B]" : "text-red-400";
                  return (
                    <div key={i} className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center gap-3 hover:border-[#7C78C8] transition-colors">
                      <span className={`text-lg font-bold w-14 shrink-0 ${color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {jd.score}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{jd.title} @ {jd.company}</p>
                        <p className="text-xs text-[#9CA3AF] truncate">Match: {jd.key_match} · Gap: {jd.key_gap}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap pt-2">
            <button onClick={() => generateAnalysisPDF(result)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download PDF
            </button>
            <button onClick={onReset}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:border-[#7C78C8] hover:text-[#2D2A6E] transition-all bg-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Start Over
            </button>
          </div>
        </div>
      )}

      {tab === "improve" && (
        <CVRewriteSection cvText={cvText} weakPoints={result.weak_points || []} jdContext={result.jd_title} />
      )}

      {tab === "cover-letter" && (
        <CoverLetterSection cvText={cvText} jdTitle={result.jd_title} jdText={jds[0]?.text} />
      )}
    </div>
  );
}
