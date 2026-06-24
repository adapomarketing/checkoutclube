// ============================================================
// Asaas API Service Layer
// Encapsula todas as chamadas à API do Asaas para facilitar
// manutenção e centralizar tratamento de erros.
// ============================================================

import type {
  AsaasCustomerRequest,
  AsaasCustomerResponse,
  AsaasSubscriptionRequest,
  AsaasSubscriptionResponse,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
  AsaasBoletoResponse,
  AsaasError,
} from '@/types';

// ------ Configuração ------

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

if (!ASAAS_API_KEY) {
  console.warn(
    '[Asaas] ⚠️  ASAAS_API_KEY não configurada. Defina no .env.local.'
  );
}

// ------ Helper de requisição ------

async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ASAAS_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as AsaasError;
    const errorMessage =
      error.errors?.map((e) => e.description).join(', ') ||
      `Erro ${response.status} ao chamar Asaas`;
    console.error(`[Asaas] Erro em ${endpoint}:`, errorMessage);
    throw new Error(errorMessage);
  }

  return data as T;
}

// ------ Customers ------

/**
 * Cria um novo Customer no Asaas.
 * O CPF/CNPJ é obrigatório e deve ser enviado sem máscara.
 */
export async function createCustomer(
  customer: AsaasCustomerRequest
): Promise<AsaasCustomerResponse> {
  return asaasRequest<AsaasCustomerResponse>('/v3/customers', {
    method: 'POST',
    body: JSON.stringify({
      ...customer,
      notificationDisabled: customer.notificationDisabled ?? true,
    }),
  });
}

/**
 * Busca um Customer pelo CPF/CNPJ para evitar duplicação.
 */
export async function findCustomerByCpf(
  cpfCnpj: string
): Promise<AsaasCustomerResponse | null> {
  const data = await asaasRequest<{ data: AsaasCustomerResponse[] }>(
    `/v3/customers?cpfCnpj=${cpfCnpj}`
  );
  return data.data.length > 0 ? data.data[0] : null;
}

/**
 * Busca um Customer pelo e-mail.
 */
export async function findCustomerByEmail(
  email: string
): Promise<AsaasCustomerResponse | null> {
  const data = await asaasRequest<{ data: AsaasCustomerResponse[] }>(
    `/v3/customers?email=${encodeURIComponent(email)}`
  );
  return data.data.length > 0 ? data.data[0] : null;
}

// ------ Subscriptions ------

/**
 * Cria uma nova Subscription (assinatura recorrente).
 * Para cartão de crédito, enviar creditCard ou creditCardToken.
 */
export async function createSubscription(
  subscription: AsaasSubscriptionRequest
): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>('/v3/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}

/**
 * Recupera uma Subscription pelo ID.
 */
export async function getSubscription(
  subscriptionId: string
): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>(
    `/v3/subscriptions/${subscriptionId}`
  );
}

/**
 * Cancela (remove) uma Subscription.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ deleted: boolean; id: string }> {
  return asaasRequest<{ deleted: boolean; id: string }>(
    `/v3/subscriptions/${subscriptionId}`,
    { method: 'DELETE' }
  );
}

/**
 * Lista as cobranças de uma Subscription.
 */
export async function listSubscriptionPayments(
  subscriptionId: string
): Promise<{ data: AsaasPaymentResponse[] }> {
  return asaasRequest<{ data: AsaasPaymentResponse[] }>(
    `/v3/subscriptions/${subscriptionId}/payments`
  );
}

// ------ Payments ------

/**
 * Recupera uma cobrança pelo ID.
 */
export async function getPayment(
  paymentId: string
): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(`/v3/payments/${paymentId}`);
}

/**
 * Obtém o QR Code Pix de uma cobrança.
 * Requer chave Pix cadastrada na conta (inclusive no sandbox).
 */
export async function getPixQrCode(
  paymentId: string
): Promise<AsaasPixQrCodeResponse> {
  return asaasRequest<AsaasPixQrCodeResponse>(
    `/v3/payments/${paymentId}/pixQrCode`
  );
}

/**
 * Obtém a linha digitável do boleto de uma cobrança.
 */
export async function getBoletoIdentification(
  paymentId: string
): Promise<AsaasBoletoResponse> {
  return asaasRequest<AsaasBoletoResponse>(
    `/v3/payments/${paymentId}/identificationField`
  );
}

// ------ Tokenização de Cartão ------

/**
 * Tokeniza um cartão de crédito.
 * NOTA: Este recurso pode precisar ser habilitado pelo suporte Asaas.
 * Em caso de erro de permissão, contate integracoes@asaas.com.br
 */
export async function tokenizeCreditCard(
  customerId: string,
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  },
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  }
): Promise<{ creditCardNumber: string; creditCardBrand: string; creditCardToken: string }> {
  return asaasRequest<{
    creditCardNumber: string;
    creditCardBrand: string;
    creditCardToken: string;
  }>('/v3/creditCard/tokenize', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      creditCard,
      creditCardHolderInfo,
    }),
  });
}

// ------ Sandbox Helpers ------

/**
 * [SANDBOX ONLY] Confirma o pagamento de uma cobrança.
 * Útil para simular PAYMENT_RECEIVED em testes.
 */
export async function sandboxConfirmPayment(
  paymentId: string
): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(
    `/v3/payments/${paymentId}/receiveInCash`,
    {
      method: 'POST',
      body: JSON.stringify({
        paymentDate: new Date().toISOString().split('T')[0],
        value: 0, // 0 = usa o valor original
      }),
    }
  );
}

/**
 * [SANDBOX ONLY] Força o vencimento de uma cobrança.
 * Útil para simular PAYMENT_OVERDUE em testes.
 */
export async function sandboxForceOverdue(
  paymentId: string
): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(
    `/v3/payments/${paymentId}/overdue`,
    { method: 'POST' }
  );
}
