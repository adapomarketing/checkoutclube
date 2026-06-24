-- ============================================================
-- Migration 002: webhook_logs
-- Registra todos os eventos de webhook recebidos do Asaas
-- para auditoria, debug e reprocessamento.
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  asaas_customer_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription_id ON webhook_logs(asaas_subscription_id);

-- RLS: apenas service_role pode ler/escrever (tabela interna de sistema)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role gerencia webhook_logs"
  ON webhook_logs FOR ALL
  USING (auth.role() = 'service_role');
