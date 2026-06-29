import type { TemplateId, PageMode } from "./generateCVPDF";

// ── Shared form-state types (also used by page.tsx) ───────────────────────────

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  portfolio: string;
  github: string;
  linkedin: string;
}

export interface SkillCategoryEntry {
  category: string;
  items: string; // comma-separated
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  duration: string;
  bullets: string; // newline-separated
}

export interface ProjectEntry {
  id: string;
  name: string;
  liveLink: string;
  description: string;
  techStack: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  dates: string;
}

export interface CertificateEntry {
  id: string;
  issuer: string;
  date: string;
  names: string; // newline-separated
}

export interface CVHistoryFormData {
  personal: PersonalInfo;
  summary: string;
  skills: SkillCategoryEntry[];
  experiences: ExperienceEntry[];
  projects: ProjectEntry[];
  educations: EducationEntry[];
  certificates: CertificateEntry[];
}

export interface CVHistoryEntry {
  id: string;
  timestamp: number;
  name: string;       // person's display name
  template: TemplateId;
  pageMode: PageMode;
  formData: CVHistoryFormData;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cv_history";
const MAX_ENTRIES = 20;

export function loadHistory(): CVHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CVHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(
  entry: Omit<CVHistoryEntry, "id" | "timestamp">
): CVHistoryEntry {
  const full: CVHistoryEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
  };
  const existing = loadHistory();
  const updated = [full, ...existing].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full — drop oldest entry and retry
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([full, ...existing.slice(0, MAX_ENTRIES - 2)])
    );
  }
  return full;
}

export function deleteFromHistory(id: string): CVHistoryEntry[] {
  const updated = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatHistoryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
