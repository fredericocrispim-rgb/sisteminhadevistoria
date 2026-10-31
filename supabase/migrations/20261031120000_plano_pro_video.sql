-- Plano Pro com vídeo (decisão do Frederico, 31/10/2026)
-- - Dois planos à venda: Básico (o de hoje) e Pro (= Básico + R$ 30, grava vídeo de até 1 minuto).
-- - O vídeo fica DESLIGADO (plataforma.video_ligado = false) até contratar o Supabase Pro:
--   no plano grátis (1 GB) não cabem vídeos. O Frederico liga no /admin.
-- - Vídeo guardado por 1 ano (plataforma.dias_guardar_video); depois o arquivo é apagado,
--   mas o registro e o código SHA-256 continuam (o termo em PDF continua valendo).

-- Planos: segundos de vídeo por vistoria (0 = sem vídeo)
alter table public.planos add column if not exists video_segundos int not null default 0;

-- "Profissional" (nunca usado) vira o Pro: mesmo do Básico + vídeo, R$ 30 a mais
update public.planos p
set nome = 'Pro',
    preco_mensal = b.preco_mensal + 30,
    preco_anual = null,
    limite_vistorias_mes = b.limite_vistorias_mes,
    limite_usuarios = b.limite_usuarios,
    preco_usuario_extra = b.preco_usuario_extra,
    whatsapp_api = false,
    video_segundos = 60,
    ordem = 2
from public.planos b
where p.nome = 'Profissional' and b.nome = 'Básico';

-- "Rede" sai da venda (nenhuma oficina usa)
update public.planos set ativo = false where nome = 'Rede';

-- Chave geral do vídeo e por quanto tempo guardar
alter table public.plataforma add column if not exists video_ligado boolean not null default false;
alter table public.plataforma add column if not exists dias_guardar_video int not null default 365;

-- Pode gravar vídeo? Plano com vídeo + chave geral ligada
create or replace function public.pode_gravar_video(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select video_ligado from public.plataforma where id = 1), false)
     and exists (
       select 1
       from public.assinaturas a
       join public.planos p on p.id = a.plano_id
       where a.empresa_id = p_empresa and p.video_segundos > 0
     );
$$;

-- Vídeo da vistoria (um por vistoria)
create table if not exists public.vistoria_videos (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null unique references public.vistorias (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  url text not null, -- caminho no bucket "vistorias"
  tipo text not null check (tipo in ('video/mp4', 'video/webm')),
  tamanho_bytes int,
  duracao_segundos int,
  sha256 text, -- calculado no servidor ao concluir (entra no termo em PDF)
  data_hora timestamptz not null default now(),
  apagado_em timestamptz, -- arquivo apagado depois do prazo (o registro fica)
  criado_em timestamptz not null default now()
);

alter table public.vistoria_videos enable row level security;

create policy "videos: ver pela vistoria" on public.vistoria_videos for select to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id));
create policy "videos: gravar no plano Pro" on public.vistoria_videos for insert to authenticated
  with check (
    exists (select 1 from public.vistorias v where v.id = vistoria_videos.vistoria_id and v.empresa_id = vistoria_videos.empresa_id)
    and public.pode_gravar_video(vistoria_videos.empresa_id)
  );
create policy "videos: trocar pela vistoria" on public.vistoria_videos for delete to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id));

-- Trava: depois de concluir, nada muda, a não ser marcar que o arquivo foi apagado no prazo
create or replace function public.travar_video_vistoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status from public.vistorias where id = coalesce(new.vistoria_id, old.vistoria_id);
  if v_status is null or v_status = 'rascunho' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'apagado_em') = (to_jsonb(old) - 'apagado_em') then
    return new;
  end if;
  raise exception 'Vistoria concluída não pode ser alterada. Use um adendo.' using errcode = 'P0001';
end;
$$;

create trigger trg_trava_videos before insert or update or delete on public.vistoria_videos
  for each row execute function public.travar_video_vistoria();

create index if not exists vistoria_videos_apagar on public.vistoria_videos (data_hora) where apagado_em is null;

-- Bucket "vistorias" passa a aceitar vídeo (até 25 MB por arquivo)
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
where id = 'vistorias';
