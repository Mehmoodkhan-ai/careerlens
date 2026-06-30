import { useState, useEffect } from "react";
import { generateAnalysisPDF } from "../lib/generateAnalysisPDF.js";

const HISTORY_KEY = "cv-analyzer-history";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPanel({ open, onClose }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (open) {
      try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")); } catch { setHistory([]); }
    }
  }, [open]);

  const clear = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  if (!open) return null;

  const scoreColor = (s) => s >= 75 ? "text-[#2DD4A7]" : s >= 50 ? "text-[#FF8A5B]" : "text-red-400";
  const scoreBg = (s) => s >= 75 ? "bg-[#F0FDF9] border-[#BBF7E0]" : s >= 50 ? "bg-[#FFF5F0] border-[#FFD5C0]" : "bg-red-50 border-red-100";

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col border-l border-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]"
          style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5F4FF 100%)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E8E6FB] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="2">
                <path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Analysis History
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button onClick={clear} className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F5F4FF] text-[#9CA3AF] hover:text-[#2D2A6E] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#E8E6FB] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="1.8">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a1 1 0 0 0 1 1h1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[#374151] font-medium text-sm">No history yet</p>
              <p className="text-[#9CA3AF] text-xs mt-1">Your analyses will appear here</p>
            </div>
          ) : (
            history.map((h) => (
              <button key={h.id} onClick={() => setSelected(h)}
                className="w-full text-left p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#7C78C8] hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl border ${scoreBg(h.score)} flex flex-col items-center justify-center shrink-0`}>
                    <span className={`text-lg font-bold ${scoreColor(h.score)}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{h.score}</span>
                    <span className="text-[10px] text-[#9CA3AF]">/ 100</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111827] truncate">{h.jd_title}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{h.jd_count} JDs · ATS {h.ats_score}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatDate(h.date)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-[#E5E7EB]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]"
              style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5F4FF 100%)" }}>
              <h4 className="font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{selected.jd_title}</h4>
              <button onClick={() => setSelected(null)}
                className="p-1.5 rounded-full hover:bg-[#E8E6FB] text-[#9CA3AF] hover:text-[#2D2A6E] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4 bg-[#FAFAFA]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-center">
                  <p className={`text-2xl font-bold ${selected.score >= 75 ? "text-[#2DD4A7]" : selected.score >= 50 ? "text-[#FF8A5B]" : "text-red-400"}`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{selected.score}</p>
                  <p className="text-xs text-[#9CA3AF]">Match</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-center">
                  <p className={`text-2xl font-bold ${selected.ats_score >= 75 ? "text-[#2DD4A7]" : selected.ats_score >= 50 ? "text-[#FF8A5B]" : "text-red-400"}`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{selected.ats_score}</p>
                  <p className="text-xs text-[#9CA3AF]">ATS</p>
                </div>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed">{selected.summary}</p>
              {selected.full_analysis && (
                <button onClick={() => generateAnalysisPDF(selected.full_analysis)}
                  className="w-full py-3 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors flex items-center justify-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download Full PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
