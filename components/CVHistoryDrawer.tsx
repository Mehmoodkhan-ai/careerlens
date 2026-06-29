"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, X, Trash2, Download, Pencil, Loader2 } from "lucide-react";
import {
  type CVHistoryEntry,
  loadHistory,
  deleteFromHistory,
  clearHistory,
  formatHistoryDate,
} from "@/lib/cvHistory";
import type { CVPDFData } from "@/lib/generateCVPDF";

const TEMPLATE_NAMES: Record<string, string> = {
  "classic": "Classic",
  "modern-purple": "Modern Purple",
  "executive": "Executive",
  "minimal-dark": "Minimal Dark",
  "creative-tech": "Creative Tech",
};

const splitCSV = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
const splitLines = (s: string) => s.split("\n").map(x => x.trim()).filter(Boolean);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, called in-place (CV Maker page). If omitted, navigates to /cv-maker via sessionStorage prefill. */
  onEditAndRegenerate?: (entry: CVHistoryEntry) => void;
}

export default function CVHistoryDrawer({ isOpen, onClose, onEditAndRegenerate }: Props) {
  const router = useRouter();
  const [history, setHistory] = useState<CVHistoryEntry[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setHistory(loadHistory());
  }, [isOpen]);

  const handleDownload = async (entry: CVHistoryEntry) => {
    setDownloadingId(entry.id);
    try {
      const payload: CVPDFData = {
        personalInfo: entry.formData.personal,
        summary: entry.formData.summary,
        skills: entry.formData.skills
          .map(sk => ({ category: sk.category, items: splitCSV(sk.items) }))
          .filter(sk => sk.items.length > 0),
        experience: entry.formData.experiences.map(e => ({
          title: e.title, company: e.company, duration: e.duration, bullets: splitLines(e.bullets),
        })),
        projects: entry.formData.projects
          .filter(p => p.name.trim())
          .map(p => ({ name: p.name, liveLink: p.liveLink, description: p.description, techStack: p.techStack })),
        education: entry.formData.educations
          .filter(e => e.degree.trim())
          .map(e => ({ degree: e.degree, institution: e.institution, dates: e.dates })),
        certificates: entry.formData.certificates
          .filter(c => c.issuer.trim() || c.names.trim())
          .map(c => ({ issuer: c.issuer, date: c.date, names: splitLines(c.names) })),
      };
      const { generateCVPDF } = await import("@/lib/generateCVPDF");
      await generateCVPDF(payload, entry.template, entry.pageMode);
    } catch (err) {
      console.error("CV download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEdit = (entry: CVHistoryEntry) => {
    if (onEditAndRegenerate) {
      onEditAndRegenerate(entry);
    } else {
      sessionStorage.setItem("cv_prefill_id", entry.id);
      onClose();
      router.push("/cv-maker");
    }
  };

  const handleDelete = (id: string) => { setHistory(deleteFromHistory(id)); };

  const handleClearAll = () => { clearHistory(); setHistory([]); };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#534AB7]" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              CV History
              {history.length > 0 && (
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({history.length})</span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
              <Clock className="w-8 h-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-400">No CVs generated yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600">
                Generated CVs will appear here
              </p>
            </div>
          ) : (
            history.map(entry => {
              const isDownloading = downloadingId === entry.id;
              return (
                <div key={entry.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 bg-gray-50/50 dark:bg-gray-800/30">

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {entry.name || "Untitled"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {TEMPLATE_NAMES[entry.template] ?? entry.template}
                        {" · "}
                        {entry.pageMode === "1-page" ? "1 Page" : "2 Pages"}
                      </p>
                      <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">
                        {formatHistoryDate(entry.timestamp)}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(entry)}
                      disabled={downloadingId !== null}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:border-[#534AB7] hover:text-[#534AB7] dark:hover:text-[#8B85E8] dark:hover:border-[#8B85E8] disabled:opacity-50 transition-colors">
                      {isDownloading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
                        : <><Download className="w-3.5 h-3.5" />Download</>}
                    </button>
                    <button
                      onClick={() => handleEdit(entry)}
                      disabled={downloadingId !== null}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#534AB7] text-white rounded-lg hover:bg-[#4840A0] disabled:opacity-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit &amp; Regen
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
