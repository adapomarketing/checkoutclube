// ============================================================
// Validações Zod para formulários de checkout
// ============================================================

import { z } from 'zod';

// ------ Helpers ------

/**
 * Remove caracteres não numéricos de uma string.
 */
function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF usando o algoritmo oficial.
 */
function isValidCPF(cpf: string): boolean {
  const cleaned = onlyNumbers(cpf);
  if (cleaned.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

// ------ Schemas ------

export const checkoutFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),

  email: z
    .string()
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo'),

  cpf: z
    .string()
    .transform(onlyNumbers)
    .refine((val) => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine(isValidCPF, 'CPF inválido'),

  phone: z
    .string()
    .optional()
    .transform((val) => (val ? onlyNumbers(val) : undefined))
    .refine(
      (val) => !val || (val.length >= 10 && val.length <= 11),
      'Telefone deve ter 10 ou 11 dígitos'
    ),

  planId: z
    .string()
    .uuid('Plano inválido'),

  paymentMethod: z
    .enum(['CREDIT_CARD', 'PIX', 'BOLETO'], {
      error: 'Selecione um método de pagamento',
    }),
});

export const creditCardSchema = z.object({
  holderName: z
    .string()
    .min(3, 'Nome no cartão deve ter pelo menos 3 caracteres'),

  number: z
    .string()
    .transform(onlyNumbers)
    .refine((val) => val.length >= 13 && val.length <= 19, 'Número de cartão inválido'),

  expiryMonth: z
    .string()
    .refine((val) => {
      const month = parseInt(val);
      return month >= 1 && month <= 12;
    }, 'Mês inválido'),

  expiryYear: z
    .string()
    .refine((val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= currentYear && year <= currentYear + 20;
    }, 'Ano inválido'),

  ccv: z
    .string()
    .refine((val) => val.length >= 3 && val.length <= 4, 'CVV inválido'),
});

export const creditCardHolderInfoSchema = z.object({
  postalCode: z
    .string()
    .transform(onlyNumbers)
    .refine((val) => val.length === 8, 'CEP deve ter 8 dígitos'),

  addressNumber: z
    .string()
    .min(1, 'Número do endereço é obrigatório'),
});

// ------ Types derivados dos schemas ------

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CreditCardValues = z.infer<typeof creditCardSchema>;
export type CreditCardHolderInfoValues = z.infer<typeof creditCardHolderInfoSchema>;
