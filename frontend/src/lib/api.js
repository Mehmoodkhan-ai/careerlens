const BASE = "/api";

export async function analyzeCV(cvText, jds) {
  const r = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cvText, jds }),
  });
  if (!r.ok) throw new Error("Analysis failed");
  return r.json();
}

export async function parseCV(file) {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`${BASE}/parse-cv`, { method: "POST", body: form });
  if (!r.ok) throw new Error("Parse failed");
  return r.json();
}

export async function generateCV(data) {
  const r = await fetch(`${BASE}/generate-cv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Generate failed");
  return r.json();
}

export async function aiCvChat(payload) {
  const r = await fetch(`${BASE}/ai-cv-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("AI chat failed");
  return r.json();
}

export async function generateCoverLetter(payload) {
  const r = await fetch(`${BASE}/cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Cover letter failed");
  return r.json();
}

export async function rewriteCV(payload) {
  const r = await fetch(`${BASE}/rewrite-cv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Rewrite failed");
  return r.json();
}

export async function fetchJDs(role, location) {
  const r = await fetch(`${BASE}/fetch-jds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, location }),
  });
  if (!r.ok) throw new Error("Fetch JDs failed");
  return r.json();
}

// History API (Neon DB)
export async function getAnalysisHistory(sessionId) {
  const r = await fetch(`${BASE}/history/analysis/${sessionId}`);
  if (!r.ok) return { history: [] };
  return r.json();
}

export async function saveAnalysisHistory(sessionId, entry) {
  await fetch(`${BASE}/history/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, entry }),
  });
}

export async function clearAnalysisHistory(sessionId) {
  await fetch(`${BASE}/history/analysis/${sessionId}`, { method: "DELETE" });
}

export async function getCVHistory(sessionId) {
  const r = await fetch(`${BASE}/history/cv/${sessionId}`);
  if (!r.ok) return { history: [] };
  return r.json();
}

export async function saveCVHistory(sessionId, entry) {
  await fetch(`${BASE}/history/cv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, entry }),
  });
}

export async function deleteCVHistoryEntry(sessionId, id) {
  await fetch(`${BASE}/history/cv/${sessionId}/${id}`, { method: "DELETE" });
}

export async function clearCVHistory(sessionId) {
  await fetch(`${BASE}/history/cv/${sessionId}`, { method: "DELETE" });
}
