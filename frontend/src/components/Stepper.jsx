const steps = [
  { label: "My CV", index: 0 },
  { label: "Fetch JDs", index: 1 },
  { label: "Analysis", index: 2 },
];

export default function Stepper({ currentStep, onStepClick, completedSteps }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 pt-6">
      {steps.map((step, i) => {
        const isActive = step.index === currentStep;
        const isCompleted = completedSteps.includes(step.index);
        const isClickable = isCompleted || step.index <= Math.max(...completedSteps, 0);

        return (
          <div key={step.index} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.index)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#2D2A6E] text-white shadow-md"
                  : isCompleted
                  ? "bg-[#E8E6FB] text-[#2D2A6E] cursor-pointer hover:bg-[#D5D1F5]"
                  : "bg-[#F5F4FF] text-[#9CA3AF] cursor-not-allowed"
              }`}
            >
              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isActive
                  ? "bg-white text-[#2D2A6E]"
                  : isCompleted
                  ? "bg-[#2DD4A7] text-white"
                  : "bg-[#E5E7EB] text-[#9CA3AF]"
              }`}>
                {isCompleted && !isActive ? "✓" : step.index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1 ${
                completedSteps.includes(step.index) ? "bg-[#2DD4A7]" : "bg-[#E5E7EB]"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
