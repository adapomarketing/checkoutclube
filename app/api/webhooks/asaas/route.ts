// ============================================================
// Webhook Handler — Asaas (Fase 4 — Implementação Completa)
// Rota: POST /api/webhooks/asaas
//
// Recebe eventos de pagamento e assinatura do Asaas.
// Valida a autenticidade via ASAAS_WEBHOOK_TOKEN.
// Registra todos os eventos em webhook_logs para auditoria.
// Atualiza subscribers e subscriptions automaticamente.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/mailer';
import { getWelcomeEmailHtml } from '@/lib/email-templates';

// Mapeamento de evento Asaas → status interno (subscribers)
const PAYMENT_TO_SUBSCRIBER_STATUS: Record<string, string> = {
  PAYMENT_RECEIVED: 'active',
  PAYMENT_CONFIRMED: 'active',
  PAYMENT_RESTORED: 'active',
  PAYMENT_OVERDUE: 'overdue',
  PAYMENT_REFUNDED: 'cancelled',
  PAYMENT_CHARGEBACK_DISPUTE: 'overdue',
};

// Mapeamento de evento Asaas → status interno (subscriptions)
const PAYMENT_TO_SUBSCRIPTION_STATUS: Record<string, string> = {
  PAYMENT_RECEIVED: 'ACTIVE',
  PAYMENT_CONFIRMED: 'ACTIVE',
  PAYMENT_RESTORED: 'ACTIVE',
  PAYMENT_OVERDUE: 'OVERDUE',
  PAYMENT_REFUNDED: 'CANCELLED',
  PAYMENT_CHARGEBACK_DISPUTE: 'OVERDUE',
};

export async function POST(request: NextRequest) {
  // 1. Validar autenticidade do webhook
  const receivedToken = request.headers.get('asaas-access-token');
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

  if (expectedToken && receivedToken !== expectedToken) {
    console.warn('[Webhook] ⚠️ Token inválido. Requisição rejeitada.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!expectedToken) {
    console.warn('[Webhook] ⚠️ ASAAS_WEBHOOK_TOKEN não configurado. Validação ignorada em dev.');
  }

  // 2. Parsear payload
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event: string = payload.event;
  const payment = payload.payment ?? null;
  const subscription = payload.subscription ?? null;

  console.log(`[Webhook] 📥 Evento: ${event} | payment: ${payment?.id ?? '-'} | subscription: ${payment?.subscription ?? subscription?.id ?? '-'}`);

  // 3. Registrar em webhook_logs para auditoria (independente do resultado)
  const { data: logRow } = await supabaseAdmin
    .from('webhook_logs')
    .insert({
      event,
      asaas_payment_id: payment?.id ?? null,
      asaas_subscription_id: payment?.subscription ?? subscription?.id ?? null,
      asaas_customer_id: payment?.customer ?? subscription?.customer ?? null,
      payload,
      processed: false,
    })
    .select('id')
    .single();

  const logId = logRow?.id;

  try {
    // 4. Processar evento
    if (PAYMENT_TO_SUBSCRIBER_STATUS[event] && payment) {
      // --- Eventos de pagamento ---
      await handlePaymentStatusChange(
        payment,
        PAYMENT_TO_SUBSCRIBER_STATUS[event],
        PAYMENT_TO_SUBSCRIPTION_STATUS[event]
      );

    } else if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_CANCELLED') {
      // --- Cancelamento de assinatura ---
      const subscriptionId = subscription?.id ?? payment?.subscription;
      if (subscriptionId) {
        await handleSubscriptionCancelled(subscriptionId);
      }

    } else {
      // Evento não mapeado — apenas logado, sem ação
      console.log(`[Webhook] ℹ️ Evento ignorado (não mapeado): ${event}`);
    }

    // 5. Marcar log como processado com sucesso
    if (logId) {
      await supabaseAdmin
        .from('webhook_logs')
        .update({ processed: true })
        .eq('id', logId);
    }

    // Sempre retorna 200 para o Asaas confirmar recebimento
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error(`[Webhook] ❌ Erro ao processar ${event}:`, error.message);

    // Registrar erro no log sem impedir a resposta 200
    // (evita que o Asaas reenvie infinitamente — erros ficam para análise manual)
    if (logId) {
      await supabaseAdmin
        .from('webhook_logs')
        .update({ processed: false, error_message: error.message })
        .eq('id', logId);
    }

    return NextResponse.json(
      { received: true, warning: 'Processing error logged' },
      { status: 200 }
    );
  }
}

// ============================================================
// Handler: Mudança de status de pagamento
// Atualiza subscriber + subscription baseado no customer_id do Asaas
// ============================================================
async function handlePaymentStatusChange(
  payment: any,
  subscriberStatus: string,
  subscriptionStatus: string
) {
  const asaasCustomerId: string = payment.customer;
  const asaasSubscriptionId: string | null = payment.subscription ?? null;

  // Busca o subscriber pelo customer_id do Asaas
  const { data: subscriber, error: findErr } = await supabaseAdmin
    .from('subscribers')
    .select('id, status, name, email')
    .eq('asaas_customer_id', asaasCustomerId)
    .single();

  if (findErr || !subscriber) {
    throw new Error(`Subscriber não encontrado para asaas_customer_id: ${asaasCustomerId}`);
  }

  // Atualiza o status do subscriber
  const { error: updateSubErr } = await supabaseAdmin
    .from('subscribers')
    .update({ status: subscriberStatus })
    .eq('id', subscriber.id);

  if (updateSubErr) {
    throw new Error(`Falha ao atualizar subscriber ${subscriber.id}: ${updateSubErr.message}`);
  }

  console.log(`[Webhook] ✅ Subscriber "${subscriber.name}" (${subscriber.email}): ${subscriber.status} → ${subscriberStatus}`);

  // Atualiza o status da subscription vinculada
  if (asaasSubscriptionId) {
    const { error: updateSubsErr } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: subscriptionStatus })
      .eq('asaas_subscription_id', asaasSubscriptionId);

    if (updateSubsErr) {
      console.warn(`[Webhook] Aviso: falha ao atualizar subscription ${asaasSubscriptionId}:`, updateSubsErr.message);
    } else {
      console.log(`[Webhook] ✅ Subscription ${asaasSubscriptionId}: → ${subscriptionStatus}`);
    }
  }

  // --- Envio de E-mail de Boas-vindas ---
  // Se o usuário não era "active" antes, e agora passou a ser "active", disparamos o e-mail
  if (subscriber.status !== 'active' && subscriberStatus === 'active') {
    try {
      // Formatar o valor (payment.value)
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(payment.value || 0);

      // Disparo via Nodemailer + Gmail
      await sendEmail({
        to: subscriber.email, 
        subject: 'Sua assinatura foi confirmada! Bem-vindo(a) 🪁',
        html: getWelcomeEmailHtml(subscriber.name, 'Plano Mensal', formattedAmount),
      });
      console.log(`[Webhook] ✉️ E-mail de boas-vindas enviado via Gmail para ${subscriber.email}`);
    } catch (emailError: any) {
      console.error(`[Webhook] ❌ Falha ao enviar e-mail via Gmail para ${subscriber.email}:`, emailError.message);
    }
  }
}

// ============================================================
// Handler: Cancelamento de assinatura
// Atualiza subscriber + subscription para "cancelled"
// ============================================================
async function handleSubscriptionCancelled(asaasSubscriptionId: string) {
  // Busca a subscription local
  const { data: subscription, error: findErr } = await supabaseAdmin
    .from('subscriptions')
    .select('id, subscriber_id, status')
    .eq('asaas_subscription_id', asaasSubscriptionId)
    .single();

  if (findErr || !subscription) {
    throw new Error(`Subscription não encontrada: ${asaasSubscriptionId}`);
  }

  // Atualiza subscription
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'CANCELLED' })
    .eq('id', subscription.id);

  // Atualiza subscriber
  await supabaseAdmin
    .from('subscribers')
    .update({ status: 'cancelled' })
    .eq('id', subscription.subscriber_id);

  console.log(`[Webhook] ❌ Subscription ${asaasSubscriptionId} cancelada. Subscriber ${subscription.subscriber_id} → cancelled`);
}
