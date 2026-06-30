import { useState, useRef } from "react";
import { parseCV } from "../lib/api.js";

export default function CVStep({ cvText, onCVReady }) {
  const [mode, setMode] = useState("upload");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState(cvText || "");
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = [".pdf", ".docx", ".txt"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { text } = await parseCV(file);
      setText(text);
      onCVReady(text);
    } catch {
      setError("Failed to parse file. Please try again or paste text.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#2D2A6E] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Upload Your CV
      </h2>
      <p className="text-[#6B7280] mb-6 text-sm">Upload a file or paste your CV text below.</p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        {["upload", "paste"].map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              mode === m
                ? "bg-[#2D2A6E] text-white shadow-sm"
                : "bg-[#F5F4FF] text-[#6B7280] hover:bg-[#E8E6FB] hover:text-[#2D2A6E]"
            }`}>
            {m === "upload" ? "Upload File" : "Paste Text"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? "border-[#2DD4A7] bg-[#F0FDF9]"
              : "border-[#E5E7EB] hover:border-[#7C78C8] hover:bg-[#F5F4FF]"
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#2D2A6E] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#6B7280] text-sm">Parsing your CV...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#E8E6FB] flex items-center justify-center mx-auto mb-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-semibold text-[#111827] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Drop your CV here
              </p>
              <p className="text-sm text-[#9CA3AF]">PDF, DOCX, or TXT — max 10MB</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your full CV text here..."
          rows={14}
          className="w-full rounded-2xl border border-[#E5E7EB] bg-white text-[#374151] p-4 text-sm resize-none focus:outline-none focus:border-[#7C78C8] focus:ring-2 focus:ring-[#7C78C8]/20 transition-colors"
        />
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {text && !loading && (
        <div className="mt-4 p-3 rounded-xl bg-[#F0FDF9] border border-[#BBF7E0] flex items-center gap-2 text-[#047857] text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          CV loaded — {text.length.toLocaleString()} characters
        </div>
      )}

      <button
        disabled={!text.trim() || loading}
        onClick={() => onCVReady(text)}
        className="mt-6 w-full py-3.5 rounded-full bg-[#2D2A6E] text-white font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Continue
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
