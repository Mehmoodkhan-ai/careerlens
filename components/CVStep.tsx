"use client";

import { useState, useRef, useCallback, memo } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface CVStepProps {
  onComplete: (cvText: string) => void;
}

function CVStep({ onComplete }: CVStepProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (file: File) => {
    setError("");
    setLoading(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      if (!data.text?.trim()) throw new Error("No text extracted from file");
      onComplete(data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setFileName("");
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handlePasteSubmit = () => {
    if (pasteText.trim().length < 50) {
      setError("Please paste at least 50 characters of CV text.");
      return;
    }
    setError("");
    onComplete(pasteText.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Upload Your CV</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Supports PDF, DOCX, and TXT files — or paste your CV text directly.
        </p>
      </div>

      <div className="flex gap-2">
        {(["upload", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === m
                ? "bg-[#534AB7] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {m === "upload" ? "Upload File" : "Paste Text"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all select-none
            ${dragging
              ? "border-[#534AB7] bg-[#534AB7]/5"
              : "border-gray-200 dark:border-gray-700 hover:border-[#534AB7]/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }
            ${loading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileInput} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-[#534AB7] animate-spin" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">Parsing {fileName}…</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-gray-700 dark:text-gray-200 font-medium">{fileName}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Click to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">Drop your CV here or click to browse</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">PDF, DOCX, TXT — max 10 MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your CV text here…"
            rows={14}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#534AB7]/40 focus:border-[#534AB7]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">{pasteText.length} characters</span>
            <button
              onClick={handlePasteSubmit}
              className="px-6 py-2 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0] transition-colors"
            >
              <FileText className="inline w-4 h-4 mr-1.5 -mt-0.5" />
              Use This CV
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
export default memo(CVStep);
