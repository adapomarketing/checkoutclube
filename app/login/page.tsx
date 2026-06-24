'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeartHandshake, Loader2, Send } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Erro ao enviar link mágico:', err);
      setError('Ocorreu um erro ao enviar o link. Verifique o e-mail e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900">
      
      <div className="mb-8">
        <Link href="/" className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
            <HeartHandshake className="text-white w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-xl text-slate-900 leading-tight">Clube das Pipas</h1>
            <p className="text-sm font-semibold text-indigo-600 tracking-wide uppercase">Área do Assinante</p>
          </div>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-emerald-600 ml-1" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Link enviado!</h2>
            <p className="text-slate-600 mb-6">
              Enviamos um link mágico de acesso para <strong className="text-slate-800">{email}</strong>. 
              Verifique sua caixa de entrada e spam, e clique no link para acessar a sua área.
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Tentar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Entrar na minha conta</h2>
            <p className="text-slate-500 text-sm mb-8 text-center">
              Insira o e-mail que você utilizou ao fazer sua assinatura para receber um link de acesso direto.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Enviando link...
                  </>
                ) : (
                  'Enviar link mágico'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
