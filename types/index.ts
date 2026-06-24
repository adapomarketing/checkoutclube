// ============================================================
// Tipos TypeScript para o projeto Aliança dos Ventos
// ============================================================

// ------ Supabase / Domain Models ------

export type SubscriberStatus = 'active' | 'paused' | 'cancelled' | 'overdue';

export type SubscriptionStatus = 'ACTIVE' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

export type PlanCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type ContentType = 'report' | 'photo' | 'video' | 'letter';

export interface Plan {
  id: string;
  name: string;
  amount: number;
  cycle: PlanCycle;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  asaas_customer_id: string | null;
  plan_id: string | null;
  status: SubscriberStatus;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  asaas_subscription_id: string | null;
  payment_method: PaymentMethod;
  status: SubscriptionStatus;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExclusiveContent {
  id: string;
  title: string;
  type: ContentType;
  storage_path: string | null;
  url: string | null;
  published_at: string | null;
  min_plan_amount: number;
  created_at: string;
  updated_at: string;
}

// ------ Asaas API Types ------

export interface AsaasCustomerRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  notificationDisabled?: boolean;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string | null;
  dateCreated: string;
  object: string;
}

export interface AsaasSubscriptionRequest {
  customer: string;
  billingType: PaymentMethod;
  value: number;
  nextDueDate: string;
  cycle: PlanCycle;
  description?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  creditCardToken?: string;
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: PaymentMethod;
  value: number;
  nextDueDate: string;
  cycle: PlanCycle;
  status: string;
  description: string | null;
  dateCreated: string;
  object: string;
}

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  subscription: string | null;
  billingType: PaymentMethod;
  value: number;
  netValue: number;
  status: string;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  invoiceNumber: string | null;
  object: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface AsaasBoletoResponse {
  identificationField: string;
  nossoNumero: string;
  barCode: string;
}

// ------ Asaas Webhook Types ------

export type AsaasWebhookEvent =
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REFUNDED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED';

export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent;
  payment?: AsaasWebhookPayment;
}

export interface AsaasWebhookPayment {
  id: string;
  customer: string;
  subscription: string | null;
  billingType: PaymentMethod;
  value: number;
  status: string;
  dueDate: string;
  paymentDate: string | null;
  confirmedDate: string | null;
  originalValue: number | null;
  netValue: number;
  description: string | null;
  externalReference: string | null;
  invoiceUrl: string;
}

// ------ Checkout Form Types ------

export interface CheckoutFormData {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  planId: string;
  paymentMethod: PaymentMethod;
  // Credit card fields (only when paymentMethod === 'CREDIT_CARD')
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    postalCode: string;
    addressNumber: string;
  };
}

export interface CreateSubscriptionRequest {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  planId: string;
  paymentMethod: PaymentMethod;
  creditCardToken?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  paymentId?: string;
  pixQrCode?: AsaasPixQrCodeResponse;
  boletoUrl?: string;
  boletoIdentificationField?: string;
  error?: string;
}

// ------ API Error Types ------

export interface AsaasError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
