"use client";

import { useState } from "react";
import { Wand2, Copy, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface RewriteSuggestion { weak_point: string; rewritten: string; }

interface CVRewriteSectionProps {
  cvText: string;
  weakPoints: string[];
  jdContext: string;
}

export default function CVRewriteSection({ cvText, weakPoints, jdContext }: CVRewriteSectionProps) {
  const [suggestions, setSuggestions] = useState<RewriteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    try {
      const res = await fetch("/api/rewrite-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, weakPoints, jdContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Improve Your CV</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI-generated rewrites for each weak point — copy and paste directly into your CV.
          </p>
        </div>
        {!hasSuggestions ? (
          <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Suggestions"}
          </button>
        ) : (
          <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Regenerate
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {weakPoints.map((_, i) => (
            <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 animate-pulse space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && !hasSuggestions && !error && (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center space-y-3">
          <Wand2 className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Click <span className="font-medium text-gray-700 dark:text-gray-200">&ldquo;Generate Suggestions&rdquo;</span> to get AI-powered rewrites for all {weakPoints.length} weak points.
          </p>
        </div>
      )}

      {hasSuggestions && !loading && (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const isOpen = expandedIndex === i;
            return (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{s.weak_point}</p>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Suggested rewrite</p>
                    <div className="bg-white dark:bg-gray-900 border border-[#534AB7]/20 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">• {s.rewritten}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => copy(s.rewritten, i)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                          copiedIndex === i
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
                            : "bg-[#534AB7] text-white hover:bg-[#4339a0]"
                        }`}
                      >
                        {copiedIndex === i ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
