"use client";

const steps = [
  { label: "My CV", index: 0 },
  { label: "Fetch JDs", index: 1 },
  { label: "Analysis", index: 2 },
];

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

export default function Stepper({ currentStep, onStepClick, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6 sm:mb-10">
      {steps.map((step, i) => {
        const isActive = step.index === currentStep;
        const isCompleted = completedSteps.includes(step.index);
        const isClickable = isCompleted || step.index <= Math.max(...completedSteps, 0);

        return (
          <div key={step.index} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.index)}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all
                ${isActive
                  ? "bg-[#534AB7] text-white shadow-md"
                  : isCompleted
                  ? "bg-[#534AB7]/20 text-[#534AB7] cursor-pointer hover:bg-[#534AB7]/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }`}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isActive
                    ? "bg-white text-[#534AB7]"
                    : isCompleted
                    ? "bg-[#534AB7] text-white"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500"
                  }`}
              >
                {isCompleted && !isActive ? "✓" : step.index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`w-6 sm:w-12 h-0.5 mx-0.5 sm:mx-1 ${
                  completedSteps.includes(step.index)
                    ? "bg-[#534AB7]"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
