-- Inativar oficina pelo /admin (decisão do Frederico, 30/10/2026).
-- Inativa: some da lista e das contas do painel, a equipe não usa o sistema e a assinatura do Asaas é cancelada.
-- Nada é apagado; o administrador pode reativar.
alter table public.empresas
  add column ativa boolean not null default true,
  add column inativada_em timestamptz;
