import { useState } from "react";
import { generateCoverLetter } from "../lib/api.js";

export default function CoverLetterSection({ cvText, jdTitle, jdText }) {
  const cacheKey = `cl_${jdTitle}`;
  const [form, setForm] = useState({
    candidateName: "",
    jobTitle: jdTitle || "",
    company: "",
  });
  const [letter, setLetter] = useState(() => {
    try { return localStorage.getItem(cacheKey) || ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!form.candidateName || !form.jobTitle || !form.company) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { letter: l } = await generateCoverLetter({ ...form, cvText, jdText });
      setLetter(l);
      try { localStorage.setItem(cacheKey, l); } catch {}
    } catch {
      setError("Failed to generate cover letter. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${form.company.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const lines = doc.splitTextToSize(letter, 180);
    doc.setFontSize(11);
    doc.text(lines, 15, 20);
    doc.save(`cover-letter-${form.company.replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Generate Cover Letter
      </h3>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { key: "candidateName", label: "Your Name", placeholder: "Jane Doe" },
          { key: "jobTitle", label: "Job Title", placeholder: "Frontend Developer" },
          { key: "company", label: "Company", placeholder: "Acme Corp" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-sm focus:outline-none focus:border-[#7C78C8] focus:ring-2 focus:ring-[#7C78C8]/20 transition-colors"
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      <button onClick={generate} disabled={loading}
        className="w-full py-3 rounded-full bg-[#2D2A6E] text-white font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Generate Cover Letter
          </>
        )}
      </button>

      {letter && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#374151]">Your Cover Letter</span>
            <div className="flex gap-2">
              <button onClick={copy}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F5F4FF] text-[#2D2A6E] border border-[#E8E6FB] hover:bg-[#E8E6FB] transition-colors">
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={downloadTxt}
                className="text-xs px-3 py-1.5 rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#7C78C8] hover:text-[#2D2A6E] transition-colors">
                .txt
              </button>
              <button onClick={downloadPdf}
                className="text-xs px-3 py-1.5 rounded-full bg-[#2D2A6E] text-white hover:bg-[#3D3A9E] transition-colors">
                PDF
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-[#374151] p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] max-h-80 overflow-y-auto font-sans leading-relaxed">
            {letter}
          </pre>
        </div>
      )}
    </div>
  );
}
