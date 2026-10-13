-- =====================================================================
-- Convites da equipe (Prompt 04)
-- O dono/gerente cria um convite e manda o link pelo WhatsApp.
-- Quem recebe abre o link, entra com o e-mail e já fica na equipe.
-- =====================================================================

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null check (length(nome) between 2 and 80),
  papel text not null check (papel in ('gerente', 'vistoriador')),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  criado_por uuid references auth.users (id) default auth.uid(),
  aceito_por uuid references auth.users (id),
  aceito_em timestamptz,
  expira_em timestamptz not null default now() + interval '14 days',
  cancelado boolean not null default false,
  criado_em timestamptz not null default now()
);

create index on public.convites (empresa_id, criado_em desc);

alter table public.convites enable row level security;

create policy "convites: dono e gerente veem" on public.convites for select to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente']) or (select public.eh_superadmin()));
create policy "convites: dono e gerente criam" on public.convites for insert to authenticated
  with check (public.tem_papel(empresa_id, array['dono', 'gerente']) and criado_por = (select auth.uid()));
create policy "convites: dono e gerente cancelam" on public.convites for update to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente'])) with check (public.tem_papel(empresa_id, array['dono', 'gerente']));

-- Aceitar convite: liga o usuário logado à oficina. Retorna o id da oficina.
create or replace function public.aceitar_convite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_convite public.convites%rowtype;
begin
  if v_uid is null then
    raise exception 'Entre com seu e-mail primeiro.' using errcode = 'P0001';
  end if;

  select * into v_convite
  from public.convites
  where token = p_token and not cancelado and aceito_em is null and expira_em > now()
  for update;

  if not found then
    raise exception 'Este convite não vale mais. Peça um novo para a oficina.' using errcode = 'P0001';
  end if;

  insert into public.usuarios_empresa (empresa_id, user_id, nome, papel)
  values (v_convite.empresa_id, v_uid, v_convite.nome, v_convite.papel)
  on conflict (empresa_id, user_id) do update set ativo = true, papel = excluded.papel;

  update public.convites set aceito_por = v_uid, aceito_em = now() where id = v_convite.id;

  insert into public.auditoria (empresa_id, usuario_id, acao, entidade, entidade_id)
  values (v_convite.empresa_id, v_uid, 'aceitou_convite', 'convites', v_convite.id);

  return v_convite.empresa_id;
end;
$$;

revoke execute on function public.aceitar_convite(text) from public, anon;
grant execute on function public.aceitar_convite(text) to authenticated;
