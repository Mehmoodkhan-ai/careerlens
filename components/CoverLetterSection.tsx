"use client";

import { useState } from "react";
import { Mail, Loader2, AlertCircle, Copy, Check, Download, RotateCcw, FileText } from "lucide-react";
import { JobDescription } from "./JDStep";

interface CoverLetterSectionProps {
  cvText: string;
  jds: JobDescription[];
  defaultJobTitle: string;
  defaultCompany: string;
}

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#534AB7]/40 focus:border-[#534AB7]";

export default function CoverLetterSection({ cvText, jds, defaultJobTitle, defaultCompany }: CoverLetterSectionProps) {
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [company, setCompany] = useState(defaultCompany);
  const [selectedJDIndex, setSelectedJDIndex] = useState<number | null>(
    (() => {
      const idx = jds.findIndex((j) => j.title === defaultJobTitle && j.company === defaultCompany);
      return idx >= 0 ? idx : jds.length > 0 ? 0 : null;
    })()
  );
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const selectedJD = selectedJDIndex !== null ? jds[selectedJDIndex] : null;

  const handleJDSelect = (idx: number) => {
    setSelectedJDIndex(idx);
    setJobTitle(jds[idx].title);
    setCompany(jds[idx].company);
  };

  const generate = async () => {
    if (!candidateName.trim()) { setError("Please enter your name."); return; }
    if (!jobTitle.trim() || !company.trim()) { setError("Please enter a job title and company name."); return; }
    setError("");
    setLoading(true);
    setLetter("");
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName: candidateName.trim(), jobTitle: jobTitle.trim(), company: company.trim(), cvText, jdText: selectedJD?.text ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setLetter(data.letter ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(letter); }
    catch {
      const el = document.createElement("textarea");
      el.value = letter;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const header = `Cover Letter — ${jobTitle} at ${company}\nCandidate: ${candidateName}\n${"─".repeat(60)}\n\n`;
    const blob = new Blob([header + letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${company.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;

      const purple: [number, number, number] = [83, 74, 183];
      const white: [number, number, number] = [255, 255, 255];
      const gray800: [number, number, number] = [31, 41, 55];
      const gray500: [number, number, number] = [107, 114, 128];

      // Header bar
      doc.setFillColor(...purple);
      doc.rect(0, 0, pageW, 48, "F");

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...white);
      doc.text("Cover Letter", margin, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(210, 207, 255);
      if (candidateName) doc.text(candidateName, margin, 29);
      doc.text(
        new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        margin, 37
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(210, 207, 255);
      doc.text(`${jobTitle}`, pageW - margin, 24, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(company, pageW - margin, 32, { align: "right" });

      // Letter body
      let y = 62;
      const paragraphs = letter.split("\n\n").filter((p) => p.trim());
      for (const para of paragraphs) {
        const lines = doc.splitTextToSize(para.trim(), contentW) as string[];
        const blockH = lines.length * 6.5;
        if (y + blockH > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray800);
        doc.text(lines, margin, y);
        y += blockH + 7;
      }

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(...gray500);
        doc.text("Generated by CareerLens", margin, pageH - 10);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 10, { align: "right" });
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
      }

      doc.save(`cover-letter-${company.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (e) {
      console.error("Cover letter PDF error:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Cover Letter Generator</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate a tailored cover letter based on your CV and the selected job description.</p>
      </div>

      {/* JD Selector */}
      {jds.length > 1 && (
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Target job description</p>
          <div className="flex flex-wrap gap-2">
            {jds.map((jd, i) => (
              <button
                key={i}
                onClick={() => handleJDSelect(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  selectedJDIndex === i
                    ? "bg-[#534AB7] text-white border-[#534AB7]"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#534AB7]/40"
                }`}
              >
                {jd.title} · {jd.company}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Your Name <span className="text-red-400">*</span></label>
          <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="e.g. Jane Smith" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Job Title <span className="text-red-400">*</span></label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Company <span className="text-red-400">*</span></label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" className={inputCls} />
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {loading ? "Generating…" : letter ? "Regenerate" : "Generate Cover Letter"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#534AB7] animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Writing your cover letter…</p>
        </div>
      )}

      {letter && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Cover Letter — {jobTitle} at {company}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copy}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  copied
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
                    : "bg-[#534AB7] text-white hover:bg-[#4339a0]"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#534AB7] text-white rounded-full text-xs font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-60"
              >
                {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                {pdfLoading ? "Generating…" : "Download PDF"}
              </button>
              <button onClick={download} className="flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Download TXT
              </button>
              <button onClick={() => setLetter("")} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Clear">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
            {letter.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
