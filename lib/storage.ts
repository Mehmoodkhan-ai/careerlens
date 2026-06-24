import type { JobDescription } from "@/components/JDStep";

export const HISTORY_KEY = "cv-analyzer-history";
export const DRAFT_KEY = "cv-analyzer-draft";
export const DARK_KEY = "cv-analyzer-dark";

export interface PerJDScore {
  title: string;
  company: string;
  score: number;
  key_match: string;
  key_gap: string;
}

export interface Keyword {
  word: string;
  in_cv: boolean;
}

export interface AnalysisResult {
  match_score: number;
  strong_points: string[];
  weak_points: string[];
  summary: string;
  jd_title: string;
  per_jd_scores: PerJDScore[];
  ats_score: number;
  ats_tips: string[];
  keywords: Keyword[];
}

export interface HistoryEntry {
  id: string;
  date: string;
  score: number;
  ats_score: number;
  jd_count: number;
  jd_title: string;
  summary: string;
  full_analysis?: AnalysisResult;
}

export interface DraftData {
  cvText: string;
  jds: JobDescription[];
  savedAt: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    return s ? (JSON.parse(s) as HistoryEntry[]) : [];
  } catch { return []; }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  if (!isBrowser()) return;
  try {
    const list = loadHistory();
    if (list.some((e) => e.id === entry.id)) return;
    list.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

export function loadDraft(): DraftData | null {
  if (!isBrowser()) return null;
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    return s ? (JSON.parse(s) as DraftData) : null;
  } catch { return null; }
}

export function saveDraft(data: DraftData): void {
  if (!isBrowser()) return;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
