import React from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { SocialProof } from '@/components/checkout/SocialProof';
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

          {/* PARCERIA ESTRATÉGICA */}
          <div className="border-t border-slate-200/60 pt-6 flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              💼 Parceria Estratégica
            </h3>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Se você representa uma empresa, pode apoiar o <strong>Instituto Ádapo</strong> de forma estratégica.
              </p>
              <p>
                Criamos parcerias que conectam investimento social e desenvolvimento do território, gerando impacto real no Novo Angelim.
              </p>
              <p>
                Ao se tornar uma parceira, sua organização passa a apoiar diretamente iniciativas que geram oportunidades e transformam vidas.
              </p>
            </div>
            <a 
              href="https://wa.me/5598985038023?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20as%20parcerias%20estrat%C3%A9gicas%20com%20o%20Instituto%20%C3%81dapo."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md text-sm active:scale-[0.98] w-full sm:w-auto self-start"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 1.981 14.119.957 11.5.957 6.062.957 1.637 5.328 1.634 10.758c-.001 1.674.452 3.3 1.311 4.757l-.955 3.486 3.652-.947zm12.64-5.32c-.313-.155-1.853-.902-2.134-1.003-.281-.101-.486-.155-.69.155-.205.31-.795.998-.97 1.199-.178.201-.354.227-.667.071-.313-.155-1.322-.482-2.52-1.54-1.312-1.157-1.785-2.036-1.942-2.31-.157-.275-.017-.424.12-.58.124-.14.281-.326.421-.49.141-.162.188-.278.281-.464.093-.186.047-.35-.024-.505-.07-.155-.69-1.637-.946-2.247-.25-.599-.5-.517-.69-.527-.178-.009-.383-.01-.589-.01-.205 0-.539.077-.821.383-.281.307-1.077 1.036-1.077 2.527s1.099 2.929 1.253 3.134c.154.205 2.162 3.266 5.24 4.568.732.31 1.303.495 1.748.634.736.231 1.407.198 1.937.12.59-.088 1.853-.747 2.115-1.432.261-.685.261-1.272.184-1.393-.077-.12-.281-.205-.595-.36z" />
              </svg>
              Entre em contato
            </a>
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
