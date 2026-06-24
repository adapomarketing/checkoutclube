import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/asaas';

// ============================================================
// API: Cancelamento de Assinatura
// POST /api/subscription/cancel
// Body: { reason?: string }
//
// Requer usuário autenticado (valida via token de sessão).
// Cancela no Asaas e atualiza o Supabase.
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação do usuário via cookie de sessão
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // 2. Buscar o subscriber e a subscription ativa do usuário
    const { data: subscriber, error: subErr } = await supabaseAdmin
      .from('subscribers')
      .select('id, name, email, status')
      .eq('auth_user_id', user.id)
      .single();

    if (subErr || !subscriber) {
      return NextResponse.json({ error: 'Assinante não encontrado.' }, { status: 404 });
    }

    if (subscriber.status === 'cancelled') {
      return NextResponse.json({ error: 'Assinatura já está cancelada.' }, { status: 400 });
    }

    const { data: subscription, error: subscriptionErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id, asaas_subscription_id, status')
      .eq('subscriber_id', subscriber.id)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionErr || !subscription) {
      return NextResponse.json({ error: 'Assinatura ativa não encontrada.' }, { status: 404 });
    }

    // 3. Parsear motivo do cancelamento (opcional)
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason ?? '';
    } catch {
      // Body é opcional
    }

    console.log(`[Cancel] Iniciando cancelamento | subscriber: ${subscriber.id} | subscription Asaas: ${subscription.asaas_subscription_id} | motivo: ${reason || 'não informado'}`);

    // 4. Cancelar no Asaas
    if (subscription.asaas_subscription_id) {
      try {
        await cancelSubscription(subscription.asaas_subscription_id);
        console.log(`[Cancel] ✅ Assinatura ${subscription.asaas_subscription_id} cancelada no Asaas.`);
      } catch (asaasErr: any) {
        console.error('[Cancel] ❌ Erro ao cancelar no Asaas:', asaasErr.message);
        // Mesmo se falhar no Asaas, prosseguimos para atualizar o banco local
        // O webhook do Asaas (SUBSCRIPTION_DELETED) eventualmente confirmará se bem-sucedido
      }
    }

    // 5. Atualizar status no Supabase
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'CANCELLED' })
      .eq('id', subscription.id);

    await supabaseAdmin
      .from('subscribers')
      .update({ status: 'cancelled' })
      .eq('id', subscriber.id);

    // 6. Registrar motivo nos logs (se fornecido)
    if (reason) {
      await supabaseAdmin
        .from('webhook_logs')
        .insert({
          event: 'SUBSCRIPTION_CANCELLED_BY_USER',
          asaas_subscription_id: subscription.asaas_subscription_id,
          payload: { reason, subscriber_id: subscriber.id, subscriber_email: subscriber.email },
          processed: true,
        });
    }

    console.log(`[Cancel] ✅ Cancelamento concluído para ${subscriber.email}`);

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso.',
    });

  } catch (error: any) {
    console.error('[Cancel API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao cancelar assinatura.' },
      { status: 500 }
    );
  }
}
