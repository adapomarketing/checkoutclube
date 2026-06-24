import React from 'react';
import { Plan } from '@/types';
import { CheckCircle2, Wind, Cloud, CloudLightning } from 'lucide-react';
import { TestimonialCarousel } from './TestimonialCarousel';

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlanId: string;
  onSelect: (planId: string) => void;
  actionSlot?: React.ReactNode;
}

export function PlanSelector({ plans, selectedPlanId, onSelect, actionSlot }: PlanSelectorProps) {
  const planVisuals: Record<string, { icon: React.ReactNode, bg: string, border: string, text: string }> = {
    'Aliado Brisa': {
      icon: <Wind className="w-5 h-5" />,
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700'
    },
    'Aliado Vento': {
      icon: <Cloud className="w-5 h-5" />,
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      border: 'border-indigo-200',
      text: 'text-indigo-700'
    },
    'Aliado Tempestade': {
      icon: <CloudLightning className="w-5 h-5" />,
      bg: 'bg-violet-50 hover:bg-violet-100',
      border: 'border-violet-200',
      text: 'text-violet-700'
    }
  };

  const defaultVisual = {
    icon: <CheckCircle2 className="w-5 h-5" />,
    bg: 'bg-slate-50 hover:bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-700'
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 text-center mb-4">
        Escolha o seu nível de impacto
      </h2>

      <div className="grid gap-1 md:grid-cols-3 pt-4">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const visual = planVisuals[plan.name] || defaultVisual;
          const isRecommended = plan.name === 'Aliado Vento';

          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              className={`
                relative cursor-pointer transition-all duration-300 rounded-2xl p-5 border-2 flex flex-col h-full
                ${isSelected
                  ? `border-pipa-orange bg-pipa-orange/5 shadow-md shadow-pipa-orange/5 scale-[1.01]`
                  : `border-slate-200 bg-white hover:border-pipa-orange/20 hover:shadow-sm`}
              `}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pipa-orange text-white text-[12px] font-bold px-2 py-1 rounded-full shadow-sm z-10 whitespace-nowrap">
                  MAIS POPULAR
                </div>
              )}

              {isSelected && (
                <div className="absolute top-3 right-3 text-pipa-orange">
                  <CheckCircle2 className="w-5 h-5 fill-pipa-orange/20" />
                </div>
              )}

              <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center transition-colors ${visual.bg} ${visual.text}`}>
                {visual.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-0.5">{plan.name}</h3>

              <div className="mb-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  R$ {plan.amount.toString().replace('.', ',')}
                </span>
                <span className="text-xs text-slate-500 font-medium">/mês</span>
                <div className="text-[15px] text-pipa-orange font-medium mt-0.5">
                  Equivale a R$ {(plan.amount / 30).toFixed(2).replace('.', ',')}/dia
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="mt-6 p-5 rounded-2xl bg-pipa-orange/5 border border-pipa-orange/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-semibold text-slate-800 mb-1">Impacto do seu apoio:</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {selectedPlan.description}
          </p>
        </div>
      )}

      {/* Slot para botão + política — fixo acima do carrossel */}
      {actionSlot && (
        <div className="mt-4">
          {actionSlot}
        </div>
      )}

      {/* Carrossel de depoimentos — sempre abaixo do botão */}
      <div className="pt-6 border-t border-slate-100/80">
        <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4 text-center">
          O que a comunidade acha
        </h4>
        <TestimonialCarousel />
      </div>
    </div>
  );
}
