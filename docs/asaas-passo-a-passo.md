# Asaas — passo a passo (Vistoria Rápida)

A mensalidade passa a ser paga pelo Asaas (Pix ou cartão de crédito). O acesso é liberado sozinho quando o Asaas avisa o
sistema (webhook). Enquanto a chave do Asaas não estiver configurada, tudo continua no Pix manual de hoje.

## O que foi feito (arquivos)

| O quê | Onde |
|---|---|
| Banco (migração) | `supabase/migrations/20261030200000_asaas.sql` |
| Configuração (formas, ciclo, regras dos planos) | `lib/pagamentos/config.ts` (preços continuam na tabela `planos`) |
| Conversa com a API do Asaas (só servidor) | `lib/pagamentos/asaas.ts` |
| Regras do webhook (testadas) | `lib/pagamentos/webhook.ts` e `webhook.test.ts` |
| Gravação no banco (pago, atraso, estorno, cancelamento) | `lib/pagamentos/servidor.ts` |
| Webhook | `app/api/webhooks/asaas/route.ts` → `POST /api/webhooks/asaas` |
| Tela Assinar | `app/(app)/assinar/` → `/assinar` |
| Tela do Pix (confere a cada 3 s, "Já paguei") | `app/(app)/pagamento/[id]/` → `/pagamento/[id]` |
| Minha assinatura (histórico, trocar Pix/cartão, cancelar) | `app/(app)/plano/` → `/plano` |
| Regra de acesso (`temAssinaturaAtiva`) | `lib/sessao.ts` |

Tabelas: aproveitamos as que já existiam (`assinaturas`, `faturas`, `eventos_pagamento`), em vez de criar outras repetidas.

## 1. Aplicar a migração no banco

No terminal, dentro da pasta do projeto:

```bash
npm run banco:conectar
```

```bash
npm run banco:aplicar
```

## 2. Conta de testes (sandbox)

1. Crie a conta em https://sandbox.asaas.com (é separada da conta real).
2. Menu **Integrações > Chaves de API > Gerar chave**. Copie (começa com `$aact_hmlg_`).
3. No `.env.local`, preencha:
   - `ASAAS_API_KEY=` a chave copiada
   - `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3`
   - `ASAAS_WEBHOOK_TOKEN=` uma senha longa que você inventa (32 a 255 letras/números, sem espaço)
4. No sandbox, cadastre uma chave Pix (sem ela o QR Code não aparece no teste).

## 3. Webhook no painel do Asaas

**Integrações > Webhooks > Adicionar**:

- **Nome:** Vistoria Rápida
- **URL:** `https://www.vistoriarapida.digital/api/webhooks/asaas`
- **E-mail:** o seu (o Asaas avisa se o webhook falhar)
- **Versão da API:** v3
- **Token de autenticação:** a MESMA senha de `ASAAS_WEBHOOK_TOKEN`
- **Fila ativada:** sim · **Tipo de envio:** sequencial
- **Eventos:** marque todos de **Cobranças** (PAYMENT_…) e de **Assinaturas** (SUBSCRIPTION_…)

Para testar no computador, o sandbox precisa de um endereço público. O mais simples é testar na Vercel, com as
variáveis do sandbox (passo 5) e o webhook do sandbox apontando para o site.

## 4. Avisos de cobrança para o cliente

**Clientes > Notificações** (ou em cada cliente): deixe ligados os avisos de **cobrança criada**, **vencendo** e
**vencida** por **e-mail** e **SMS**. WhatsApp pelo Asaas é pago à parte; confira o preço no painel antes de ligar.
O sistema já cria o cliente com os avisos ligados.

## 5. Variáveis na Vercel

**Vercel > projeto > Settings > Environment Variables** (Production):

- `ASAAS_API_KEY`
- `ASAAS_BASE_URL`
- `ASAAS_WEBHOOK_TOKEN`
- `APP_URL=https://www.vistoriarapida.digital`

Depois disso, faça um novo deploy (Deployments > Redeploy).

## 6. Testes no sandbox (roteiro)

1. Entre como dono de uma oficina de teste > **Meu plano** > **Pagar: Pix ou cartão**.
2. **Pix:** escolha Pix, preencha o CPF de teste e toque **Ir para o pagamento**. No painel do sandbox, abra a
   cobrança e use **Confirmar pagamento**. Em poucos segundos a tela deve mostrar "Pagamento confirmado!".
3. **Cartão:** em outra oficina, escolha Cartão. Abre a fatura do Asaas; pague com um cartão de teste do sandbox
   (veja a página "Cartões de teste" da documentação do Asaas). Volte e confira Minha assinatura.
4. **Atraso:** no sandbox, force o vencimento de uma cobrança. A oficina passa a "em atraso", ainda usa por 5 dias.
5. **Cancelar:** em Minha assinatura > **Cancelar assinatura**. Continua usando até o fim do período pago.
6. **Equipe:** cadastre uma pessoa a mais que o plano inclui e confira se o valor da assinatura mudou no Asaas.
   (A documentação do Asaas não lista o campo "valor" na alteração; se não mudar, me avise.)
7. **Webhook repetido:** no painel do Asaas, reenvie um evento. Deve aparecer 200 e nada muda em dobro.

## 7. Checklist para ligar em produção

- [ ] Conta real do Asaas aprovada (documentos enviados) e chave Pix cadastrada.
- [ ] Testes do passo 6 feitos no sandbox, sem erro.
- [ ] Chave de **produção** gerada (começa com `$aact_prod_`).
- [ ] Na Vercel: `ASAAS_API_KEY` de produção, `ASAAS_BASE_URL=https://api.asaas.com/v3`, novo `ASAAS_WEBHOOK_TOKEN`.
- [ ] Webhook criado na conta **real** com a URL do site e o mesmo token; todos os eventos de Cobranças e Assinaturas.
- [ ] Domínio `vistoriarapida.digital` cadastrado em **Minha conta > Informações** (para voltar ao site depois do cartão).
- [ ] Avisos de cobrança ligados (passo 4).
- [ ] Redeploy na Vercel e um pagamento real pequeno de ponta a ponta (e estorno pelo painel, se quiser).
- [ ] No painel do Asaas, a fila do webhook sem erros (Integrações > Webhooks > Logs).

## Como funciona (resumo)

- Só o webhook (ou o botão "Já paguei", que pergunta ao Asaas pelo servidor) libera o acesso. Voltar da página de
  pagamento não libera nada.
- Pix: libera com o evento `PAYMENT_RECEIVED`. Cartão: libera com `PAYMENT_CONFIRMED` (o `RECEIVED` chega ~30 dias depois).
- Pago: acesso até o próximo vencimento + 5 dias de tolerância (`plataforma.dias_carencia`).
- Vencida: "em atraso", ainda usa até acabar a tolerância. Estorno ou contestação no cartão: bloqueia na hora.
- Cancelada: usa até o fim do período pago. Nada é apagado; `/verificar` continua funcionando sempre.
- Comissão do vendedor: criada na primeira confirmação de cada pagamento (como no "Marcar como pago").
- O "Marcar como pago" do `/admin` continua funcionando para quem paga no Pix manual.
- Pix Automático: não ligado. Fica preparado em `lib/pagamentos/config.ts`; é só pedir.
