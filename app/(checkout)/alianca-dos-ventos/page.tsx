import React from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { SocialProof } from '@/components/checkout/SocialProof';
import { TestimonialCarousel } from '@/components/checkout/TestimonialCarousel';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Plan } from '@/types';
import Image from 'next/image';

export const metadata = {
  title: 'Aliança dos Ventos — Clube das Pipas',
  description: 'Seja um aliado do Clube das Pipas e apoie o desenvolvimento de crianças e adolescentes da comunidade do Novo Angelim.',
};

export default async function AliancaDosVentosPage() {
  // Buscar planos do Supabase (para passar para o Client Component CheckoutForm)
  let plans: Plan[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('amount', { ascending: true });

    if (!error && data) {
      plans = data as Plan[];
    }
  } catch (err) {
    console.error('Erro ao buscar planos:', err);
  }

  // Fallback caso o banco não retorne (ou não esteja configurado ainda)
  if (plans.length === 0) {
    plans = [
      { id: '1', name: 'Aliado Brisa', amount: 20, cycle: 'MONTHLY', description: 'Garante a merenda de uma criança no Clube das Pipas por um mês', active: true, created_at: '', updated_at: '' },
      { id: '2', name: 'Aliado Vento', amount: 50, cycle: 'MONTHLY', description: 'Financia o material de uma oficina completa do projeto', active: true, created_at: '', updated_at: '' },
      { id: '3', name: 'Aliado Tempestade', amount: 100, cycle: 'MONTHLY', description: 'Sustenta um encontro inteiro de atividades do Clube das Pipas', active: true, created_at: '', updated_at: '' },
    ];
  }

  return (
    <div 
      className="min-h-screen selection:bg-pipa-blue/30 selection:text-pipa-orange font-sans bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/imagens/background.svg')" }}
    >

      {/* REMOVIDO HEADER SUPERIOR CONFOME SOLICITADO */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-48 pb-12 md:pb-20 lg:flex lg:gap-16 min-h-[calc(100vh-100px)]">

        {/* COLUNA ESQUERDA: Texto / Hero */}
        <div className="lg:w-5/12 mb-12 lg:mb-0 flex flex-col gap-8 bg-white/60 backdrop-blur-md p-8 lg:p-10 rounded-3xl shadow-lg border border-white/40 h-fit animate-spring-up" style={{ animationDelay: '100ms' }}>
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
              O vento que move <span className="text-pipa-orange">nossas pipas</span>.
            </h2>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Sua contribuição mensal garante que o <strong>Clube das Pipas</strong> continue sendo um ambiente seguro e de afeto que preserva a infância das crianças na comunidade.
            </p>

            <SocialProof />
          </div>

          {/* QUEM SOMOS E VÍDEO DO YOUTUBE */}
          <div className="border-t border-slate-200/60 pt-6 flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-slate-800">Quem somos</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              O <strong>Clube das Pipas</strong> é uma iniciativa do Instituto Ádapo voltada para o desenvolvimento integral de crianças e adolescentes no Novo Angelim. Promovemos acolhimento, educação complementar e cidadania através de oficinas criativas e do brincar seguro.
            </p>
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-md border border-slate-100">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/yS8L4NCFmR8?si=3Zps-4GZ9nzYpr4y" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="hidden lg:block">
            <TestimonialCarousel />
          </div>
        </div>

        {/* COLUNA DIREITA: Formulário */}
        <div className="lg:w-7/12">
          <CheckoutForm plans={plans} />
        </div>

      </main>

      {/* FOOTER (CRÉDITOS) */}
      <footer className="w-full bg-pipa-blue/80 backdrop-blur-md border-t border-white/20 py-8 px-6 md:px-12 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Image 
                src="/imagens/logo clube.svg" 
                alt="Clube das Pipas" 
                width={140} 
                height={50} 
                className="h-12 w-auto"
              />
            </div>
            <div className="text-white/90 text-sm hidden md:block space-y-1">
              <p className="font-bold text-base mb-2">Canais oficiais</p>
              <p className="hover:text-white cursor-pointer transition-colors">Acompanhe a gente</p>
              <p className="hover:text-white cursor-pointer transition-colors">Entrar em contato</p>
              <p className="hover:text-white cursor-pointer transition-colors">Saiba mais sobre nossa missão</p>
            </div>
          </div>
          <div className="text-white/80 text-sm text-center md:text-right">
            <p>© Copyright {new Date().getFullYear()}</p>
            <p className="mt-1 text-xs opacity-70">Instituto Ádapo — Clube das Pipas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
