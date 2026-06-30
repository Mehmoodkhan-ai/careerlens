import { useState, memo } from "react";

const MIN_JDS = 5;
const MAX_JDS = 10;

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7]/40 focus:border-[#534AB7]";

function JDStep({ jds, onJDsChange, onComplete }) {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ title: "", company: "", text: "" });

  const atMax = jds.length >= MAX_JDS;
  const canAnalyze = jds.length >= MIN_JDS;

  const fetchJDs = async () => {
    if (!role.trim()) { setError("Please enter a role."); return; }
    if (atMax) { setError(`Maximum ${MAX_JDS} JDs reached.`); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/fetch-jds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim(), location: location.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch JDs");
      const incoming = data.jds ?? [];
      if (!incoming.length) throw new Error("No jobs found for this role.");
      // merge, deduplicate, cap at MAX
      const merged = [...jds];
      for (const jd of incoming) {
        if (merged.length >= MAX_JDS) break;
        if (!merged.some((j) => j.title === jd.title && j.company === jd.company)) {
          merged.push(jd);
        }
      }
      onJDsChange(merged);
    } catch (e) {
      setError(e.message || "Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  };

  const addManual = () => {
    if (!manual.title.trim()) { setError("Please enter a job title."); return; }
    if (manual.text.trim().length < 30) { setError("Please enter at least 30 characters of description."); return; }
    onJDsChange([...jds, { title: manual.title.trim(), company: manual.company.trim() || "Not specified", text: manual.text.trim(), source: "manual" }]);
    setManual({ title: "", company: "", text: "" });
    setManualMode(false);
    setError("");
  };

  const removeJD = (idx) => {
    const next = jds.filter((_, i) => i !== idx);
    onJDsChange(next);
    if (expanded === idx) setExpanded(null);
    else if (expanded !== null && expanded > idx) setExpanded(expanded - 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Job Descriptions
        </h2>
        <p className="text-gray-500 text-sm">
          Fetch live JDs or paste your own. Add between {MIN_JDS} and {MAX_JDS}.
        </p>
      </div>

      {/* Fetch Panel */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fetch Live Jobs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role / Title</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchJDs()}
              placeholder="e.g. Senior React Developer"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchJDs()}
              placeholder="e.g. London, UK"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchJDs}
            disabled={loading || atMax || !role.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-[#2D2A6E] text-white rounded-full text-sm font-medium hover:bg-[#3D3A9E] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Fetching…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                Fetch Live JDs
              </>
            )}
          </button>

          {!atMax && (
            <button
              onClick={() => { setManualMode(!manualMode); setError(""); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add Manually
            </button>
          )}

          {atMax && (
            <p className="self-center text-xs text-amber-600 font-medium">Maximum {MAX_JDS} JDs reached</p>
          )}
        </div>
      </div>

      {/* Manual Entry */}
      {manualMode && (
        <div className="bg-white border border-[#534AB7]/20 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Add a Job Description</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Job Title <span className="text-red-400">*</span></label>
              <input value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })}
                placeholder="e.g. Full Stack Developer" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
              <input value={manual.company} onChange={(e) => setManual({ ...manual, company: e.target.value })}
                placeholder="e.g. Acme Corp" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description <span className="text-red-400">*</span></label>
            <textarea value={manual.text} onChange={(e) => setManual({ ...manual, text: e.target.value })}
              placeholder="Paste the full job description…" rows={7} className={`${inputCls} resize-none`} />
            <p className="text-xs text-gray-400 mt-1">{manual.text.length} characters</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setManualMode(false); setManual({ title: "", company: "", text: "" }); setError(""); }}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={addManual}
              className="px-5 py-1.5 bg-[#2D2A6E] text-white rounded-full text-sm font-medium hover:bg-[#3D3A9E]">Add JD</button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* JD List */}
      {jds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{jds.length}/{MAX_JDS} JDs added</p>
            {canAnalyze && (
              <span className="text-xs text-[#534AB7] bg-[#534AB7]/10 rounded-full px-2.5 py-0.5 font-medium">
                All {jds.length} will be analyzed
              </span>
            )}
          </div>
          {!canAnalyze && (
            <p className="text-xs text-amber-600 font-medium">
              Add at least {MIN_JDS} JDs to analyze — {MIN_JDS - jds.length} more needed
            </p>
          )}

          {jds.map((jd, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Row header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-[#E8E6FB] rounded-lg flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">{jd.title}</p>
                      {jd.source === "live" && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Live</span>
                      )}
                      {jd.source === "ai" && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">AI</span>
                      )}
                      {jd.platform && jd.source === "live" && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{jd.platform}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {jd.company}{jd.location ? ` · ${jd.location}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {jd.applyLink && (
                    <a href={jd.applyLink} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#534AB7] border border-[#534AB7]/30 rounded-lg hover:bg-[#534AB7]/10 transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      View Job
                    </a>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); removeJD(i); }}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    {expanded === i
                      ? <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      : <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                </div>
              </div>

              {/* Expanded description */}
              {expanded === i && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{jd.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analyze button */}
      {jds.length > 0 && (
        <button
          onClick={onComplete}
          disabled={!canAnalyze}
          className="w-full py-3.5 bg-[#2D2A6E] text-white rounded-full font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {canAnalyze
            ? `Analyze CV Against ${jds.length} JD${jds.length !== 1 ? "s" : ""} →`
            : `Add ${MIN_JDS - jds.length} more JD${MIN_JDS - jds.length !== 1 ? "s" : ""} to analyze`}
        </button>
      )}
    </div>
  );
}

export default memo(JDStep);
