import React from 'react';
import Link from 'next/link';
import { HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function ObrigadoPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans flex flex-col">
      {/* HEADER SIMPLES */}
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/alianca-dos-ventos" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <HeartHandshake className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Clube das Pipas</h1>
            <p className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">Aliança dos Ventos</p>
          </div>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-500">
          
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
            Muito obrigado, Aliado(a)!
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Sua contribuição é o vento que mantém nossas pipas no alto. Acabamos de enviar um e-mail com os detalhes do seu apoio.
          </p>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-indigo-900 mb-2">O que acontece agora?</h3>
            <ul className="space-y-3 text-sm text-indigo-800/80">
              <li className="flex items-start">
                <span className="bg-indigo-200 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">1</span>
                Seu pagamento será processado e confirmado em breve.
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-200 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">2</span>
                Você receberá um e-mail de boas-vindas com o recibo.
              </li>
              <li className="flex items-start">
                <span className="bg-indigo-200 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">3</span>
                O seu painel de assinante já está criado! Acesse para ver os conteúdos.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/login"
              className="inline-flex items-center justify-center w-full sm:w-1/2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md"
            >
              Acessar meu painel
            </Link>
            <Link 
              href="/alianca-dos-ventos"
              className="inline-flex items-center justify-center w-full sm:w-1/2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
