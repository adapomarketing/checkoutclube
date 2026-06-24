# Instituto Ádapo — Aliança dos Ventos

**Plano de desenvolvimento do checkout de assinatura recorrente**

*Financiamento estrutural do Clube das Pipas via Asaas + Next.js + Supabase*

| Programa | Beneficiário | Gateway | Stack |
|---|---|---|---|
| Aliança dos Ventos | Clube das Pipas | Asaas (API v3) | Next.js + Supabase |

---

## Sumário

1. Contexto e objetivos
2. Arquitetura da solução
3. Modelagem de dados (Supabase)
4. Integração com a API Asaas
5. Plano de desenvolvimento em fases
   - Fase 1 — Fundação (Semana 1–2)
   - Fase 2 — Checkout e pagamento (Semana 3–4)
   - Fase 3 — Área do assinante (Semana 5–6)
   - Fase 4 — Automações e comunicação (Semana 7–8)
   - Fase 5 — Monitoramento e refinamento (Semana 9–10)
6. Estrutura de planos de assinatura
7. Requisitos de UX aplicados ao contexto Ádapo
8. Riscos e mitigações
9. Critérios de sucesso

---

## 1. Contexto e objetivos

O Clube das Pipas é uma iniciativa do Instituto Ádapo voltada ao desenvolvimento psicossocial e emocional de crianças e adolescentes de 7 a 13 anos da comunidade do Novo Angelim, com foco prioritário na "Vila Sapo".  Atuando como um terceiro pilar de  apoio à infância, não substituindo a responsabilidade da família ou da educação formal, mas estabelecendo uma iniciativa de contribuição mútua. O projeto utiliza o brincar como ferramenta tecnologia social, promovendo o ensino-aprendizagem por meio de atividades lúdicas, educativas e culturais. Ao estruturar um verdadeiro "Quintal Brincante" em um território periférico, o Clube garante um espaço seguro e de afeto que estimula habilidades sociais, criativas e emocionais. Para garantir a sustentabilidade financeira do projeto, o Instituto precisa de uma fonte estável de recursos destinados especificamente a despesas de estrutura e alimentação dos participantes.

O programa Aliança dos Ventos é a resposta a esse desafio: um modelo de assinatura recorrente em que apoiadores — pessoas físicas ou jurídicas — contribuem mensalmente com um valor fixo, tornando-se aliados formais do projeto. O nome evoca o caráter colaborativo e contínuo do vento que move as pipas.

**Objetivos do projeto**
- Criar uma página de checkout independente, sem depender de plataformas externas como Trackmob
- Processar assinaturas recorrentes via Asaas com cartão de crédito, Pix recorrente e boleto
- Registrar e gerenciar assinantes no Supabase para uso no painel ELO (ERP em desenvolvimento)
- Entregar confirmação por e-mail automatizada ao assinante após cadastro
- Criar área privada simples onde o assinante acessa relatórios e conteúdo exclusivo
- Garantir que os dados coletados respeitem a LGPD e sejam auditáveis

---

## 2. Arquitetura da solução

A solução é composta por quatro camadas que se comunicam de forma assíncrona, com o Asaas como fonte de verdade financeira e o Supabase como banco de dados central para a gestão de assinantes.

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Checkout, área do assinante, UX |
| Backend / API | Next.js Route Handlers (API Routes) | Intermediar chamadas ao Asaas, webhooks |
| Banco de dados | Supabase (PostgreSQL + Auth + Storage) | Assinantes, planos, conteúdo exclusivo |
| Pagamentos | Asaas API v3 (subscriptions + webhooks) | Cobrança recorrente, status, inadimplência |
| E-mail | Resend (ou SMTP do Supabase) | Confirmação, boas-vindas, relatórios |

**Fluxo macro do assinante:**

1. Visitante acessa `/alianca-dos-ventos`
2. Escolhe o plano de assinatura e preenche o formulário de checkout
3. Frontend envia dados para Route Handler `/api/subscription/create`
4. Route Handler cria Customer + Subscription na API Asaas
5. Route Handler cria registro na tabela `subscribers` do Supabase
6. Asaas dispara cobrança; ao confirmar, envia webhook para `/api/webhooks/asaas`
7. Webhook atualiza status no Supabase e dispara e-mail de boas-vindas
8. Assinante recebe acesso à área exclusiva `/minha-alianca`

---

## 3. Modelagem de dados (Supabase)

O esquema abaixo cobre os dados mínimos necessários para o funcionamento do checkout, gestão financeira e acesso à área exclusiva. Todas as tabelas incluem `created_at` e `updated_at` com padrão `now()`.

### Tabela: `subscribers`

| Campo | Tipo | Restrição | Descrição |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | Identificador único |
| name | text | NOT NULL | Nome completo |
| email | text | NOT NULL, UNIQUE | E-mail principal |
| cpf | text | NOT NULL, UNIQUE | CPF sem máscara — necessário para Asaas |
| phone | text | NULL | Telefone opcional |
| asaas_customer_id | text | UNIQUE | ID do Customer no Asaas |
| plan_id | uuid | FK → plans.id | Plano de assinatura ativo |
| status | text | NOT NULL | active \| paused \| cancelled \| overdue |
| auth_user_id | uuid | FK → auth.users.id | Vínculo com autenticação Supabase |
| created_at | timestamptz | default `now()` | Data de cadastro |

### Tabela: `plans`

| Campo | Tipo | Restrição | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do plano |
| name | text | NOT NULL | Ex: Aliado Semente, Aliado Raiz |
| amount | numeric | NOT NULL | Valor em reais (ex: 30.00) |
| cycle | text | NOT NULL | MONTHLY \| QUARTERLY \| YEARLY |
| description | text | NULL | Descrição do impacto do plano |
| active | boolean | default true | Disponível para novas assinaturas |

### Tabela: `subscriptions`

| Campo | Tipo | Restrição | Descrição |
|---|---|---|---|
| id | uuid | PK | ID interno |
| subscriber_id | uuid | FK → subscribers.id | Assinante vinculado |
| asaas_subscription_id | text | UNIQUE | ID da subscription no Asaas |
| payment_method | text | NOT NULL | CREDIT_CARD \| PIX \| BOLETO |
| status | text | NOT NULL | ACTIVE \| OVERDUE \| CANCELLED |
| next_due_date | date | NULL | Próxima data de cobrança |

### Tabela: `exclusive_content`

| Campo | Tipo | Restrição | Descrição |
|---|---|---|---|
| id | uuid | PK | ID do conteúdo |
| title | text | NOT NULL | Título do relatório / post |
| type | text | NOT NULL | report \| photo \| video \| letter |
| storage_path | text | NULL | Caminho no Supabase Storage |
| url | text | NULL | Link externo se não usar Storage |
| published_at | timestamptz | NULL | Data de publicação |
| min_plan_amount | numeric | default 0 | Valor mínimo para acesso ao conteúdo |

---

## 4. Integração com a API Asaas

O Asaas é um gateway de pagamentos que oferece suporte nativo a assinaturas recorrentes, cartão de crédito, Pix e boleto, com API REST bem documentada e ambiente sandbox. Para o Aliança dos Ventos, serão utilizados três recursos principais.

### 4.1 Criação de Customer

Cada assinante é cadastrado como um Customer no Asaas. O CPF é obrigatório e será explicado ao usuário no checkout. O Customer ID retornado é armazenado em `subscribers.asaas_customer_id` para todas as operações futuras.

```
POST /api/v3/customers
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "cpfCnpj": "12345678900",
  "mobilePhone": "98999999999"
}
```

### 4.2 Criação de Subscription

A subscription é criada imediatamente após o Customer. O campo `billingType` define o método de pagamento; `nextDueDate` define o início da cobrança; `cycle` define a periodicidade.

```
POST /api/v3/subscriptions
{
  "customer": "cus_000123456789",
  "billingType": "CREDIT_CARD",  // PIX | BOLETO
  "value": 50.00,
  "nextDueDate": "2026-07-01",
  "cycle": "MONTHLY",
  "description": "Alianca dos Ventos — Aliado Raiz"
}
```

### 4.3 Webhooks

O Asaas envia notificações de evento para a rota `/api/webhooks/asaas`. É essencial validar a autenticidade do webhook via token secreto configurado no painel Asaas. Os eventos principais a tratar são:

| Evento Asaas | Ação no sistema |
|---|---|
| PAYMENT_RECEIVED | Atualiza status para ACTIVE, dispara e-mail de confirmação |
| PAYMENT_OVERDUE | Marca assinante como overdue, envia e-mail de lembrete |
| PAYMENT_DELETED | Cancela acesso à área exclusiva |
| SUBSCRIPTION_CANCELLED | Atualiza status para CANCELLED, notifica equipe |
| PAYMENT_RESTORED | Reativa assinante após pagamento de fatura em atraso |

---

## 5. Plano de desenvolvimento em fases

O desenvolvimento está organizado em cinco fases. Cada fase entrega um incremento funcional que deve ser testado de crucial antes de seguir para a proxima.

### Fase 1 — Fundação
*· Setup de infraestrutura e ambiente*

**Entregas**
- Repositório Next.js 14 configurado com App Router, Tailwind CSS e TypeScript
- Projeto Supabase criado com as quatro tabelas do esquema (subscribers, plans, subscriptions, exclusive_content)
- Row Level Security (RLS) ativado: assinante só acessa seus próprios dados
- Variáveis de ambiente configuradas: `ASAAS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- Conta Asaas criada e ambiente sandbox ativo para testes
- Seed com os planos iniciais inserido no banco (tabela plans)
- Rota de webhook `/api/webhooks/asaas` criada com validação de token

**Critério de conclusão**
O banco está criado, as variáveis configuradas e um teste de criação de Customer no sandbox Asaas retorna 200 com ID válido.

### Fase 2 — Checkout e pagamento
*· Página de checkout e integração Asaas*

**Entregas**
- Página `/alianca-dos-ventos` com hero, apresentação do programa e seleção de plano
- Componente de seleção de plano com micro-copy de impacto por valor
- Formulário de checkout com os campos: Nome, E-mail, CPF (com justificativa inline), Telefone (opcional), Método de pagamento
- Lógica de cartão de crédito: tokenização via Asaas.js para nunca trafegar dados brutos no servidor
- Lógica de Pix: exibição de QR Code gerado pelo Asaas após criação da subscription
- Lógica de boleto: exibição de link para boleto gerado pelo Asaas
- Rota `/api/subscription/create`: cria Customer → cria Subscription → insere no Supabase
- Página de sucesso `/obrigado` com mensagem personalizada e próximos passos
- Testes completos em sandbox com os três métodos de pagamento

**Componentes Next.js**
- `app/(checkout)/alianca-dos-ventos/page.tsx` — página principal
- `components/checkout/PlanSelector.tsx` — seleção de plano com micro-copy
- `components/checkout/CheckoutForm.tsx` — formulário com validação Zod
- `components/checkout/PaymentMethodSelector.tsx` — cartão, Pix, boleto
- `app/api/subscription/create/route.ts` — Route Handler principal

**Critério de conclusão**
Um assinante de teste consegue completar o checkout em sandbox via cartão, recebe a subscription criada no Asaas e o registro aparece no Supabase com status ACTIVE.

### Fase 3 — Área do assinante
*· Autenticação e conteúdo exclusivo*

**Entregas**
- Autenticação via Supabase Auth: magic link por e-mail (sem senha — simplifica o onboarding)
- Middleware Next.js para proteger rotas `/minha-alianca/*`
- Página `/minha-alianca` — dashboard do assinante com: status da assinatura, próxima data de cobrança, botão de cancelamento
- Seção de conteúdo exclusivo: listagem de relatórios, fotos e vídeos com acesso por nível de plano
- Upload de conteúdo exclusivo via Supabase Storage (acesso apenas a assinantes ativos)
- URL pré-assinada gerada server-side para documentos no Storage — sem exposição pública de arquivos

**Critério de conclusão**
Assinante com status ACTIVE acessa `/minha-alianca` e visualiza o conteúdo exclusivo. Assinante com status CANCELLED é redirecionado para a página de reativação.

### Fase 4 — Automações e comunicação
*· E-mails e gestão de inadimplência*

**Entregas**
- E-mail de boas-vindas disparado via Resend após PAYMENT_RECEIVED (primeiro pagamento)
- E-mail de confirmação mensal resumindo o impacto da contribuição
- E-mail de lembrete para assinantes com status overdue (disparado via webhook PAYMENT_OVERDUE)
- E-mail de reativação com link direto para `/minha-alianca` após pagamento de fatura em atraso
- Página `/minha-alianca/cancelar` com confirmação e coleta de motivo (dados para análise de churn)
- Notificação interna para a equipe do Ádapo via e-mail quando um assinante cancela

**Templates de e-mail sugeridos**

| Template | Gatilho | Conteúdo principal |
|---|---|---|
| Boas-vindas | PAYMENT_RECEIVED (1º pagamento) | Carta da diretora + impacto do plano |
| Recibo mensal | PAYMENT_RECEIVED (recorrente) | Valor, data, atualização do projeto |
| Lembrete de atraso | PAYMENT_OVERDUE | Link de pagamento + mensagem gentil |
| Reativação | PAYMENT_RESTORED | Agradecimento + acesso reativado |
| Cancelamento | SUBSCRIPTION_CANCELLED | Agradecimento + convite para retornar |

**Critério de conclusão**
Todos os cinco templates disparados em sandbox com conteúdo correto. O cenário de inadimplência funciona: assinante overdue perde acesso, paga, e recupera acesso automaticamente.

### Fase 5 — Monitoramento e refinamento
*· Painel de gestão com acesso restrito a admin e lançamento (CRM)*

**Entregas**
- Painel de gestão: lista de assinantes com status, plano, método de pagamento e data de adesão
- Filtros por status (active, overdue, cancelled) e exportação CSV
- Métricas no painel: MRR (receita recorrente mensal), total de assinantes ativos, churn do mês
- Testes de carga e validação de segurança (injeção de SQL via Supabase RLS, validação de webhook token)
- Revisão de acessibilidade da página de checkout (contraste, navegação por teclado, atributos ARIA)
- Lançamento em produção com monitoramento de erros via Sentry ou Vercel logs

**Critério de conclusão**
Primeiro assinante real cadastrado em produção. Painel CRM administrativo exibe dados corretos. Equipe do Ádapo consegue acessar e exportar a lista de aliados de forma autônoma.

---

## 6. Estrutura de planos de assinatura

Os planos abaixo são uma sugestão inicial baseada nas boas práticas de ancoragem de valor. Os nomes remetem ao universo das pipas e do vento para manter coerência com a identidade do programa.

| Plano | Valor/mês | Equiv. diária | Micro-copy de impacto |
|---|---|---|---|
| Aliado Brisa | R$ 20,00 | R$ 0,66/dia | Garante a merenda de uma criança no Clube das Pipas por um mês |
| Aliado Vento *(pré-selecionado)* | R$ 50,00 | R$ 1,67/dia | Financia o material de uma oficina completa do projeto |
| Aliado Tempestade | R$ 100,00 | R$ 3,33/dia | Sustenta um encontro inteiro de atividades do Clube das Pipas |
| Aliado Furação | Outro valor | — | Para aliados que desejam contribuir com um valor personalizado |

**Nota sobre o plano pré-selecionado**
- O plano Aliado Vento (R$ 50) deve ser pré-selecionado no checkout como âncora — ele está posicionado como o mais popular e financia uma entrega tangível e comunicável
- O plano Aliado Brisa (R$ 20) aparece primeiro para não excluir doadores de menor capacidade
- O plano Aliado Tempestade (R$ 100) aparece por último como aspiracional
- Todos os planos oferecem os mesmos benefícios (confirmação + área exclusiva) — a diferença é apenas o impacto financiado

---

## 7. Requisitos de UX aplicados ao contexto Ádapo

A página do Aliança dos Ventos deve endereçar cada ponto de fricção identificado. A seguir, as decisões de design aplicadas a este projeto específico.

| Problema | Solução no Aliança dos Ventos | Como implementar |
|---|---|---|
| 5 campos obrigatórios — alta fricção | Apenas Nome, E-mail e CPF obrigatórios; telefone opcional | Atributo `required` apenas nos 3 campos essenciais |
| CPF sem justificativa | Tooltip/texto inline: "necessário para emitir seu recibo de doação" | Ícone `?` ao lado do label com popover |
| Opções de pagamento ocultas | Três ícones visuais selecionáveis: cartão, Pix, boleto | Componente `PaymentMethodSelector` com ícones SVG |
| Sem indicador de progresso | Stepper de 3 etapas: Plano → Seus dados → Pagamento | Componente `StepIndicator` com estados visual |
| Vídeo desvia atenção | Nenhum vídeo no checkout — depoimento em texto com foto | Card de depoimento estático abaixo do stepper |
| Sem prova social numérica | Contador de aliados ativos atualizado via Supabase `count()` | Server component que lê total de subscribers ativos |
| Sem impacto por valor | Micro-copy de impacto em cada botão de plano | Texto descritivo abaixo de cada card de plano |

---

## 8. Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Webhook Asaas não recebido (timeout, falha de rede) | 🟡 Média | Implementar reconciliação periódica: cron job que consulta o status das subscriptions via GET /subscriptions a cada 6h |
| CPF duplicado: mesmo assinante tenta se cadastrar duas vezes | 🔴 Alta | Verificar existência de subscriber com o mesmo e-mail ou CPF antes de criar Customer no Asaas; retornar mensagem de orientação |
| Chave de API Asaas exposta no frontend | 🔴 Alta | Chave NUNCA exposta ao cliente; todas as chamadas ao Asaas são feitas exclusivamente em Route Handlers server-side |
| Webhook falso: atacante envia payload fabricado | 🟡 Média | Validar o token secreto do webhook em cada requisição; rejeitar com 401 qualquer request sem o token correto no header |
| Supabase Storage com arquivos exclusivos acessíveis publicamente | 🔴 Alta | Bucket configurado como privado; acesso via URL pré-assinada gerada server-side com expiração de 1 hora |
| Mudança na API do Asaas (breaking change) | 🟢 Baixa | Encapsular todas as chamadas Asaas em um service layer (`lib/asaas.ts`) para facilitar atualização centralizada |
| Cancelamento em massa por falta de engajamento dos assinantes | 🟡 Média | E-mail mensal com atualização real do projeto; relatório fotográfico trimestral na área exclusiva; carta anual da equipe Ádapo |

---

## 9. Critérios de sucesso

Os critérios abaixo definem o que constitui um projeto bem-sucedido, divididos em dimensões técnica, de negócio e de experiência.

### 9.1 Critérios técnicos
- Checkout funcional em produção com os três métodos de pagamento
- Webhook processado corretamente para todos os cinco eventos Asaas documentados
- RLS ativo: nenhum assinante consegue acessar dados de outro via API
- Arquivos exclusivos inacessíveis sem URL pré-assinada válida
- Tempo de carregamento da página de checkout abaixo de 2s (Lighthouse Performance > 90)
- Zero erros 500 nos primeiros 30 dias de operação

### 9.2 Critérios de negócio (primeiros 90 dias)
- Pelo menos 30 assinantes ativos ao final do primeiro mês pós-lançamento
- MRR inicial de R$ 600,00 ou superior
- Taxa de conversão do checkout (visitantes → assinantes) acima de 8%
- Taxa de cancelamento mensal abaixo de 5%
- Taxa de inadimplência recuperada acima de 60% (assinantes overdue que pagam após lembrete)

### 9.3 Critérios de experiência
- Formulário de checkout concluído em menos de 3 minutos em teste com usuário real
- E-mail de boas-vindas recebido em até 5 minutos após confirmação de pagamento
- Assinante consegue acessar a área exclusiva sem suporte externo
- Equipe Ádapo consegue consultar e exportar lista de aliados sem auxílio técnico
