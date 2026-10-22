-- =====================================================================
-- Decisões do Frederico (22/10/2026)
-- 1. Plano Básico: dono + 3 pessoas (4 usuários) pelo preço do plano;
--    cada usuário a mais soma R$ 19,90.
-- 2. Cupom no cadastro de usuário: com o cupom CORTESIA, aquele usuário
--    não é cobrado. Sem cupom, a cobrança acontece normalmente.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

update public.planos
   set limite_usuarios = 4, preco_usuario_extra = 19.90
 where nome = 'Básico';

-- Cupons que o Frederico distribui (só o servidor lê: sem regra de acesso para o público)
create table if not exists public.cupons (
  codigo text primary key check (codigo = upper(codigo)),
  descricao text,
  usuario_gratis boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.cupons enable row level security;

insert into public.cupons (codigo, descricao)
values ('CORTESIA', 'Usuário a mais sem custo')
on conflict (codigo) do nothing;

-- Cupom usado no cadastro do usuário (vazio = usuário pago)
alter table public.usuarios_empresa add column if not exists cupom text;

notify pgrst, 'reload schema';
