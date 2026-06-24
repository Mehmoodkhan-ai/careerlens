"use client";

import { useEffect, useState } from "react";
import {
  X, Trash2, BarChart3, Clock, Briefcase, ChevronRight,
  CheckCircle2, XCircle, ShieldCheck, Tag, TrendingUp, TrendingDown,
  FileText, Loader2, ArrowLeft,
} from "lucide-react";
import { loadHistory, clearHistory, type HistoryEntry } from "@/lib/storage";
import { generateAnalysisPDF } from "@/lib/generateAnalysisPDF";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function scoreColor(s: number) {
  if (s >= 75) return "text-green-600 dark:text-green-400";
  if (s >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

function scoreBg(s: number) {
  if (s >= 75) return "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
  if (s >= 50) return "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
  return "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
}

function scoreBarColor(s: number) {
  if (s >= 75) return "bg-green-500";
  if (s >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setEntries(loadHistory());
  }, [isOpen]);

  // Close detail view when panel closes
  useEffect(() => {
    if (!isOpen) setSelectedEntry(null);
  }, [isOpen]);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
    setSelectedEntry(null);
  };

  const handleDownloadPDF = async () => {
    if (!selectedEntry?.full_analysis) return;
    setPdfLoading(true);
    try {
      await generateAnalysisPDF(selectedEntry.full_analysis);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  const analysis = selectedEntry?.full_analysis;
  const presentKeywords = analysis?.keywords?.filter((k) => k.in_cv) ?? [];
  const missingKeywords = analysis?.keywords?.filter((k) => !k.in_cv) ?? [];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
          onClick={selectedEntry ? undefined : onClose}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#534AB7]" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Analysis History</h2>
            {entries.length > 0 && !selectedEntry && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5">
                {entries.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <BarChart3 className="w-10 h-10 text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No analyses yet. Complete your first CV analysis to see history here.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="w-full text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2.5 hover:border-[#534AB7]/40 hover:bg-[#534AB7]/5 dark:hover:bg-[#534AB7]/10 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(entry.date)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3 h-3 text-[#534AB7] shrink-0" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {entry.jd_title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`shrink-0 text-center px-2.5 py-1 rounded-lg border text-xs font-bold ${scoreBg(entry.score)}`}>
                      <p className={scoreColor(entry.score)}>{entry.score}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-[10px] leading-none">/100</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-[#534AB7] transition-colors shrink-0" />
                  </div>
                </div>

                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="font-medium">ATS:</span>
                    <span className={scoreColor(entry.ats_score)}>{entry.ats_score}/100</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {entry.jd_count} JD{entry.jd_count !== 1 ? "s" : ""}
                  </span>
                </div>

                {entry.summary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {entry.summary}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && !selectedEntry && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 w-full justify-center text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all history
            </button>
          </div>
        )}
      </div>

      {/* Detail modal — full screen on mobile, centered on desktop */}
      {selectedEntry && isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] overflow-y-auto">
          <div className="flex min-h-full sm:items-start sm:justify-center sm:py-8 sm:px-4">
          <div className="relative flex flex-col bg-white dark:bg-gray-900 w-full sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl">

            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-[#534AB7] shrink-0" />
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 truncate">{selectedEntry.jd_title}</h2>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(selectedEntry.date)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedEntry.full_analysis && (
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#534AB7] text-white rounded-full text-xs font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-60"
                  >
                    {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    {pdfLoading ? "Generating…" : "Download PDF"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-6 overflow-y-auto">
              {!analysis ? (
                <div className="py-10 text-center">
                  <BarChart3 className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Full analysis data is not available for this entry. Only newer analyses are saved with complete data.
                  </p>
                </div>
              ) : (
                <>
                  {/* Score cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl border p-4 ${scoreBg(analysis.match_score)}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <BarChart3 className="w-3.5 h-3.5 text-[#534AB7]" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Match Score</p>
                      </div>
                      <p className={`text-3xl font-bold ${scoreColor(analysis.match_score)}`}>
                        {analysis.match_score}<span className="text-base font-normal">/100</span>
                      </p>
                      <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBarColor(analysis.match_score)}`} style={{ width: `${analysis.match_score}%` }} />
                      </div>
                    </div>
                    <div className={`rounded-xl border p-4 ${scoreBg(analysis.ats_score)}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">ATS Score</p>
                      </div>
                      <p className={`text-3xl font-bold ${scoreColor(analysis.ats_score)}`}>
                        {analysis.ats_score}<span className="text-base font-normal">/100</span>
                      </p>
                      <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBarColor(analysis.ats_score)}`} style={{ width: `${analysis.ats_score}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-[#534AB7]/5 dark:bg-[#534AB7]/10 border border-[#534AB7]/20 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#534AB7] mb-2">Summary</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.summary}</p>
                  </div>

                  {/* Per-JD breakdown */}
                  {analysis.per_jd_scores?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Per-JD Breakdown</p>
                      <div className="space-y-2">
                        {analysis.per_jd_scores.map((jd, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{jd.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{jd.company}</p>
                              </div>
                              <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full border ${scoreBg(jd.score)} ${scoreColor(jd.score)}`}>
                                {jd.score}/100
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBarColor(jd.score)}`} style={{ width: `${jd.score}%` }} />
                            </div>
                            <div className="space-y-1">
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

                  {/* Strong & Weak points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Strong Points <span className="ml-1 text-gray-300 dark:text-gray-600">({analysis.strong_points.length})</span>
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {analysis.strong_points.map((point, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-200">
                            <span className="text-green-500 font-bold shrink-0">{i + 1}.</span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Weak Points <span className="ml-1 text-gray-300 dark:text-gray-600">({analysis.weak_points.length})</span>
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {analysis.weak_points.map((point, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-200">
                            <span className="text-red-400 font-bold shrink-0">{i + 1}.</span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* ATS tips */}
                  {analysis.ats_tips?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">ATS Tips</p>
                      </div>
                      <ul className="space-y-1.5">
                        {analysis.ats_tips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-200">
                            <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Keywords */}
                  {analysis.keywords?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-[#534AB7]" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Keywords</p>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
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
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.keywords.map((kw, i) =>
                          kw.in_cv ? (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-3 h-3" />{kw.word}
                            </span>
                          ) : (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                              <XCircle className="w-3 h-3" />{kw.word}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
