-- =====================================================================
-- Decisão do Frederico (28/10/2026): COMISSÃO DE VENDA
-- Quem vendeu a oficina recebe 50% de cada pagamento que entrar dela.
-- O Frederico marca o vendedor de cada oficina no /admin; ao "Marcar como pago",
-- a comissão é criada sozinha (a pagar). No relatório ele filtra e marca como paga.
-- Só o servidor (chave secreta) lê estas tabelas: RLS ligada e sem regra para o público.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(nome) between 2 and 120),
  whatsapp text check (length(whatsapp) <= 30),
  pix_chave text check (length(pix_chave) <= 120),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.vendedores enable row level security;

-- Quem vendeu cada oficina (vazio = venda do próprio Frederico, sem comissão)
alter table public.empresas add column if not exists vendedor_id uuid references public.vendedores (id) on delete set null;

-- Percentual da comissão (fica na plataforma, nunca fixo no código)
alter table public.plataforma add column if not exists comissao_percentual numeric(5, 2) not null default 50
  check (comissao_percentual between 0 and 100);

-- Uma comissão por pagamento recebido
create table if not exists public.comissoes (
  id uuid primary key default gen_random_uuid(),
  fatura_id uuid not null unique references public.faturas (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  vendedor_id uuid not null references public.vendedores (id) on delete restrict,
  valor_recebido numeric(10, 2) not null,
  recebido_em timestamptz not null, -- quando o Pix da oficina entrou (filtro por mês)
  percentual numeric(5, 2) not null,
  valor numeric(10, 2) not null check (valor >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'paga', 'cancelada')),
  paga_em timestamptz,
  pago_por uuid references auth.users (id),
  criado_em timestamptz not null default now()
);
alter table public.comissoes enable row level security;
create index if not exists comissoes_vendedor_status on public.comissoes (vendedor_id, status);
create index if not exists comissoes_recebido_em on public.comissoes (recebido_em desc);

notify pgrst, 'reload schema';
