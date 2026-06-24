import React from 'react';
import Link from 'next/link';
import { HeartHandshake, LogOut, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MinhaAliancaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Action para fazer logout
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans flex flex-col">
      {/* HEADER DA ÁREA DO ASSINANTE */}
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <Link href="/minha-alianca" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <HeartHandshake className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">Minha Aliança</h1>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Painel do Assinante</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Site principal
          </Link>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <form action={signOut}>
            <button 
              type="submit"
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-grow p-4 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Clube das Pipas — Projeto Ádapo</p>
      </footer>
    </div>
  );
}
