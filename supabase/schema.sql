-- ============================================================
-- Schema SQL — Aliança dos Ventos (Clube das Pipas)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão uuid (caso não esteja)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tabela: plans
-- Planos de assinatura disponíveis
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'MONTHLY',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Tabela: subscribers
-- Dados dos assinantes
-- ============================================================
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT NOT NULL UNIQUE,
  phone TEXT,
  asaas_customer_id TEXT UNIQUE,
  plan_id UUID REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  auth_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Tabela: subscriptions
-- Controle das assinaturas ativas
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  asaas_subscription_id TEXT UNIQUE,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  next_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Tabela: exclusive_content
-- Conteúdo exclusivo para assinantes
-- ============================================================
CREATE TABLE IF NOT EXISTS exclusive_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  storage_path TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  min_plan_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Trigger para atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exclusive_content_updated_at
  BEFORE UPDATE ON exclusive_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- Assinante só acessa seus próprios dados
-- ============================================================

-- Plans: leitura pública (qualquer visitante vê os planos)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planos são visíveis para todos"
  ON plans FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem modificar planos"
  ON plans FOR ALL
  USING (auth.role() = 'service_role');

-- Subscribers: apenas o próprio assinante
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assinante vê apenas seus dados"
  ON subscribers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role gerencia subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'service_role');

-- Subscriptions: apenas o próprio assinante
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assinante vê apenas suas assinaturas"
  ON subscriptions FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role gerencia subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Exclusive Content: apenas assinantes ativos com plano suficiente
ALTER TABLE exclusive_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assinante ativo acessa conteúdo do seu nível"
  ON exclusive_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscribers s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.auth_user_id = auth.uid()
        AND s.status = 'active'
        AND p.amount >= exclusive_content.min_plan_amount
    )
  );

CREATE POLICY "Service role gerencia conteúdo"
  ON exclusive_content FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Seed: Planos iniciais
-- ============================================================
INSERT INTO plans (name, amount, cycle, description, active) VALUES
  (
    'Aliado Brisa',
    20.00,
    'MONTHLY',
    'Garante a merenda de uma criança no Clube das Pipas por um mês',
    true
  ),
  (
    'Aliado Vento',
    50.00,
    'MONTHLY',
    'Financia o material de uma oficina completa do projeto',
    true
  ),
  (
    'Aliado Tempestade',
    100.00,
    'MONTHLY',
    'Sustenta um encontro inteiro de atividades do Clube das Pipas',
    true
  )
ON CONFLICT DO NOTHING;
