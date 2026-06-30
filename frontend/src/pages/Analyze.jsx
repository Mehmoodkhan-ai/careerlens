import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Stepper from "../components/Stepper.jsx";
import CVStep from "../components/CVStep.jsx";
import JDStep from "../components/JDStep.jsx";
import AnalysisStep from "../components/AnalysisStep.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";

export default function Analyze() {
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [cvText, setCvText] = useState("");
  const [jds, setJds] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleCVReady = (text) => {
    setCvText(text);
    setCompletedSteps((prev) => [...new Set([...prev, 0])]);
    setStep(1);
  };

  const handleJDsChange = (list) => setJds(list);

  const handleJDsReady = () => {
    setCompletedSteps((prev) => [...new Set([...prev, 1])]);
    setStep(2);
  };

  const handleReset = () => {
    setCvText("");
    setJds([]);
    setCompletedSteps([]);
    setStep(0);
  };

  const handleStepClick = (s) => {
    if (s === 2 && jds.length < 5) return;
    setStep(s);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* Page header with gradient strip matching Home */}
      <div className="py-10 px-6" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5F4FF 60%, #EBE8FB 100%)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2A6E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              CV Analyzer
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">AI-powered analysis against real job descriptions</p>
          </div>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] text-sm text-[#6B7280] bg-white hover:border-[#7C78C8] hover:text-[#2D2A6E] transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
            </svg>
            History
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="-mt-4">
          <Stepper currentStep={step} onStepClick={handleStepClick} completedSteps={completedSteps} />
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-8 shadow-sm">
          {step === 0 && <CVStep cvText={cvText} onCVReady={handleCVReady} />}
          {step === 1 && <JDStep jds={jds} onJDsChange={handleJDsChange} onComplete={handleJDsReady} />}
          {step === 2 && <AnalysisStep cvText={cvText} jds={jds} onReset={handleReset} />}
        </div>
      </div>

      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
