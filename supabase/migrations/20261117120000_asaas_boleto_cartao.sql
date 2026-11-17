-- Assinatura recorrente no Asaas: boleto como 3ª forma e cartão digitado no próprio sistema.
-- O número do cartão e o CVV NUNCA são gravados: só o token que o Asaas devolve, os 4 últimos números e a bandeira.

alter table public.assinaturas drop constraint if exists assinaturas_forma_pagamento_check;
alter table public.assinaturas
  add constraint assinaturas_forma_pagamento_check check (forma_pagamento in ('PIX', 'CREDIT_CARD', 'BOLETO'));

alter table public.assinaturas
  add column if not exists cartao_token text,
  add column if not exists cartao_final text,
  add column if not exists cartao_bandeira text,
  -- Cartão recusado na renovação: avisa a oficina (continua usando até vencimento + 5 dias). Pagou: volta a vazio.
  add column if not exists cartao_recusado_em timestamptz;

-- Webhook responde na hora e processa depois: o evento que falhou fica sem processado_em
-- (com o erro anotado) e a rotina diária tenta de novo.
create index if not exists eventos_pagamento_pendentes on public.eventos_pagamento (recebido_em) where processado_em is null;
