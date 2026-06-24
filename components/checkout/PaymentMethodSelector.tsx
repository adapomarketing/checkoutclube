import React from 'react';
import { PaymentMethod } from '@/types';
import { CreditCard, QrCode, FileText, CheckCircle2 } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'CREDIT_CARD' as PaymentMethod,
      name: 'Cartão de Crédito',
      description: 'Aprovação na hora',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'indigo'
    },
    {
      id: 'PIX' as PaymentMethod,
      name: 'Pix',
      description: 'Aprovação imediata',
      icon: <QrCode className="w-6 h-6" />,
      color: 'teal'
    },
    {
      id: 'BOLETO' as PaymentMethod,
      name: 'Boleto',
      description: 'Até 3 dias úteis',
      icon: <FileText className="w-6 h-6" />,
      color: 'slate'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Método de pagamento</h3>
      
      <div className="grid gap-3 sm:grid-cols-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`
                relative cursor-pointer transition-all duration-200 rounded-xl p-4 border-2 flex flex-col items-center text-center
                ${isSelected 
                  ? 'border-pipa-orange bg-pipa-orange/10 shadow-md ring-1 ring-pipa-orange ring-offset-1' 
                  : 'border-slate-200 bg-white hover:border-pipa-orange/50 hover:bg-slate-50'}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-pipa-orange">
                  <CheckCircle2 className="w-5 h-5 fill-pipa-orange/20" />
                </div>
              )}
              
              <div className={`
                w-10 h-10 rounded-full mb-3 flex items-center justify-center transition-colors
                ${isSelected ? 'bg-pipa-orange/20 text-pipa-orange' : 'bg-slate-100 text-slate-500'}
              `}>
                {method.icon}
              </div>
              
              <span className={`font-semibold mb-1 ${isSelected ? 'text-pipa-orange' : 'text-slate-700'}`}>
                {method.name}
              </span>
              <span className="text-xs text-slate-500">
                {method.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
