-- Oficina de uso gratuito (decisão do Frederico, 30/10/2026): marcada no /admin.
-- Só muda os relatórios do painel (não conta como pagante nem na receita).
-- Não muda o acesso nem tira a opção de pagar (a TUKA é usada para testar o cartão).
alter table public.empresas
  add column if not exists gratuita boolean not null default false;

update public.empresas
   set gratuita = true
 where nome_fantasia ilike 'tuka solu%'
    or nome_fantasia ilike 'impacto repara%';
