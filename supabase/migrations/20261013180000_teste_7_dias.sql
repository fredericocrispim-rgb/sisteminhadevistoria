-- Teste grátis passa a ser de 7 dias (decisão do Frederico, 13/10/2026).
-- Já aplicado direto no banco de teste pelo script; deixado aqui para o histórico e para o banco de produção.
update public.plataforma set dias_teste = 7 where id = 1;
alter table public.plataforma alter column dias_teste set default 7;

-- Oficinas que ainda estão no teste: o teste termina 7 dias depois do cadastro
update public.assinaturas a
   set fim_teste = (e.criado_em at time zone 'America/Sao_Paulo')::date + 7
  from public.empresas e
 where e.id = a.empresa_id and a.status = 'teste';
