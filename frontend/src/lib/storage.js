export const HISTORY_KEY = "cv-analyzer-history";
export const DRAFT_KEY = "cv-analyzer-draft";
export const DARK_KEY = "cv-analyzer-dark";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadHistory() {
  if (!isBrowser()) return [];
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveHistoryEntry(entry) {
  if (!isBrowser()) return;
  try {
    const list = loadHistory();
    if (list.some((e) => e.id === entry.id)) return;
    list.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export function clearHistory() {
  if (!isBrowser()) return;
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

export function loadDraft() {
  if (!isBrowser()) return null;
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function saveDraft(data) {
  if (!isBrowser()) return;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}

export function clearDraft() {
  if (!isBrowser()) return;
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
