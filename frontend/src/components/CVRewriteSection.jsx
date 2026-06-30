import { useState } from "react";
import { rewriteCV } from "../lib/api.js";

export default function CVRewriteSection({ cvText, weakPoints, jdContext }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openIdx, setOpenIdx] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const { suggestions: s } = await rewriteCV({ cvText, weakPoints, jdContext });
      setSuggestions(s || []);
    } catch {
      setError("Failed to generate suggestions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          CV Rewrite Suggestions
        </h3>
        <button onClick={generate} disabled={loading}
          className="px-5 py-2 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? (
            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading...</>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Generate Rewrites
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-10 bg-[#FAFAFA] rounded-2xl border border-[#E5E7EB]">
          <div className="w-12 h-12 rounded-2xl bg-[#E8E6FB] flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D2A6E" strokeWidth="1.8">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-[#6B7280]">Click Generate to get AI-powered rewrite suggestions.</p>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden hover:border-[#7C78C8] transition-colors">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-50 border border-red-100 text-red-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#374151] font-medium leading-snug">{s.weak_point}</p>
              </div>
              <span className="text-[#9CA3AF] text-lg ml-2 shrink-0">{openIdx === i ? "−" : "+"}</span>
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4">
                <div className="p-4 rounded-xl bg-[#F0FDF9] border border-[#BBF7E0]">
                  <p className="text-xs font-semibold text-[#047857] mb-2">Suggested Rewrite</p>
                  <p className="text-sm text-[#065F46] leading-relaxed">{s.rewritten}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
