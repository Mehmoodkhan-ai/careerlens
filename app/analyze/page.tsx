"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Stepper from "@/components/Stepper";
import CVStep from "@/components/CVStep";
import JDStep, { type JobDescription } from "@/components/JDStep";
import DarkModeToggle from "@/components/DarkModeToggle";
import HistoryPanel from "@/components/HistoryPanel";
import CVHistoryDrawer from "@/components/CVHistoryDrawer";
import RestoreToast from "@/components/RestoreToast";
import { Brain, Clock, Sparkles, FileText, Home } from "lucide-react";
import { saveDraft, clearDraft } from "@/lib/storage";

const AnalysisStep = dynamic(() => import("@/components/AnalysisStep"), { ssr: false });

export default function AnalyzePage() {
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cvText, setCvText] = useState("");
  const [jds, setJDs] = useState<JobDescription[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cvHistoryOpen, setCvHistoryOpen] = useState(false);

  // ── Autosave draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cvText && jds.length === 0) return;
    const timer = setTimeout(() => {
      saveDraft({ cvText, jds, savedAt: new Date().toISOString() });
    }, 600);
    return () => clearTimeout(timer);
  }, [cvText, jds]);

  // ── Step management ─────────────────────────────────────────────────────────
  const completeStep = useCallback((s: number) => {
    setCompletedSteps((prev) => [...new Set([...prev, s])]);
    setStep(s + 1);
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setCompletedSteps([]);
    setCvText("");
    setJDs([]);
    clearDraft();
  }, []);

  const handleCVComplete = useCallback((text: string) => {
    setCvText(text);
    completeStep(0);
  }, [completeStep]);

  const handleJDComplete = useCallback(() => completeStep(1), [completeStep]);

  // ── Restore handler ─────────────────────────────────────────────────────────
  const handleRestore = useCallback((restoredCV: string, restoredJDs: JobDescription[]) => {
    setCvText(restoredCV);
    setJDs(restoredJDs);
    if (restoredCV) {
      setCompletedSteps([0]);
      setStep(1);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center shrink-0 hover:bg-[#4840A0] transition-colors">
            <Brain className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">CareerLens</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5 hidden sm:block">CV Analyzer</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/cv-maker"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-[#534AB7] text-white rounded-lg shadow-sm shadow-[#534AB7]/40 hover:bg-[#4840A0] hover:scale-105 hover:shadow-md hover:shadow-[#534AB7]/30 active:scale-95 transition-all duration-150"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CV Maker</span>
            </Link>
            <button
              onClick={() => setCvHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CV History</span>
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Stepper currentStep={step} onStepClick={setStep} completedSteps={completedSteps} />

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-8">
          {step === 0 && <CVStep onComplete={handleCVComplete} />}
          {step === 1 && (
            <JDStep jds={jds} onJDsChange={setJDs} onComplete={handleJDComplete} />
          )}
          {step === 2 && (
            <AnalysisStep cvText={cvText} jds={jds} onReset={reset} />
          )}
        </div>

        {step < 2 && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
            Step {step + 1} of 3 —{" "}
            {step === 0 ? "Upload or paste your CV to get started" : "Add job descriptions then click Analyze"}
          </p>
        )}
      </main>

      {/* Analysis history panel */}
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* CV history drawer */}
      <CVHistoryDrawer isOpen={cvHistoryOpen} onClose={() => setCvHistoryOpen(false)} />

      {/* Restore toast */}
      <RestoreToast onRestore={handleRestore} />
    </div>
  );
}
