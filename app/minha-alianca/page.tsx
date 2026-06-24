import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, PlayCircle, Image as ImageIcon, ExternalLink, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login');
  }

  // 1. Buscar os dados do assinante usando o e-mail do usuário autenticado
  // Utilizamos o supabaseAdmin temporariamente (ou bypass) se RLS bloquear leitura
  // Mas como a pessoa está logada, RLS deveria permitir se baseado no email.
  const { data: subscriber, error: subError } = await supabase
    .from('subscribers')
    .select(`
      *,
      plan:plans(*),
      subscription:subscriptions(*)
    `)
    .eq('email', user.email)
    .single();

  if (!subscriber) {
    // Se não encontrou a assinatura, pode ser um e-mail sem assinatura ativa
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Assinatura não encontrada</h2>
        <p className="text-slate-600 mb-6">
          Não encontramos uma assinatura ativa para o e-mail <strong className="text-slate-800">{user.email}</strong>.
        </p>
        <Link 
          href="/alianca-dos-ventos"
          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Conhecer os Planos
        </Link>
      </div>
    );
  }

  const activeSubscription = subscriber.subscription && subscriber.subscription.length > 0 
    ? subscriber.subscription[0] 
    : null;
    
  const statusColors: Record<string, string> = {
    'ACTIVE': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'OVERDUE': 'bg-amber-100 text-amber-800 border-amber-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
    'active': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'pending_payment': 'bg-amber-100 text-amber-800 border-amber-200',
    'PENDING': 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const statusLabels: Record<string, string> = {
    'ACTIVE': 'Ativa',
    'OVERDUE': 'Atrasada',
    'CANCELLED': 'Cancelada',
    'active': 'Ativa',
    'pending_payment': 'Aguardando Pagamento',
    'PENDING': 'Aguardando Pagamento',
  };

  const currentStatus = activeSubscription?.status || subscriber.status || 'ACTIVE';
  const colorClass = statusColors[currentStatus] || 'bg-slate-100 text-slate-800 border-slate-200';
  const statusLabel = statusLabels[currentStatus] || currentStatus;

  // 2. Buscar conteúdos exclusivos liberados para este plano
  const { data: contents } = await supabase
    .from('exclusive_content')
    .select('*')
    .lte('min_plan_amount', subscriber.plan.amount)
    .order('created_at', { ascending: false });

  // 3. Helper para gerar URL assinada para arquivos do Storage (se applicable)
  // Como estamos listando os conteúdos, apenas geraremos as URLs dos que são 'document' ou 'image' armazenados no Supabase Storage
  async function getSignedUrl(filePath: string) {
    const { data } = await supabase
      .storage
      .from('exclusive-files')
      .createSignedUrl(filePath, 3600); // 1 hora de validade
    return data?.signedUrl || '#';
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* CARD DE RESUMO DA ASSINATURA */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row gap-6 md:gap-12 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Olá, {subscriber.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 text-sm mb-4">Gerencie sua assinatura e acesse seus benefícios.</p>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-lg border ${colorClass}`}>
              {statusLabel}
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold uppercase tracking-wide rounded-lg">
              {subscriber.plan.name}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 w-full md:w-auto min-w-[250px]">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor do Apoio</p>
              <p className="font-bold text-slate-900">R$ {subscriber.plan.amount.toFixed(2).replace('.', ',')} / mês</p>
            </div>
          </div>
          
          {activeSubscription && activeSubscription.next_due_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Próxima Cobrança</p>
                <p className="font-bold text-slate-900">
                  {new Date(activeSubscription.next_due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900">Conteúdos Exclusivos</h3>
      </div>

      {/* GRID DE CONTEÚDOS */}
      {contents && contents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <div key={content.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
              <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                {content.type === 'video' ? (
                  <PlayCircle className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors z-10 relative" />
                ) : content.type === 'image' ? (
                  <ImageIcon className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors z-10 relative" />
                ) : (
                  <FileText className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors z-10 relative" />
                )}
                
                {/* Fallback de thumbnail */}
                {content.thumbnail_url && (
                  <img src={content.thumbnail_url} alt={content.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                )}
              </div>
              
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {content.type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(content.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 leading-tight">{content.title}</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{content.description}</p>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {content.url ? (
                    <a 
                      href={content.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 font-semibold text-sm flex items-center hover:text-indigo-700 transition-colors"
                    >
                      Acessar conteúdo <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm italic">Disponível em breve</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 p-12 rounded-3xl border border-slate-200 border-dashed text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700">Nenhum conteúdo liberado</h4>
          <p className="text-sm text-slate-500 mt-1">Os relatórios e materiais exclusivos do seu plano aparecerão aqui.</p>
        </div>
      )}

      {/* ÁREA DE PERIGO (CANCELAR ASSINATURA) */}
      <div className="mt-16 pt-8 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Configurações da Conta</h4>
        <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl">
          <div>
            <p className="font-bold text-slate-700">Cancelar Assinatura</p>
            <p className="text-sm text-slate-500">Interrompa os pagamentos recorrentes a qualquer momento.</p>
          </div>
          <Link 
            href="/minha-alianca/cancelar"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            Cancelar Apoio
          </Link>
        </div>
      </div>
      
    </div>
  );
}
