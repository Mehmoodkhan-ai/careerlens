const STORAGE_KEY = "cv_history";
const MAX_ENTRIES = 20;

export function loadCVHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveToCVHistory(entry) {
  const full = {
    ...entry,
    id: entry.id ?? Math.random().toString(36).slice(2),
    timestamp: entry.timestamp ?? Date.now(),
  };
  const existing = loadCVHistory();
  const updated = [full, ...existing].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([full, ...existing.slice(0, MAX_ENTRIES - 2)]));
  }
  return full;
}

export function deleteFromCVHistory(id) {
  const updated = loadCVHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearCVHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatHistoryDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
