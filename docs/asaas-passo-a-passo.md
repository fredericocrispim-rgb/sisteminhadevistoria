# Asaas: passo a passo (Vistoria Rápida)

Toda mensalidade é uma **assinatura mensal no Asaas**, paga por **Pix, cartão de crédito ou boleto**. O acesso é
liberado sozinho quando o pagamento cai (webhook). Sem a chave do Asaas configurada, tudo continua no Pix manual.

## O que o sistema faz

| Situação | O que acontece |
|---|---|
| Cadastro novo | No fim do cadastro, "Escolher como pagar" → Pix, cartão ou boleto → CPF/CNPJ → (cartão) dados do cartão |
| Pagou | Acesso liberado até o próximo vencimento + 5 dias de tolerância |
| Venceu sem pagar | Aviso no Início e em Meu plano; usa por mais 5 dias; bloqueia no 6º dia |
| Cartão recusado na renovação | Aviso "O cartão não passou"; mesma tolerância de 5 dias; pode trocar o cartão e pagar na hora |
| Pagou depois de bloqueado | Libera na hora |
| Estorno ou contestação no cartão | Bloqueia na hora (você libera no /admin, se resolver) |
| Cancelou | Usa até o fim do período já pago; nada é apagado |
| Equipe aumentou ou mudou de plano | O valor da assinatura no Asaas é atualizado sozinho |

Segurança:
- Chave da API e token do webhook ficam **só** nas variáveis de ambiente do servidor.
- O número do cartão e o CVV **nunca** são gravados. Ficam guardados só o token do Asaas, os 4 últimos números e a bandeira.
- O registro (log) das chamadas ao Asaas mostra só o caminho e o resultado, nunca os dados do cartão.

## Arquivos

| O quê | Onde |
|---|---|
| Banco (migrações) | `supabase/migrations/20261030200000_asaas.sql` e `20261117120000_asaas_boleto_cartao.sql` |
| Formas de pagamento e regras | `lib/pagamentos/config.ts` (preços continuam na tabela `planos`) |
| Conversa com a API do Asaas (só servidor) | `lib/pagamentos/asaas.ts` |
| Conferência e máscara do cartão | `lib/pagamentos/cartao.ts` (+ `cartao.test.ts`) |
| Regras do webhook (testadas) | `lib/pagamentos/webhook.ts` (+ `webhook.test.ts`) |
| Gravação no banco (pago, atraso, recusa, estorno, cancelamento) | `lib/pagamentos/servidor.ts` |
| Migração dos clientes do Pix manual | `lib/pagamentos/migrar.ts` + botão no `/admin` (`app/admin/migrar-asaas.tsx`) |
| Webhook (responde na hora, processa depois) | `app/api/webhooks/asaas/route.ts` → `POST /api/webhooks/asaas` |
| Rotina diária (tenta de novo avisos que falharam) | `app/api/rotinas/asaas/route.ts` (9h todo dia, `vercel.json`) |
| Assinar (forma → CPF/CNPJ → cartão) | `app/(app)/assinar/` → `/assinar` |
| Tela da cobrança (QR Code, boleto, cartão) | `app/(app)/pagamento/[id]/` → `/pagamento/[id]` |
| Minha assinatura | `app/(app)/plano/` → `/plano` |
| Trocar forma de pagamento ou cartão | `app/(app)/plano/forma/` → `/plano/forma` |
| Regra de acesso | `lib/sessao.ts` (`situacaoPlano`) |

## 1. Aplicar as migrações no banco (ANTES de pôr o código no ar)

Primeiro no projeto de teste ("vistoria-teste"), depois no real. No terminal, dentro da pasta do projeto:

```bash
npm run banco:conectar
```

```bash
npm run banco:aplicar
```

Sem a migração `20261117120000_asaas_boleto_cartao.sql`, a assinatura não fica salva no sistema.

## 2. Conta de testes (sandbox)

1. Crie a conta em https://sandbox.asaas.com (é separada da conta real).
2. **Integrações > Chaves de API > Gerar chave**. Copie (começa com `$aact_hmlg_`).
3. Cadastre uma **chave Pix** no sandbox. Sem ela, o Asaas troca Pix por boleto e o sistema avisa "Pix indisponível".

## 3. Webhook no painel do Asaas

**Integrações > Webhooks > Adicionar**:

- **Nome:** Vistoria Rápida
- **URL:** `https://www.vistoriarapida.digital/api/webhooks/asaas` (no teste, o endereço do ambiente de teste da Vercel)
- **E-mail:** o seu (o Asaas avisa se o webhook falhar)
- **Versão da API:** v3
- **Token de autenticação:** a MESMA senha de `ASAAS_WEBHOOK_TOKEN` (32 a 255 letras/números, sem espaço)
- **Fila ativada:** sim · **Tipo de envio:** sequencial
- **Eventos:** marque todos de **Cobranças** (PAYMENT_…) e de **Assinaturas** (SUBSCRIPTION_…). Os que o sistema usa:
  `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
  `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`,
  `PAYMENT_CHARGEBACK_REQUESTED`, `SUBSCRIPTION_DELETED`, `SUBSCRIPTION_INACTIVATED`.

## 4. Avisos para o cliente (e-mail e WhatsApp)

**Clientes > Notificações** (padrão da conta): ligue os avisos de **cobrança criada**, **vencendo**, **vencida** e
**pagamento confirmado** por **e-mail**, **SMS** e **WhatsApp**. O WhatsApp do Asaas é cobrado à parte; confira o
preço antes de ligar. O sistema já cria cada cliente com os avisos ligados.

## 5. Variáveis na Vercel

**Vercel > projeto > Settings > Environment Variables**. Separe teste e produção:

| Variável | Preview (teste) | Production (real) |
|---|---|---|
| `ASAAS_API_KEY` | chave do sandbox (`$aact_hmlg_…`) | chave de produção (`$aact_prod_…`) |
| `ASAAS_BASE_URL` | `https://api-sandbox.asaas.com/v3` | `https://api.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | uma senha | OUTRA senha |
| `ASAAS_SO_OFICINAS` | vazio | ids das oficinas de teste no começo; depois vazio (todas) |
| `APP_URL` | endereço do teste | `https://www.vistoriarapida.digital` |
| `CRON_SECRET` | uma senha | uma senha (a Vercel usa sozinha na rotina diária) |

Depois: **Deployments > Redeploy**.

## 6. Testes no sandbox (lista)

Cartões de teste: página "Testando pagamentos com cartão" da documentação do Asaas (tem número aprovado e recusado).
CPF de teste: qualquer CPF válido (ex.: gerador de CPF).

**Assinar**
- [ ] Cadastro novo até o fim → "Escolher como pagar" abre a tela de forma de pagamento.
- [ ] **Pix:** escolher Pix → CPF → "Gerar o Pix". A tela mostra o QR Code e o copia e cola. No painel do sandbox,
      **Confirmar pagamento** da cobrança → a tela mostra "Pagamento confirmado!" sozinha e abre o sistema.
- [ ] **Boleto:** escolher Boleto → "Gerar o boleto". Aparecem "Abrir o boleto" e a linha digitável (Copiar a linha).
      Confirmar pagamento no painel → libera.
- [ ] **Cartão aprovado:** escolher Cartão → CPF → dados do cartão → "Pagar agora". Mostra "Pagamento confirmado!".
      Em Meu plano aparece "Cartão final XXXX".
- [ ] **Cartão recusado:** usar o cartão de teste recusado. Aparece "O cartão não passou: …"; o código de segurança é
      apagado; dá para tentar de novo com outro cartão.
- [ ] No banco (tabela `assinaturas`): `id_cliente_externo` (cus_…), `id_assinatura_externa` (sub_…), `forma_pagamento`,
      `proximo_vencimento`, `cartao_final`. Não existe número de cartão em lugar nenhum.

**Webhook e acesso**
- [ ] Reenviar um evento pelo painel do Asaas → responde 200 e nada muda em dobro.
- [ ] Vencer uma cobrança (mudar a data no sandbox) → aviso de atraso; continua usando; no 6º dia, bloqueia.
- [ ] Pagar a cobrança vencida depois do bloqueio → libera na hora.
- [ ] Cartão recusado na renovação (no sandbox, cobrança da assinatura com cartão recusado) → aviso "O cartão não passou"
      no Início e em Meu plano, com a data limite.
- [ ] Estornar um pagamento no painel → bloqueia.
- [ ] Logs da Vercel: aparecem "Asaas: POST /subscriptions -> 200", "Webhook Asaas: recebido…", "…processado", sem dados do cartão.

**Minha assinatura**
- [ ] Histórico de pagamentos com Recibo/Fatura.
- [ ] Trocar forma de pagamento: Cartão → Pix (com cobrança em aberto vai para o QR Code); Pix → Boleto.
- [ ] Trocar o cartão com mensalidade vencida → "Pagar R$ … com o cartão" paga na hora e libera.
      (Usa o recurso "pagar cobrança com cartão" do Asaas: conferir com atenção.)
- [ ] Trocar o cartão sem nada vencido → "Cartão salvo".
- [ ] Mudar para o plano Pro → o valor da assinatura muda no Asaas.
- [ ] Cadastrar uma pessoa a mais que o plano inclui → valor muda no Asaas.
- [ ] Cancelar → "Assinatura cancelada · Você usa até DD/MM"; a assinatura some no Asaas.

**Clientes do Pix manual**
- [ ] Oficina de teste no Pix manual, plano em dia, com CPF/CNPJ → no `/admin` aparece "1 pronta para passar".
      Tocar em "Passar" → confirmar → no Asaas aparece a assinatura no Pix com vencimento = fim do período pago.
- [ ] Oficina sem CPF/CNPJ → em Meu plano, aviso "Seu plano está pago até…" e botão "Escolher como pagar";
      a 1ª cobrança automática vence no fim do período pago.

**Rotina diária**
- [ ] Na Vercel, **Settings > Cron Jobs** mostra `/api/rotinas/asaas`. "Run" manual responde `ok: true`.

## 7. Ligar em produção

- [ ] Conta real do Asaas aprovada (documentos enviados) e chave Pix cadastrada.
- [ ] Todos os testes do passo 6 feitos no sandbox, sem erro.
- [ ] Migrações aplicadas no banco real (passo 1).
- [ ] Variáveis de **Production** na Vercel (passo 5), com a chave `$aact_prod_…`.
- [ ] Webhook criado na conta **real** com o mesmo token de produção (passo 3).
- [ ] Avisos para o cliente ligados na conta real (passo 4).
- [ ] Redeploy e um pagamento real pequeno de ponta a ponta (e estorno pelo painel, se quiser).
- [ ] No `/admin`, passar os clientes do Pix manual (20 por vez).
- [ ] Nos primeiros dias, olhar **Integrações > Webhooks > Logs** no Asaas: a fila deve estar sem erros.

## Como funciona por dentro (resumo)

- Só o pagamento confirmado libera: o webhook, ou "Já paguei" / a tela da cobrança, que perguntam ao Asaas pelo servidor.
- O webhook confere o token, grava o evento (único pelo id, então repetido não vale) e responde 200 na hora; o
  processamento roda logo depois. Se falhar, o evento fica pendente com o erro anotado e a rotina diária tenta de novo.
- O bloqueio não depende de rotina: a regra de acesso confere a data do vencimento a cada página aberta.
- A oficina é achada pelo id da assinatura (`payment.subscription`) e, na falta dele, pelo `externalReference` (id da oficina).
- Comissão do vendedor: criada na primeira confirmação de cada pagamento.
- O "Marcar como pago" do `/admin` continua funcionando para quem ainda paga no Pix manual.
