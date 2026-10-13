-- =====================================================================
-- VistoriaFácil — estrutura inicial do banco (Prompt 03)
-- Fase de validação: pagamento SÓ por Pix, confirmado à mão pelo superadmin.
-- Regras: RLS em TODAS as tabelas; cada oficina só vê os próprios dados.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------

create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- Código curto e legível, sem letras/números que confundem (0/O, 1/I/L).
create or replace function public.gerar_codigo(tamanho int)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(tamanho);
  resultado text := '';
begin
  for i in 0 .. tamanho - 1 loop
    resultado := resultado || substr(alfabeto, (get_byte(bytes, i) % length(alfabeto)) + 1, 1);
  end loop;
  return resultado;
end;
$$;

-- ---------------------------------------------------------------------
-- PLATAFORMA (seus dados de fornecedor) e PLANOS
-- ---------------------------------------------------------------------

create table public.plataforma (
  id smallint primary key default 1 check (id = 1), -- sempre uma linha só
  nome_produto text not null default 'VistoriaFácil',
  logo_produto_url text,
  fornecedor_nome text,
  fornecedor_foto_url text,
  fornecedor_cargo text,
  fornecedor_frase text,
  fornecedor_whatsapp text,
  fornecedor_email text,
  fornecedor_site text,
  fornecedor_instagram text,
  fornecedor_linkedin text,
  link_agendamento text,
  servicos text[] not null default '{}',
  texto_rodape_pdf text,
  texto_rodape_email text,
  recompensa_indicacao text,
  dias_teste int not null default 14,
  dias_carencia int not null default 5,
  versao_termos_atual text not null default '1',
  versao_privacidade_atual text not null default '1',
  whatsapp_suporte text,
  horario_suporte text,
  -- Pix para receber as mensalidades (fase de validação)
  pix_chave text,
  pix_nome_recebedor text,
  pix_cidade text,
  atualizado_em timestamptz not null default now()
);

create table public.superadmins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco_mensal numeric(10, 2) not null,
  preco_anual numeric(10, 2),
  limite_vistorias_mes int, -- vazio = ilimitado
  limite_usuarios int,
  limite_unidades int not null default 1,
  limite_armazenamento_gb int,
  whatsapp_api boolean not null default false,
  permite_ocultar_marca boolean not null default false,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- OFICINAS (empresas), UNIDADES e EQUIPE
-- ---------------------------------------------------------------------

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  tipo_pessoa text not null default 'PJ' check (tipo_pessoa in ('PJ', 'PF')),
  cnpj_cpf text,
  razao_social text,
  nome_fantasia text not null,
  inscricao_estadual text,
  segmento text check (segmento in ('oficina', 'funilaria', 'autocentro', 'guincho', 'associacao', 'outro')),
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text check (uf is null or length(uf) = 2),
  telefone text,
  whatsapp text,
  email text,
  site text,
  instagram text,
  responsavel_nome text,
  logo_original_url text,
  logo_app_url text,
  logo_pdf_url text,
  logo_email_url text,
  cor_primaria text not null default '#1d4ed8',
  vistorias_mes_estimadas text,
  codigo_indicacao text not null unique default public.gerar_codigo(6),
  indicada_por_empresa_id uuid references public.empresas (id) on delete set null,
  ocultar_marca_fornecedor boolean not null default false,
  cadastro_completo_pct int not null default 0 check (cadastro_completo_pct between 0 and 100),
  status text not null default 'ativa' check (status in ('ativa', 'bloqueada', 'encerrada')),
  ultimo_numero_vistoria int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null default 'Principal',
  prefixo_numero text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  telefone text,
  logo_url text,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.usuarios_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text,
  papel text not null check (papel in ('dono', 'gerente', 'vistoriador')),
  unidades_permitidas uuid[], -- vazio = todas as unidades
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, user_id)
);

-- ---------------------------------------------------------------------
-- Funções de permissão (usadas nas regras de segurança)
-- ---------------------------------------------------------------------

create or replace function public.eh_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.superadmins s where s.user_id = (select auth.uid()));
$$;

-- Empresas em que o usuário logado está ativo.
create or replace function public.minhas_empresas()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ue.empresa_id
  from public.usuarios_empresa ue
  where ue.user_id = (select auth.uid()) and ue.ativo;
$$;

create or replace function public.tem_papel(p_empresa uuid, p_papeis text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios_empresa ue
    where ue.user_id = (select auth.uid())
      and ue.empresa_id = p_empresa
      and ue.ativo
      and ue.papel = any (p_papeis)
  );
$$;

-- Dono e gerente veem todas as unidades; vistoriador só as permitidas.
create or replace function public.pode_ver_unidade(p_empresa uuid, p_unidade uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios_empresa ue
    where ue.user_id = (select auth.uid())
      and ue.empresa_id = p_empresa
      and ue.ativo
      and (
        ue.papel in ('dono', 'gerente')
        or ue.unidades_permitidas is null
        or cardinality(ue.unidades_permitidas) = 0
        or p_unidade = any (ue.unidades_permitidas)
      )
  );
$$;

-- ---------------------------------------------------------------------
-- COBRANÇA (fase de validação: Pix manual) — campos genéricos para trocar de provedor depois
-- ---------------------------------------------------------------------

create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas (id) on delete cascade,
  plano_id uuid references public.planos (id),
  status text not null default 'teste' check (status in ('teste', 'ativa', 'em_atraso', 'inadimplente', 'cancelada')),
  periodicidade text not null default 'mensal' check (periodicidade in ('mensal', 'anual')),
  fim_teste date,
  proximo_vencimento date,
  provedor text not null default 'pix_manual',
  id_cliente_externo text,
  id_assinatura_externa text,
  cupom text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.faturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  assinatura_id uuid references public.assinaturas (id) on delete set null,
  descricao text,
  valor numeric(10, 2) not null check (valor > 0),
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'paga', 'vencida', 'cancelada')),
  forma text not null default 'pix',
  pix_identificador text unique default public.gerar_codigo(12), -- vai no Pix para achar o pagamento no extrato
  pix_copia_cola text,
  id_externo text,
  link_fatura text,
  link_nota_fiscal text,
  pago_em timestamptz,
  confirmado_por uuid references auth.users (id),
  observacao text,
  criado_em timestamptz not null default now()
);

-- Para quando houver cobrança automática (avisos do provedor). Não usado no Pix manual.
create table public.eventos_pagamento (
  id uuid primary key default gen_random_uuid(),
  provedor text not null,
  id_evento_provedor text not null,
  tipo text,
  payload jsonb,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro text,
  unique (provedor, id_evento_provedor)
);

-- ---------------------------------------------------------------------
-- VENDAS: leads, indicações, termos, comunicados
-- ---------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(nome) between 2 and 120),
  empresa text check (length(empresa) <= 120),
  whatsapp text check (length(whatsapp) <= 30),
  email text check (length(email) <= 160),
  cidade_uf text check (length(cidade_uf) <= 80),
  segmento text check (length(segmento) <= 40),
  origem text check (length(origem) <= 40),
  empresa_origem_id uuid references public.empresas (id) on delete set null,
  utm jsonb,
  status text not null default 'novo' check (status in ('novo', 'contatado', 'demonstracao', 'cliente', 'perdido')),
  observacoes text,
  consentimento boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_indicante_id uuid not null references public.empresas (id) on delete cascade,
  empresa_indicada_id uuid not null unique references public.empresas (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'qualificada', 'recompensada', 'cancelada')),
  recompensa_aplicada_em timestamptz,
  criado_em timestamptz not null default now()
);

create table public.aceites_termos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete cascade,
  documento text not null check (documento in ('termos', 'privacidade', 'contrato')),
  versao text not null,
  data_hora timestamptz not null default now(),
  ip text
);

create table public.comunicados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  texto text not null,
  inicio timestamptz not null default now(),
  fim timestamptz,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CLIENTES e VEÍCULOS (de cada oficina)
-- ---------------------------------------------------------------------

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  cpf_cnpj text,
  whatsapp text,
  email text,
  consentimento_contato boolean not null default false,
  anonimizado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  placa text not null check (placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'), -- antiga ou Mercosul, sem hífen
  marca text,
  modelo text,
  ano int check (ano is null or ano between 1950 and 2100),
  cor text,
  chassi text,
  cliente_id uuid references public.clientes (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, placa)
);

-- ---------------------------------------------------------------------
-- VISTORIAS
-- ---------------------------------------------------------------------

create table public.vistorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id),
  numero int, -- preenchido sozinho (sequência por empresa)
  codigo_autenticidade text unique,
  tipo text not null check (tipo in ('ENTRADA', 'SAIDA')),
  veiculo_id uuid references public.veiculos (id),
  cliente_id uuid references public.clientes (id),
  criado_por uuid references auth.users (id) default auth.uid(),
  status text not null default 'rascunho' check (status in ('rascunho', 'concluida', 'enviada', 'cancelada')),
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  km int check (km is null or km >= 0),
  combustivel text check (combustivel in ('vazio', '1/4', '1/2', '3/4', 'cheio')),
  chegou_guincho boolean not null default false,
  placa_guincho text,
  prestador_guincho text,
  objetos_guincho text,
  objetos_oficina text,
  observacoes text,
  recebido_por text,
  liberado_por text,
  assinatura_cliente_url text,
  nome_assinante_cliente text,
  documento_assinante text,
  assinatura_responsavel_url text,
  cliente_ausente_justificativa text,
  latitude double precision,
  longitude double precision,
  ip_conclusao text,
  aparelho text,
  pdf_url text,
  pdf_hash_sha256 text,
  token_publico text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  link_publico_ativo boolean not null default true,
  vistoria_entrada_id uuid references public.vistorias (id),
  exemplo boolean not null default false, -- vistoria de demonstração/treino: não conta no limite
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, numero)
);

create table public.vistoria_adendos (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  texto text not null check (length(texto) between 1 and 4000),
  autor uuid references auth.users (id) default auth.uid(),
  autor_nome text,
  data_hora timestamptz not null default now()
);

create table public.vistoria_pneus (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  posicao text not null check (posicao in ('dianteiro_esquerdo', 'dianteiro_direito', 'traseiro_esquerdo', 'traseiro_direito', 'estepe')),
  estado text not null check (estado in ('bom', 'ruim', 'ausente')),
  unique (vistoria_id, posicao)
);

create table public.itens_checklist_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  ativo boolean not null default true
);

create table public.vistoria_itens (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  item_nome text not null, -- copia o nome: se o item mudar depois, a vistoria antiga não muda
  tem boolean not null,
  unique (vistoria_id, item_nome)
);

create table public.vistoria_avarias (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  numero int not null,
  vista text not null check (vista in ('lateral_esquerda', 'lateral_direita', 'frente', 'traseira', 'cima')),
  x numeric(5, 2) not null check (x between 0 and 100), -- posição em %
  y numeric(5, 2) not null check (y between 0 and 100),
  tipo text not null check (tipo in ('risco', 'amassado', 'quebrado', 'trincado', 'faltando', 'ferrugem', 'outro')),
  descricao text,
  foto_url text,
  nova_na_saida boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.vistoria_fotos (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  categoria text not null,
  url text not null, -- caminho no bucket "vistorias"
  data_hora timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  obrigatoria boolean not null default false,
  tamanho_bytes int,
  criado_em timestamptz not null default now()
);

create table public.envios (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  canal text not null check (canal in ('email', 'whatsapp_api', 'whatsapp_link')),
  destino text not null,
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'entregue', 'lido', 'falhou')),
  erro text,
  id_externo text,
  data_hora timestamptz not null default now()
);

create table public.visualizacoes_publicas (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias (id) on delete cascade,
  data_hora timestamptz not null default now(),
  ip text,
  agente text
);

create table public.auditoria (
  id bigint generated always as identity primary key,
  empresa_id uuid references public.empresas (id) on delete set null,
  usuario_id uuid references auth.users (id) on delete set null default auth.uid(),
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhes jsonb,
  ip text,
  data_hora timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Gatilhos (regras automáticas)
-- ---------------------------------------------------------------------

create trigger trg_plataforma_atualizado before update on public.plataforma
  for each row execute function public.atualizar_atualizado_em();
create trigger trg_empresas_atualizado before update on public.empresas
  for each row execute function public.atualizar_atualizado_em();
create trigger trg_assinaturas_atualizado before update on public.assinaturas
  for each row execute function public.atualizar_atualizado_em();
create trigger trg_clientes_atualizado before update on public.clientes
  for each row execute function public.atualizar_atualizado_em();
create trigger trg_veiculos_atualizado before update on public.veiculos
  for each row execute function public.atualizar_atualizado_em();
create trigger trg_vistorias_atualizado before update on public.vistorias
  for each row execute function public.atualizar_atualizado_em();

-- Toda empresa nasce com a unidade "Principal", os itens padrão do checklist e o período de teste.
create or replace function public.preparar_empresa_nova()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dias int;
begin
  insert into public.unidades (empresa_id, nome) values (new.id, 'Principal');

  insert into public.itens_checklist_empresa (empresa_id, nome, ordem)
  select new.id, item, ord
  from unnest(array[
    'Documentos', 'Manual', 'Macaco', 'Extintor', 'Chave de roda', 'Antena', 'Som',
    'Caixa de som', 'Triângulo', 'Rodas de ferro', 'Rodas de liga leve', 'Chave de ignição', 'Tapete'
  ]) with ordinality as t (item, ord);

  select dias_teste into v_dias from public.plataforma where id = 1;
  insert into public.assinaturas (empresa_id, status, fim_teste)
  values (new.id, 'teste', current_date + coalesce(v_dias, 14));

  return new;
end;
$$;

create trigger trg_empresa_nova after insert on public.empresas
  for each row execute function public.preparar_empresa_nova();

-- Número sequencial por empresa e código de autenticidade (ex.: VF-7K3P-9Q2X).
create or replace function public.numerar_vistoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_codigo text;
begin
  update public.empresas
     set ultimo_numero_vistoria = ultimo_numero_vistoria + 1
   where id = new.empresa_id
  returning ultimo_numero_vistoria into new.numero;

  loop
    v_codigo := 'VF-' || public.gerar_codigo(4) || '-' || public.gerar_codigo(4);
    exit when not exists (select 1 from public.vistorias where codigo_autenticidade = v_codigo);
  end loop;
  new.codigo_autenticidade := v_codigo;
  return new;
end;
$$;

create trigger trg_vistoria_numero before insert on public.vistorias
  for each row execute function public.numerar_vistoria();

-- PROVA: depois de concluída, a vistoria não muda. Correção só por adendo.
-- Únicos campos que ainda podem mudar: status (concluida -> enviada/cancelada), link público,
-- e PDF/hash (só se ainda estiverem vazios).
create or replace function public.travar_vistoria_concluida()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  livres constant text[] := array['status', 'link_publico_ativo', 'pdf_url', 'pdf_hash_sha256', 'atualizado_em'];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'rascunho' then
      raise exception 'Vistoria concluída não pode ser apagada.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if old.status = 'rascunho' then
    return new;
  end if;

  if (to_jsonb(new) - livres) is distinct from (to_jsonb(old) - livres) then
    raise exception 'Vistoria concluída não pode ser alterada. Use um adendo.' using errcode = 'P0001';
  end if;
  if old.pdf_url is not null and new.pdf_url is distinct from old.pdf_url
     or old.pdf_hash_sha256 is not null and new.pdf_hash_sha256 is distinct from old.pdf_hash_sha256 then
    raise exception 'O PDF de uma vistoria concluída não pode ser trocado.' using errcode = 'P0001';
  end if;
  if new.status = 'rascunho' then
    raise exception 'Vistoria concluída não volta para rascunho.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_vistoria_trava before update or delete on public.vistorias
  for each row execute function public.travar_vistoria_concluida();

-- Fotos, avarias, pneus e itens também ficam travados depois de concluir.
create or replace function public.travar_detalhes_vistoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := coalesce(new.vistoria_id, old.vistoria_id);
  v_status text;
begin
  select status into v_status from public.vistorias where id = v_id;
  if v_status is not null and v_status <> 'rascunho' then
    raise exception 'Vistoria concluída não pode ser alterada. Use um adendo.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_trava_pneus before insert or update or delete on public.vistoria_pneus
  for each row execute function public.travar_detalhes_vistoria();
create trigger trg_trava_itens before insert or update or delete on public.vistoria_itens
  for each row execute function public.travar_detalhes_vistoria();
create trigger trg_trava_avarias before insert or update or delete on public.vistoria_avarias
  for each row execute function public.travar_detalhes_vistoria();
create trigger trg_trava_fotos before insert or update or delete on public.vistoria_fotos
  for each row execute function public.travar_detalhes_vistoria();

-- ---------------------------------------------------------------------
-- Índices (buscas rápidas por placa, cliente e data)
-- ---------------------------------------------------------------------

create index on public.usuarios_empresa (user_id) where ativo;
create index on public.unidades (empresa_id);
create index on public.clientes (empresa_id, whatsapp);
create index on public.clientes (empresa_id, nome);
create index on public.veiculos (cliente_id);
create index on public.vistorias (empresa_id, iniciada_em desc);
create index on public.vistorias (empresa_id, status);
create index on public.vistorias (veiculo_id);
create index on public.vistorias (cliente_id);
create index on public.vistorias (vistoria_entrada_id);
create index on public.vistoria_adendos (vistoria_id);
create index on public.vistoria_avarias (vistoria_id);
create index on public.vistoria_fotos (vistoria_id);
create index on public.envios (vistoria_id);
create index on public.visualizacoes_publicas (vistoria_id);
create index on public.auditoria (empresa_id, data_hora desc);
create index on public.faturas (empresa_id, vencimento desc);
create index on public.faturas (status) where status in ('pendente', 'vencida');
create index on public.itens_checklist_empresa (empresa_id);
create index on public.leads (status, criado_em desc);

-- ---------------------------------------------------------------------
-- SEGURANÇA (RLS): ligada em TODAS as tabelas
-- ---------------------------------------------------------------------

alter table public.plataforma enable row level security;
alter table public.superadmins enable row level security;
alter table public.planos enable row level security;
alter table public.empresas enable row level security;
alter table public.unidades enable row level security;
alter table public.usuarios_empresa enable row level security;
alter table public.assinaturas enable row level security;
alter table public.faturas enable row level security;
alter table public.eventos_pagamento enable row level security;
alter table public.leads enable row level security;
alter table public.indicacoes enable row level security;
alter table public.aceites_termos enable row level security;
alter table public.comunicados enable row level security;
alter table public.clientes enable row level security;
alter table public.veiculos enable row level security;
alter table public.vistorias enable row level security;
alter table public.vistoria_adendos enable row level security;
alter table public.vistoria_pneus enable row level security;
alter table public.itens_checklist_empresa enable row level security;
alter table public.vistoria_itens enable row level security;
alter table public.vistoria_avarias enable row level security;
alter table public.vistoria_fotos enable row level security;
alter table public.envios enable row level security;
alter table public.visualizacoes_publicas enable row level security;
alter table public.auditoria enable row level security;

-- Plataforma e planos: todos leem; só o superadmin altera.
create policy "plataforma: todos leem" on public.plataforma for select using (true);
create policy "plataforma: superadmin altera" on public.plataforma for update to authenticated
  using ((select public.eh_superadmin())) with check ((select public.eh_superadmin()));

create policy "planos: todos leem os ativos" on public.planos for select using (ativo or (select public.eh_superadmin()));
create policy "planos: superadmin altera" on public.planos for all to authenticated
  using ((select public.eh_superadmin())) with check ((select public.eh_superadmin()));

create policy "superadmins: ver a si mesmo" on public.superadmins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.eh_superadmin()));

-- Empresas: membros veem; dono/gerente alteram. (Criação de empresa: Prompt 04, pelo servidor.)
create policy "empresas: membros veem" on public.empresas for select to authenticated
  using (id in (select public.minhas_empresas()) or (select public.eh_superadmin()));
create policy "empresas: dono e gerente alteram" on public.empresas for update to authenticated
  using (public.tem_papel(id, array['dono', 'gerente'])) with check (public.tem_papel(id, array['dono', 'gerente']));

create policy "unidades: membros veem" on public.unidades for select to authenticated
  using (empresa_id in (select public.minhas_empresas()) or (select public.eh_superadmin()));
create policy "unidades: dono e gerente criam" on public.unidades for insert to authenticated
  with check (public.tem_papel(empresa_id, array['dono', 'gerente']));
create policy "unidades: dono e gerente alteram" on public.unidades for update to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente'])) with check (public.tem_papel(empresa_id, array['dono', 'gerente']));

create policy "equipe: membros veem" on public.usuarios_empresa for select to authenticated
  using (empresa_id in (select public.minhas_empresas()) or user_id = (select auth.uid()) or (select public.eh_superadmin()));
create policy "equipe: dono e gerente adicionam" on public.usuarios_empresa for insert to authenticated
  with check (public.tem_papel(empresa_id, array['dono', 'gerente']) and papel <> 'dono');
create policy "equipe: dono e gerente alteram" on public.usuarios_empresa for update to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente'])) with check (public.tem_papel(empresa_id, array['dono', 'gerente']));

-- Cobrança: dono e gerente veem; só o superadmin altera (confirma o Pix à mão).
create policy "assinaturas: dono e gerente veem" on public.assinaturas for select to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente']) or (select public.eh_superadmin()));
create policy "assinaturas: superadmin altera" on public.assinaturas for all to authenticated
  using ((select public.eh_superadmin())) with check ((select public.eh_superadmin()));

create policy "faturas: dono e gerente veem" on public.faturas for select to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente']) or (select public.eh_superadmin()));
create policy "faturas: superadmin altera" on public.faturas for all to authenticated
  using ((select public.eh_superadmin())) with check ((select public.eh_superadmin()));

create policy "eventos_pagamento: só superadmin" on public.eventos_pagamento for select to authenticated
  using ((select public.eh_superadmin()));

-- Leads: qualquer um envia (formulário do site); só o superadmin lê.
create policy "leads: qualquer um envia" on public.leads for insert to anon, authenticated
  with check (status = 'novo' and observacoes is null);
create policy "leads: superadmin lê e altera" on public.leads for all to authenticated
  using ((select public.eh_superadmin())) with check ((select public.eh_superadmin()));

create policy "indicacoes: envolvidos veem" on public.indicacoes for select to authenticated
  using (
    public.tem_papel(empresa_indicante_id, array['dono'])
    or public.tem_papel(empresa_indicada_id, array['dono'])
    or (select public.eh_superadmin())
  );

create policy "aceites: cada um registra o seu" on public.aceites_termos for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "aceites: cada um vê o seu" on public.aceites_termos for select to authenticated
  using (usuario_id = (select auth.uid()) or (select public.eh_superadmin()));

create policy "comunicados: logados veem os ativos" on public.comunicados for select to authenticated
  using ((ativo and inicio <= now() and (fim is null or fim > now())) or (select public.eh_superadmin()));
create policy "comunicados: superadmin altera" on public.comunicados for all to authenticated
  using ((select public.eh_superadmin())) with check ((select public.eh_superadmin()));

-- Clientes e veículos: a equipe da oficina usa; só dono/gerente apaga.
create policy "clientes: membros veem" on public.clientes for select to authenticated
  using (empresa_id in (select public.minhas_empresas()) or (select public.eh_superadmin()));
create policy "clientes: membros criam" on public.clientes for insert to authenticated
  with check (empresa_id in (select public.minhas_empresas()));
create policy "clientes: membros alteram" on public.clientes for update to authenticated
  using (empresa_id in (select public.minhas_empresas())) with check (empresa_id in (select public.minhas_empresas()));
create policy "clientes: dono e gerente apagam" on public.clientes for delete to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente']));

create policy "veiculos: membros veem" on public.veiculos for select to authenticated
  using (empresa_id in (select public.minhas_empresas()) or (select public.eh_superadmin()));
create policy "veiculos: membros criam" on public.veiculos for insert to authenticated
  with check (empresa_id in (select public.minhas_empresas()));
create policy "veiculos: membros alteram" on public.veiculos for update to authenticated
  using (empresa_id in (select public.minhas_empresas())) with check (empresa_id in (select public.minhas_empresas()));
create policy "veiculos: dono e gerente apagam" on public.veiculos for delete to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente']));

-- Vistorias: só quem pode ver a unidade. A trava de "concluída" é feita pelo gatilho.
create policy "vistorias: ver da minha unidade" on public.vistorias for select to authenticated
  using (public.pode_ver_unidade(empresa_id, unidade_id) or (select public.eh_superadmin()));
create policy "vistorias: criar na minha unidade" on public.vistorias for insert to authenticated
  with check (public.pode_ver_unidade(empresa_id, unidade_id) and criado_por = (select auth.uid()));
create policy "vistorias: alterar da minha unidade" on public.vistorias for update to authenticated
  using (public.pode_ver_unidade(empresa_id, unidade_id)) with check (public.pode_ver_unidade(empresa_id, unidade_id));
create policy "vistorias: dono e gerente apagam rascunho" on public.vistorias for delete to authenticated
  using (status = 'rascunho' and public.tem_papel(empresa_id, array['dono', 'gerente']));

-- Detalhes da vistoria: valem as mesmas regras da vistoria (a consulta já passa pela RLS de vistorias).
create policy "pneus: pela vistoria" on public.vistoria_pneus for all to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id))
  with check (exists (select 1 from public.vistorias v where v.id = vistoria_id));
create policy "itens: pela vistoria" on public.vistoria_itens for all to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id))
  with check (exists (select 1 from public.vistorias v where v.id = vistoria_id));
create policy "avarias: pela vistoria" on public.vistoria_avarias for all to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id))
  with check (exists (select 1 from public.vistorias v where v.id = vistoria_id));
create policy "fotos: pela vistoria" on public.vistoria_fotos for all to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id))
  with check (exists (select 1 from public.vistorias v where v.id = vistoria_id));

-- Adendos: só acrescentar (nunca alterar nem apagar).
create policy "adendos: ver pela vistoria" on public.vistoria_adendos for select to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id));
create policy "adendos: acrescentar pela vistoria" on public.vistoria_adendos for insert to authenticated
  with check (autor = (select auth.uid()) and exists (select 1 from public.vistorias v where v.id = vistoria_id));

create policy "envios: ver pela vistoria" on public.envios for select to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id));
create policy "envios: registrar pela vistoria" on public.envios for insert to authenticated
  with check (exists (select 1 from public.vistorias v where v.id = vistoria_id));

create policy "visualizacoes: ver pela vistoria" on public.visualizacoes_publicas for select to authenticated
  using (exists (select 1 from public.vistorias v where v.id = vistoria_id));

create policy "itens_checklist: membros veem" on public.itens_checklist_empresa for select to authenticated
  using (empresa_id in (select public.minhas_empresas()) or (select public.eh_superadmin()));
create policy "itens_checklist: dono e gerente alteram" on public.itens_checklist_empresa for all to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente'])) with check (public.tem_papel(empresa_id, array['dono', 'gerente']));

-- Auditoria: só acrescentar; dono/gerente e superadmin leem.
create policy "auditoria: registrar na minha empresa" on public.auditoria for insert to authenticated
  with check (usuario_id = (select auth.uid()) and (empresa_id is null or empresa_id in (select public.minhas_empresas())));
create policy "auditoria: dono e gerente leem" on public.auditoria for select to authenticated
  using (public.tem_papel(empresa_id, array['dono', 'gerente']) or (select public.eh_superadmin()));

-- ---------------------------------------------------------------------
-- ARQUIVOS (Storage)
--   vistorias: PRIVADO. Caminho: {empresa_id}/{vistoria_id}/arquivo.jpg
--   marcas:    leitura pública (logos). Caminho: {empresa_id}/arquivo.png
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vistorias', 'vistorias', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('marcas', 'marcas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "vistorias: membros veem arquivos" on storage.objects for select to authenticated
  using (
    bucket_id = 'vistorias'
    and ((storage.foldername(name))[1] in (select e::text from public.minhas_empresas() e) or (select public.eh_superadmin()))
  );
create policy "vistorias: membros enviam arquivos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vistorias'
    and (storage.foldername(name))[1] in (select e::text from public.minhas_empresas() e)
  );
-- (Sem regra de apagar/alterar: fotos de vistoria são prova.)

create policy "marcas: todos veem" on storage.objects for select
  using (bucket_id = 'marcas');
create policy "marcas: dono e gerente enviam" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'marcas'
    and exists (
      select 1 from public.minhas_empresas() e
      where e::text = (storage.foldername(name))[1] and public.tem_papel(e, array['dono', 'gerente'])
    )
  );
create policy "marcas: dono e gerente trocam" on storage.objects for update to authenticated
  using (
    bucket_id = 'marcas'
    and exists (
      select 1 from public.minhas_empresas() e
      where e::text = (storage.foldername(name))[1] and public.tem_papel(e, array['dono', 'gerente'])
    )
  );
create policy "marcas: dono e gerente apagam" on storage.objects for delete to authenticated
  using (
    bucket_id = 'marcas'
    and exists (
      select 1 from public.minhas_empresas() e
      where e::text = (storage.foldername(name))[1] and public.tem_papel(e, array['dono', 'gerente'])
    )
  );

-- ---------------------------------------------------------------------
-- DADOS INICIAIS (editáveis depois no /admin)
-- ---------------------------------------------------------------------

insert into public.plataforma (id, nome_produto, fornecedor_nome, dias_teste, dias_carencia)
values (1, 'VistoriaFácil', 'Frederico Crispim', 14, 5)
on conflict (id) do nothing;

-- Preços provisórios: o Frederico define os valores reais depois.
insert into public.planos (nome, preco_mensal, preco_anual, limite_vistorias_mes, limite_usuarios, limite_unidades, whatsapp_api, permite_ocultar_marca, ordem)
values
  ('Básico', 49.90, 499.00, 100, 2, 1, false, false, 1),
  ('Profissional', 99.90, 999.00, 500, 10, 1, true, false, 2),
  ('Rede', 199.90, 1999.00, null, null, 10, true, true, 3);
