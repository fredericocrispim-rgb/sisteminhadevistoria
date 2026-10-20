-- =====================================================================
-- Decisões do Frederico (20/10/2026)
-- 1. Equipe: até 3 usuários (contando o dono) pelo preço do plano;
--    cada usuário a mais soma R$ 9,90 na mensalidade.
-- 2. Vistoria de CARRO, MOTOCICLETA ou CAMINHÃO (escolhido na primeira tela).
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- 1. Preço por usuário a mais
alter table public.planos add column if not exists preco_usuario_extra numeric(10, 2) not null default 0;

update public.planos
   set limite_usuarios = 3, preco_usuario_extra = 9.90
 where nome = 'Básico';

-- 2. Tipo de veículo
alter table public.vistorias add column if not exists tipo_veiculo text not null default 'carro'
  check (tipo_veiculo in ('carro', 'moto', 'caminhao'));

alter table public.veiculos add column if not exists tipo text not null default 'carro'
  check (tipo in ('carro', 'moto', 'caminhao'));

-- Moto tem só 2 pneus: dianteiro e traseiro (troca a regra de posições dos pneus)
alter table public.vistoria_pneus drop constraint if exists vistoria_pneus_posicao_check;
alter table public.vistoria_pneus add constraint vistoria_pneus_posicao_check
  check (posicao in ('dianteiro_esquerdo', 'dianteiro_direito', 'traseiro_esquerdo', 'traseiro_direito', 'estepe', 'dianteiro', 'traseiro'));

-- Avisa o Supabase para enxergar as colunas novas na hora
notify pgrst, 'reload schema';
