'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Frown, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CancelarAssinaturaPage() {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar assinatura.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Erro ao cancelar:', err);
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500">
        <Frown className="w-16 h-16 text-slate-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Que pena que você está nos deixando...</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Sua assinatura foi cancelada e não haverá novas cobranças. Seu acesso aos conteúdos exclusivos ficará disponível até o final do período já pago.
        </p>
        <Link 
          href="/minha-alianca"
          className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          Voltar para o Painel
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cancelar Assinatura</h2>
          <p className="text-sm text-slate-500">Isso interromperá os pagamentos recorrentes do seu plano.</p>
        </div>
      </div>

      <form onSubmit={handleCancel} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Poderia nos contar o motivo do cancelamento? <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <div className="space-y-3">
            {['Aperto financeiro', 'O valor estava alto', 'Não gostei dos conteúdos', 'Outro motivo'].map((opcao) => (
              <label key={opcao} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                <input 
                  type="radio" 
                  name="reason" 
                  value={opcao}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                />
                <span className="text-sm font-medium text-slate-700">{opcao}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            Ao cancelar, o projeto <strong>Ádapo</strong> deixará de receber sua contribuição mensal que ajuda dezenas de jovens no Morro do Papagaio. Você tem certeza?
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-4">
          <Link 
            href="/minha-alianca"
            className="w-full sm:w-auto px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-center"
          >
            Manter Assinatura
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed sm:ml-auto shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sim, quero cancelar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
