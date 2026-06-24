// Este é um Server Component que pode buscar o número de aliados no banco
import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Users } from 'lucide-react';

export async function SocialProof() {
  let count = 0;
  
  try {
    // Busca o total de assinantes ativos
    const { count: activeCount, error } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
      
    if (!error && activeCount) {
      count = activeCount;
    }
  } catch (err) {
    console.error('Erro ao buscar contagem de aliados:', err);
  }

  // Define um número base para prova social inicial e trava no máximo de 30
  const displayCount = Math.min(Math.max(count, 12), 30);

  return (
    <div className="flex items-center justify-center space-x-3 py-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pipa-blue/30 shadow-sm">
      <div className="flex -space-x-3">
        {/* Avatares mockados para ilustrar */}
        <div className="w-10 h-10 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="Aliado" className="w-full h-full object-cover" />
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center overflow-hidden z-10">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede" alt="Aliado" className="w-full h-full object-cover" />
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center overflow-hidden z-20">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffdfbf" alt="Aliado" className="w-full h-full object-cover" />
        </div>
        <div className="w-10 h-10 rounded-full bg-pipa-blue/20 border-2 border-white flex items-center justify-center z-30 text-xs font-bold text-pipa-blue">
          +{displayCount}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-800 flex items-center">
          Junte-se a {displayCount} aliados <Users className="w-4 h-4 ml-1.5 text-pipa-orange" />
        </span>
        <span className="text-xs text-slate-500 font-medium">apoiando o Clube das Pipas hoje.</span>
      </div>
    </div>
  );
}
