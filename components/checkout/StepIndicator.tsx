import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { num: 1, label: 'Plano' },
    { num: 2, label: 'Seus dados' },
    { num: 3, label: 'Pagamento' },
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-sm mx-auto relative">
        {/* Progress Bar Background (thickness changed from h-1 to h-1.5) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full z-0"></div>
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const isPending = currentStep < step.num;

          return (
            <div key={step.num} className="relative z-10 flex flex-col items-center">
              {/* Step Circle (size changed from w-10 h-10 to w-12 h-12, font changed from text-sm to text-base) */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold transition-all duration-300 border-2 
                  ${isCompleted ? 'bg-pipa-orange border-pipa-orange text-white' : ''}
                  ${isCurrent ? 'bg-white border-pipa-orange text-pipa-orange shadow-md scale-110' : ''}
                  ${isPending ? 'bg-white border-slate-300 text-slate-400' : ''}
                `}
              >
                {/* Icon size changed from w-5 h-5 to w-6 h-6 */}
                {isCompleted ? <Check className="w-6 h-6" /> : step.num}
              </div>
              {/* Step Label (font size changed from text-xs to text-sm, position bottom adjusted to -bottom-7) */}
              <span 
                className={`mt-2 text-sm font-semibold absolute -bottom-7 whitespace-nowrap transition-colors duration-300
                  ${isCurrent || isCompleted ? 'text-pipa-orange font-bold' : 'text-slate-400'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
        
        {/* Progress Bar Fill (thickness changed from h-1 to h-1.5) */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-pipa-orange rounded-full z-0 transition-all duration-500 ease-out"
          style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
        ></div>
      </div>
    </div>
  );
}
