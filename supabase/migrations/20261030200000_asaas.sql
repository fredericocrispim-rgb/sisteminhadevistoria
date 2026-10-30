-- Cobrança recorrente pelo Asaas (Pix ou cartão de crédito), com liberação automática pelo webhook.
-- Aproveita as tabelas que já existiam desde o início (assinaturas, faturas, eventos_pagamento),
-- feitas com campos genéricos justamente para receber um provedor depois.
-- Quem paga pelo Pix manual continua igual (provedor = 'pix_manual'); quem assina pelo Asaas passa a 'asaas'.
--
-- Equivalência com o pedido:
--   assinatura PENDENTE  = status 'teste' (aguardando o 1º pagamento) — a oficina continua com o prazo que já tinha
--   assinatura ATIVA     = 'ativa'
--   assinatura ATRASADA  = 'em_atraso'
--   assinatura CANCELADA = 'cancelada' (usa até acesso_ate)
--   estorno/chargeback   = 'inadimplente' (bloqueia na hora)
--   asaas_customer_id    = assinaturas.id_cliente_externo
--   asaas_subscription_id = assinaturas.id_assinatura_externa
--   pagamentos           = faturas (id_externo = id da cobrança no Asaas)
--   eventos do webhook   = eventos_pagamento (único por provedor + id do evento)

alter table public.assinaturas
  add column forma_pagamento text check (forma_pagamento in ('PIX', 'CREDIT_CARD')),
  -- Até quando a oficina usa o sistema (vencimento do ciclo pago + dias de carência)
  add column acesso_ate date;

alter table public.faturas
  add column link_comprovante text;

alter table public.faturas drop constraint faturas_status_check;
alter table public.faturas
  add constraint faturas_status_check check (status in ('pendente', 'paga', 'vencida', 'cancelada', 'estornada'));

create unique index faturas_id_externo_unico on public.faturas (id_externo);
create index assinaturas_id_assinatura_externa on public.assinaturas (id_assinatura_externa) where id_assinatura_externa is not null;
