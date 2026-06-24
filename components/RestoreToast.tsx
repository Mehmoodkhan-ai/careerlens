"use client";

import { useEffect, useState } from "react";
import { RotateCcw, X, Clock } from "lucide-react";
import { loadDraft, clearDraft, type DraftData } from "@/lib/storage";
import type { JobDescription } from "./JDStep";

interface RestoreToastProps {
  onRestore: (cvText: string, jds: JobDescription[]) => void;
}

export default function RestoreToast({ onRestore }: RestoreToastProps) {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = loadDraft();
    if (saved && (saved.cvText || saved.jds?.length > 0)) {
      setDraft(saved);
      setVisible(true);
    }
  }, []);

  if (!visible || !draft) return null;

  const dismiss = () => {
    setVisible(false);
    clearDraft();
  };

  const restore = () => {
    onRestore(draft.cvText ?? "", draft.jds ?? []);
    setVisible(false);
  };

  const savedAgo = () => {
    try {
      const diff = Date.now() - new Date(draft.savedAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return "recently"; }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl px-5 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-[#534AB7]/10 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-[#534AB7]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Restore previous session?</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Saved {savedAgo()}
            {draft.cvText ? " · CV text" : ""}
            {draft.jds?.length ? ` · ${draft.jds.length} JD${draft.jds.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={restore}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#534AB7] text-white rounded-full text-xs font-medium hover:bg-[#4339a0] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Restore
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
