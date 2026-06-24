import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { 
  createCustomer, 
  findCustomerByCpf, 
  createSubscription,
  tokenizeCreditCard
} from '@/lib/asaas';
import { CreateSubscriptionRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: CreateSubscriptionRequest = await request.json();
    
    // 1. Validar CPF e E-mail contra duplicidades no Supabase primeiro
    // Ou delegar essa validação para o Asaas (via findCustomerByCpf)
    
    let customerId = '';
    
    // Verifica se já existe cliente no Asaas com este CPF
    const existingCustomer = await findCustomerByCpf(data.cpf);
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Atualizar dados cadastrais se necessário? (Pode ser adicionado no futuro)
    } else {
      // Cria novo Customer no Asaas
      const newCustomer = await createCustomer({
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpf,
        mobilePhone: data.phone,
        notificationDisabled: true, // Desabilitamos as do Asaas pois nós enviaremos os e-mails
      });
      customerId = newCustomer.id;
    }

    // 2. Busca os detalhes do Plano no Supabase para saber o valor correto
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', data.planId)
      .single();

    if (planError || !planData) {
      throw new Error('Plano selecionado não encontrado.');
    }

    const value = planData.amount;
    const cycle = planData.cycle; // 'MONTHLY', etc.
    const description = `Aliança dos Ventos — ${planData.name}`;

    // Data de vencimento = hoje (ou amanhã, depende da regra de negócios)
    // Para simplificar, colocamos hoje para cobrança imediata (Cartão/Pix)
    const nextDueDate = new Date().toISOString().split('T')[0];

    // 3. Tokenização do Cartão de Crédito (se for o caso)
    let creditCardTokenToUse = data.creditCardToken;
    
    if (data.paymentMethod === 'CREDIT_CARD' && data.creditCard && data.creditCardHolderInfo && !creditCardTokenToUse) {
      try {
        const tokenResponse = await tokenizeCreditCard(
          customerId,
          data.creditCard,
          data.creditCardHolderInfo
        );
        creditCardTokenToUse = tokenResponse.creditCardToken;
      } catch (tokenErr: any) {
        // Fallback: tentar enviar dados crus se não tivermos permissão de tokenização (para testes)
        // ATENÇÃO: Em produção o ideal é ter a permissão de tokenização.
        console.warn('Falha ao tokenizar cartão. Tentando enviar os dados de cartão diretamente para criar a subscription.', tokenErr);
      }
    }

    // 4. Cria a Subscription no Asaas
    const subscriptionPayload: any = {
      customer: customerId,
      billingType: data.paymentMethod,
      value: value,
      nextDueDate: nextDueDate,
      cycle: cycle,
      description: description,
    };

    if (data.paymentMethod === 'CREDIT_CARD') {
      if (creditCardTokenToUse) {
        subscriptionPayload.creditCardToken = creditCardTokenToUse;
      } else if (data.creditCard && data.creditCardHolderInfo) {
        // Fallback (dados crus do cartão) se a tokenização falhar e for ambiente seguro
        subscriptionPayload.creditCard = data.creditCard;
        subscriptionPayload.creditCardHolderInfo = data.creditCardHolderInfo;
      } else {
        throw new Error('Dados do cartão de crédito não fornecidos.');
      }
    }

    const subscriptionResponse = await createSubscription(subscriptionPayload);

    // 5. Salva (ou atualiza) o Subscriber no Supabase
    // Vamos garantir que ele tenha um usuário no auth.users
    let authUserId = null;
    
    // Tenta buscar o usuário no auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === data.email);
    
    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
    } else {
      // Cria o usuário silenciosamente (sem mandar e-mail de confirmação de signup)
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        email_confirm: true, // Já confirma o e-mail para não pedir confirmação dupla
      });
      if (!authError && newAuthUser.user) {
        authUserId = newAuthUser.user.id;
      }
    }

    // Primeiro tentamos ver se ele existe pelo CPF
    let subscriberId = '';
    const { data: existingSubscriber } = await supabaseAdmin
      .from('subscribers')
      .select('id')
      .eq('cpf', data.cpf)
      .single();

    // Status inicial depende do método de pagamento:
    // - CREDIT_CARD: ativo imediatamente (Asaas cobra na hora)
    // - PIX / BOLETO: pendente até o webhook confirmar o pagamento
    const initialStatus = data.paymentMethod === 'CREDIT_CARD' ? 'active' : 'pending_payment';

    if (existingSubscriber) {
      subscriberId = existingSubscriber.id;
      // Atualiza o plan_id, status e auth_user_id
      await supabaseAdmin
        .from('subscribers')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          asaas_customer_id: customerId,
          plan_id: data.planId,
          status: initialStatus,
          auth_user_id: authUserId,
        })
        .eq('id', subscriberId);
    } else {
      // Cria novo subscriber
      const { data: newSubscriber, error: subError } = await supabaseAdmin
        .from('subscribers')
        .insert({
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          asaas_customer_id: customerId,
          plan_id: data.planId,
          status: initialStatus,
          auth_user_id: authUserId,
        })
        .select('id')
        .single();
        
      if (subError) throw subError;
      subscriberId = newSubscriber.id;
    }

    // 6. Salva a Subscription no Supabase
    // O Asaas sempre retorna a "Subscription" como ACTIVE logo na criação, 
    // mas para nós ela só está ativa se o método for cartão. Para PIX/Boleto, é PENDING.
    const initialSubStatus = initialStatus === 'pending_payment' ? 'PENDING' : 'ACTIVE';

    await supabaseAdmin
      .from('subscriptions')
      .insert({
        subscriber_id: subscriberId,
        asaas_subscription_id: subscriptionResponse.id,
        payment_method: data.paymentMethod,
        status: initialSubStatus,
        next_due_date: subscriptionResponse.nextDueDate,
      });

    // 7. Busca o Payment gerado (se for PIX ou BOLETO) para exibir as instruções
    let pixQrCode = null;
    let boletoUrl = null;
    let paymentId = null;

    if (data.paymentMethod === 'PIX' || data.paymentMethod === 'BOLETO') {
      // Como a subscription acabou de ser criada, o Asaas gera um payment inicial
      // Precisamos buscar os payments dessa subscription
      const { listSubscriptionPayments, getPixQrCode } = await import('@/lib/asaas');
      const paymentsResponse = await listSubscriptionPayments(subscriptionResponse.id);
      
      if (paymentsResponse.data && paymentsResponse.data.length > 0) {
        const firstPayment = paymentsResponse.data[0];
        paymentId = firstPayment.id;

        if (data.paymentMethod === 'PIX') {
          try {
            pixQrCode = await getPixQrCode(firstPayment.id);
          } catch (err) {
            console.error('Erro ao buscar QR Code PIX. Chave PIX cadastrada no Sandbox?', err);
          }
        } else if (data.paymentMethod === 'BOLETO') {
          boletoUrl = firstPayment.bankSlipUrl;
        }
      }
    }

    // 8. Retorna a resposta
    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionResponse.id,
      paymentId,
      pixQrCode,
      boletoUrl
    });

  } catch (error: any) {
    console.error('[API Create Subscription Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
