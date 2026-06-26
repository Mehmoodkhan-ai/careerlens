"use client";

import { useState, memo } from "react";
import { Search, Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle, Briefcase } from "lucide-react";

export interface JobDescription {
  title: string;
  company: string;
  text: string;
  source?: "live" | "ai";
  platform?: string;
  location?: string;
}

interface JDStepProps {
  jds: JobDescription[];
  onJDsChange: (jds: JobDescription[]) => void;
  onComplete: () => void;
}

interface ManualForm { title: string; company: string; text: string; }
const emptyManual = (): ManualForm => ({ title: "", company: "", text: "" });

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#534AB7]/40 focus:border-[#534AB7]";

const MIN_JDS = 5;
const MAX_JDS = 10;

function JDStep({ jds, onJDsChange, onComplete }: JDStepProps) {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState<ManualForm>(emptyManual());

  const atMax = jds.length >= MAX_JDS;
  const canAnalyze = jds.length >= MIN_JDS;

  const fetchJDs = async () => {
    if (!role.trim() || !location.trim()) { setError("Please enter both role and location."); return; }
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
      const incoming = data.jds as JobDescription[];
      onJDsChange([...jds, ...incoming].slice(0, MAX_JDS));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addManual = () => {
    if (!manual.title.trim()) { setError("Please enter a job title."); return; }
    if (manual.text.trim().length < 30) { setError("Please enter at least 30 characters of description."); return; }
    onJDsChange([...jds, { title: manual.title.trim(), company: manual.company.trim() || "Not specified", text: manual.text.trim() }]);
    setManual(emptyManual());
    setManualMode(false);
    setError("");
  };

  const removeJD = (index: number) => {
    onJDsChange(jds.filter((_, i) => i !== index));
    if (expanded === index) setExpanded(null);
    else if (expanded !== null && expanded > index) setExpanded(expanded - 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Job Descriptions</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Generate JDs with AI or paste your own. Add between 5 and 10.</p>
      </div>

      {/* AI Fetch Panel */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Generate with AI</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role / Title</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" className={inputCls} onKeyDown={(e) => e.key === "Enter" && fetchJDs()} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchJDs} disabled={loading || atMax} className="flex items-center gap-2 px-5 py-2 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Fetching…" : "Fetch Live JDs"}
          </button>
          {!atMax && (
            <button onClick={() => { setManualMode(!manualMode); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add Manually
            </button>
          )}
          {atMax && (
            <p className="self-center text-xs text-amber-600 dark:text-amber-400 font-medium">Maximum {MAX_JDS} JDs reached</p>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      {manualMode && (
        <div className="bg-white dark:bg-gray-900 border border-[#534AB7]/20 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Add a Job Description</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Job Title <span className="text-red-400">*</span></label>
              <input value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} placeholder="e.g. Full Stack Developer" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Company</label>
              <input value={manual.company} onChange={(e) => setManual({ ...manual, company: e.target.value })} placeholder="e.g. Acme Corp" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description <span className="text-red-400">*</span></label>
            <textarea value={manual.text} onChange={(e) => setManual({ ...manual, text: e.target.value })} placeholder="Paste the full job description…" rows={7} className={`${inputCls} resize-none`} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{manual.text.length} characters</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setManualMode(false); setManual(emptyManual()); setError(""); }} className="px-4 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Cancel</button>
            <button onClick={addManual} className="px-5 py-1.5 bg-[#534AB7] text-white rounded-full text-sm font-medium hover:bg-[#4339a0]">Add JD</button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* JD List */}
      {jds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {jds.length}/{MAX_JDS} JDs added
            </p>
            {canAnalyze && (
              <span className="text-xs text-[#534AB7] bg-[#534AB7]/10 rounded-full px-2.5 py-0.5 font-medium">
                All {jds.length} will be analyzed
              </span>
            )}
          </div>
          {!canAnalyze && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Add at least {MIN_JDS} JDs to analyze — {MIN_JDS - jds.length} more needed
            </p>
          )}

          {jds.map((jd, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-[#534AB7]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-[#534AB7]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{jd.title}</p>
                      {jd.source === "live" && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Live</span>
                      )}
                      {jd.source === "ai" && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">AI</span>
                      )}
                      {jd.source === "live" && jd.platform && (
                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{jd.platform}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {jd.company}{jd.location ? ` · ${jd.location}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); removeJD(i); }} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expanded === i ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                </div>
              </div>
              {expanded === i && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{jd.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {jds.length > 0 && (
        <button
          onClick={onComplete}
          disabled={!canAnalyze}
          className="w-full py-3 bg-[#534AB7] text-white rounded-full font-medium hover:bg-[#4339a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
