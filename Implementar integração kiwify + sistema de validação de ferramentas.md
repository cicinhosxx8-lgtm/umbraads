# Integração Kiwify + Sistema de Validação de Ferramentas

Guia completo para implementar ou estender a integração de pagamentos Kiwify e o controle de acesso por plano no projeto Fábrica de Prompts Virais.

---

## Visão Geral do Fluxo

```
Usuário clica "Assinar"
  ↓
/api/checkout/[plan] → gera URL kiwify com ?email= prefilled
  ↓
Kiwify processa pagamento
  ↓
POST https://fabricadeprompts.com/api/webhooks/kiwify?signature=<hmac-sha1>
  ↓
Handler valida assinatura → normaliza payload → processPaymentApproved()
  ↓
profiles.plan_type atualizado + payment_history inserido
  ↓
Usuário tem acesso às ferramentas do plano imediatamente
```

---

## 1. Produtos Kiwify (não alterar sem atualizar todos os arquivos)

| Plano | Preço | checkout_link (short ID) | Env var |
|-------|-------|--------------------------|---------|
| basico | R$ 29,90 | `yNRtzyS` | `KIWIFY_PRODUCT_ID_BASICO` |
| pro | R$ 59,90 | `Bfu0RCA` | `KIWIFY_PRODUCT_ID_PRO` |
| elite | R$ 97,00 | `2rfqC4Y` | `KIWIFY_PRODUCT_ID_ELITE` |

> O `checkout_link` é o ID curto visível na URL do produto na Kiwify (ex: `pay.kiwify.com.br/Bfu0RCA`). É esse ID que vem no campo `checkout_link` do webhook — NÃO o `Product.product_id`, que é um UUID interno não mapeável.

---

## 2. Webhook Kiwify — Formato Real

**Descoberto em Mai 2026** — difere completamente da documentação pública da Kiwify.

### Payload real recebido:
```json
{
  "order_id": "73a372a8-3e67-40f6-a05e-e270a6b0fc71",
  "order_status": "paid",
  "webhook_event_type": "order_approved",
  "checkout_link": "Bfu0RCA",
  "payment_method": "pix",
  "Customer": {
    "email": "usuario@email.com",
    "full_name": "Nome do Usuário"
  },
  "Product": {
    "product_id": "ace42610-5068-11f1-a2d5-51f538bb323a",
    "product_name": "Fábrica de Prompts Virais Pro"
  },
  "Commissions": {
    "charge_amount": 5990
  },
  "Subscription": {
    "next_payment": "2026-06-21T00:00:00.000Z",
    "plan": { "name": "Mensal" }
  }
}
```

### Campos críticos:
| Campo Kiwify | Uso interno | Observação |
|---|---|---|
| `order_id` | `kiwify_transaction_id` em `payment_history` | UUID único da transação |
| `checkout_link` | ID do plano para lookup | Short ID (ex: `Bfu0RCA`) |
| `Commissions.charge_amount` | `amount` | **Em centavos** — dividir por 100 |
| `Customer.email` | busca/criação do usuário | Case-sensitive no lookup |
| `webhook_event_type` | mapeado via `mapEventType()` | Ver tabela abaixo |
| `Product.product_id` | **NÃO USAR** | UUID interno da Kiwify, não mapeável |

### Mapeamento de eventos:
| `webhook_event_type` (Kiwify) | Evento interno | Handler chamado |
|---|---|---|
| `order_approved` | `purchase_approved` | `processPaymentApproved()` |
| `purchase_complete` | `purchase_approved` | `processPaymentApproved()` |
| `purchase_approved` | `purchase_approved` | `processPaymentApproved()` |
| `subscription_renewed` | `purchase_approved` | `processPaymentApproved()` |
| `purchase_refunded` | `refund` | `processRefund()` |
| `refund` | `refund` | `processRefund()` |
| `subscription_cancelled` | `subscription_cancelled` | `processSubscriptionCancelled()` |
| `subscription_cancellation` | `subscription_cancelled` | `processSubscriptionCancelled()` |
| `subscription_canceled` | `subscription_cancelled` | `processSubscriptionCancelled()` |

---

## 3. Validação da Assinatura

**Algoritmo:** HMAC-SHA1 (não SHA256)  
**Onde vem:** query param `?signature=` (não header)  
**Secret:** `KIWIFY_WEBHOOK_SECRET` no Vercel

```typescript
function validateSHA1(rawBody: string, signature: string): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET!
  const expected = createHmac('sha1', secret).update(rawBody).digest('hex')
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
}
```

O handler (`app/api/webhooks/kiwify/route.ts`) tenta 4 métodos em cascata:
1. `?signature=` query param — HMAC-SHA1 (**método real da Kiwify**)
2. Header `x-kiwify-token` — HMAC-SHA256 ou plain text
3. Headers `x-kiwify-signature` / `x-signature` — HMAC-SHA256
4. Corpo JSON campo `secret` ou `token` — plain text (testes internos)

O log `validationMethod` indica qual método validou.

---

## 4. Configuração no Painel Kiwify

**Onde:** Kiwify → Apps → Webhooks

| Campo | Valor correto |
|---|---|
| URL | `https://fabricadeprompts.com/api/webhooks/kiwify` |
| Token/Secret | valor de `KIWIFY_WEBHOOK_SECRET` |

> **Nunca usar** `umbra-copywriter.vercel.app` — a Kiwify não segue HTTP redirects.

---

## 5. Variáveis de Ambiente Necessárias

```bash
# Kiwify
KIWIFY_WEBHOOK_SECRET=          # secret configurado no painel Kiwify
KIWIFY_PRODUCT_ID_BASICO=yNRtzyS
KIWIFY_PRODUCT_ID_PRO=Bfu0RCA
KIWIFY_PRODUCT_ID_ELITE=2rfqC4Y

# Supabase (necessário para o webhook gravar no banco)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # obrigatório — bypass RLS para o webhook
```

> Variáveis do tipo "sensitive" no Vercel nunca retornam valor pela API/CLI — isso é comportamento esperado, não perda de dado. Verificar pela aba Environment Variables do painel web do Vercel.

---

## 6. Sistema de Validação de Ferramentas

### Arquivos envolvidos:
| Arquivo | Responsabilidade |
|---|---|
| `lib/toolsConfig.ts` | Array `TOOLS[]` com `allowedPlans` por ferramenta |
| `lib/toolsService.ts` | `requireToolAccess()`, `hasAccess()`, `getToolsWithAccess()` |
| `hooks/usePlanAccess.ts` | Hook client-side — chama `/api/tools` e retorna `{ plan, hasAccess }` |
| `app/api/tools/route.ts` | GET: lista ferramentas do usuário logado |

### Como funciona:
```typescript
// 1. toolsConfig.ts — define quem acessa o quê
export const TOOLS = [
  {
    id: 'fabrica-copy',
    name: 'Fábrica de Copy',
    allowedPlans: ['basico', 'pro', 'elite'],  // free NÃO tem acesso
  },
  {
    id: 'fabrica-roteiros',
    allowedPlans: ['free', 'basico', 'pro', 'elite'],  // todos têm acesso
  },
]

// 2. toolsService.ts — middleware para routes API Gemini
export async function requireToolAccess(toolId: string) {
  // lê sessão Supabase → profile.plan_type → checa toolsConfig
  // retorna 403 se não tem acesso
}

// 3. Nas route handlers das fábricas:
export async function POST(request: Request) {
  const accessError = await requireToolAccess('fabrica-copy')
  if (accessError) return accessError  // 403 automático
  // ... lógica da fábrica
}
```

### Hierarquia de planos:
```
free < basico < pro < elite
```
Definida em `PLAN_ORDER` no `lib/toolsConfig.ts`. Quando `allowedPlans` inclui `'pro'`, isso NÃO implica automaticamente que `elite` tem acesso — cada ferramenta lista explicitamente todos os planos com acesso.

---

## 7. O que Acontece no Banco ao Receber um Webhook

### Purchase approved (novo pagamento ou renovação):
```sql
-- profiles: atualiza plano
UPDATE profiles SET
  plan_type = 'pro',
  subscription_status = 'active',
  kiwify_product_id = 'Bfu0RCA',
  last_payment_date = NOW(),
  expires_at = NOW() + INTERVAL '30 days',
  payment_method = 'pix',
  updated_at = NOW()
WHERE id = '<user_id>';

-- payment_history: registra transação
INSERT INTO payment_history (
  user_id, kiwify_transaction_id, kiwify_product_id,
  plan_type, amount, currency, status, payment_method, webhook_data
) VALUES (
  '<user_id>', '<order_id>', 'Bfu0RCA',
  'pro', 59.90, 'BRL', 'completed', 'pix', '<payload_completo>'
);
```

### Usuário não encontrado no Supabase:
O handler **cria o usuário automaticamente** via `supabase.auth.admin.createUser()` + insert em `profiles`. Útil quando o cliente comprou antes de se cadastrar no site.

### Refund / Cancelamento:
```sql
UPDATE profiles SET
  plan_type = 'free',
  subscription_status = 'cancelled',
  kiwify_product_id = NULL
WHERE id = '<user_id>';
```
`payment_history` recebe status `'refunded'` (amount negativo) ou `'cancelled'` (amount 0), com `kiwify_transaction_id = 'refund_<order_id>'` ou `'cancel_<order_id>'`.

---

## 8. Adicionar um Novo Plano Kiwify

Checklist completo ao criar um 4º plano (ex: "enterprise"):

- [ ] Criar produto no painel Kiwify → copiar o `checkout_link` short ID
- [ ] Adicionar env var: `KIWIFY_PRODUCT_ID_ENTERPRISE=<short_id>` no Vercel + `.env.local`
- [ ] `lib/kiwifyService.ts` → adicionar `enterprise` em `buildPlans()` com `productId`, `price`, `name`, `checkoutUrl`
- [ ] `lib/toolsConfig.ts` → adicionar `'enterprise'` em `PLAN_ORDER` e em `allowedPlans[]` das ferramentas relevantes
- [ ] `lib/plans.ts` → adicionar configuração do plano
- [ ] `supabase/migrations/README.md` → atualizar tabela de planos
- [ ] `CLAUDE.md` → atualizar tabela "Sistema de Planos"
- [ ] Testar webhook local com `event: 'purchase_approved'` e `product.id: '<short_id>'`

---

## 9. Testar Localmente

Use o formato interno de teste (não requer assinatura real):

```bash
curl -X POST http://localhost:3000/api/webhooks/kiwify \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "hto1rvkqirc",
    "data": {
      "id": "test-txn-001",
      "customer": { "email": "test@example.com", "name": "Test User" },
      "amount": 59.90,
      "paymentMethod": "credit_card",
      "product": { "id": "Bfu0RCA", "name": "Pro" }
    }
  }'
```

> Emails com `example.com` ou `john.doe` são tratados como usuários de teste — o banco não é modificado.

**Para simular o payload real do Kiwify (com HMAC-SHA1):**
```bash
# Gerar assinatura
SECRET="hto1rvkqirc"
BODY='{"order_id":"test-001","webhook_event_type":"order_approved","checkout_link":"Bfu0RCA","Customer":{"email":"test@example.com","full_name":"Test"},"Commissions":{"charge_amount":5990}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha1 -hmac "$SECRET" | awk '{print $2}')

curl -X POST "http://localhost:3000/api/webhooks/kiwify?signature=$SIG" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

---

## 10. Diagnóstico de Falhas

### Webhook retornando 400 "Assinatura inválida"
1. Ver log Vercel: `[kiwify webhook] Assinatura inválida | qSig=... | secret_len=N`
   - `secret_len=0` → `KIWIFY_WEBHOOK_SECRET` não está setado no Vercel
   - `secret_len=N` mas qSig incorreto → secret diverge entre Vercel e painel Kiwify
2. Confirmar URL no painel Kiwify: deve ser `fabricadeprompts.com` (não `umbra-copywriter.vercel.app`)
3. Ver `validationMethod` no log de sucesso para identificar qual método está sendo usado

### Webhook retornando 400 "Produto não reconhecido"
- `product_id` no log é um UUID longo → o handler está usando `Product.product_id` em vez de `checkout_link`
- Verificar se o deploy do fix está ativo (commit `e71481d`)

### Usuário pagou mas plano não mudou
1. Consultar `payment_history` pelo email do usuário
2. Se não tem registro → webhook nunca chegou ou retornou erro
3. Se tem registro com `status = 'completed'` → bug no update de `profiles`
4. Correção manual via Supabase SQL Editor:
```sql
UPDATE profiles SET
  plan_type = 'pro',
  subscription_status = 'active',
  expires_at = NOW() + INTERVAL '30 days'
WHERE email = 'email@do.usuario';
```

### `expires_at` e controle de acesso
> **Atenção:** `expires_at` é gravado no banco mas **não é verificado** no controle de acesso atual (`toolsService.ts` / `usePlanAccess.ts`). Ao implementar, usar `expires_at > NOW()` como condição adicional ao `plan_type`.

---

## 11. Armadilhas Conhecidas

| Armadilha | Causa | Solução |
|---|---|---|
| Webhook falha silenciosamente | Kiwify não segue HTTP redirects | URL deve ser a final (`fabricadeprompts.com`) |
| Secret aparece vazio no Vercel | Variáveis "sensitive" nunca retornam valor pela API | Normal — verificar pelo painel web |
| `Product.product_id` é UUID | ID interno da Kiwify, não é o short ID | Usar sempre `checkout_link` para identificar o plano |
| `charge_amount` em centavos | Campo é inteiro (ex: `5990` = R$59,90) | Sempre dividir por 100 |
| Race condition em redeploy | Kiwify reenvia e novo deploy ainda não está READY | Aguardar READY no Vercel antes de reenviar |
| PowerShell não tem `??` | PS 5.1 não suporta null-coalescing | Usar `if/else` explícito |
| Kiwify cria usuário antes do cadastro | Cliente comprou mas ainda não tem conta no site | `processPaymentApproved` cria o usuário automaticamente |

---

## 12. Arquivos de Referência

| Arquivo | O que contém |
|---|---|
| `app/api/webhooks/kiwify/route.ts` | Handler do webhook — validação + normalização do payload |
| `lib/kiwifyService.ts` | `processPaymentApproved`, `processRefund`, `processSubscriptionCancelled`, `getPlanByProductId`, `generateCheckoutUrl` |
| `lib/toolsConfig.ts` | Array `TOOLS[]` com `allowedPlans` por ferramenta |
| `lib/toolsService.ts` | `requireToolAccess()` — middleware para routes Gemini |
| `hooks/usePlanAccess.ts` | Hook React client-side para verificar acesso |
| `supabase/migrations/README.md` | Estrutura das tabelas `profiles` e `payment_history` |
