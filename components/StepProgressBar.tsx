
import React from 'react';
import { WorkflowStep } from '../types';

interface StepProgressBarProps {
  currentStep: WorkflowStep;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep }) => {
  const steps = [
    { id: WorkflowStep.SCENARIO_INPUT, label: '需求录入', icon: 'fa-feather-pointed' },
    { id: WorkflowStep.CONCEPT_REVIEW, label: '方案草拟', icon: 'fa-wand-magic-sparkles' },
    { id: WorkflowStep.FINAL_GENERATION, label: '成品交付', icon: 'fa-wine-bottle' },
  ];

  const getStepStatus = (stepId: WorkflowStep) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="flex items-center justify-between w-full mb-10 px-4">
      {steps.map((step, idx) => {
        const status = getStepStatus(step.id);
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                status === 'completed' ? 'bg-amber-600 text-white' :
                status === 'active' ? 'bg-amber-600 text-white shadow-lg shadow-amber-200 scale-110' :
                'bg-slate-200 text-slate-400'
              }`}>
                <i className={`fas ${step.icon}`}></i>
              </div>
              <span className={`text-xs mt-2 font-bold ${
                status === 'active' ? 'text-amber-600' : 'text-slate-500'
              }`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-slate-200 relative -mt-4">
                <div className={`h-full bg-amber-600 transition-all duration-500 ${
                  getStepStatus(steps[idx+1].id) !== 'pending' ? 'w-full' : 'w-0'
                }`}></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepProgressBar;
