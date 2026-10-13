import type { VistaAvaria } from "@/lib/desenhos-carro";
import type { EstadoPneu } from "@/lib/vistoria";
import type { NivelCombustivel } from "@/components/vf";

export type DadosCarro = {
  placa: string;
  marca: string;
  modelo: string;
  cor: string;
  km: string;
  combustivel: NivelCombustivel | null;
  chegouGuincho: boolean;
  placaGuincho: string;
  prestadorGuincho: string;
  clienteNome: string;
  clienteWhatsapp: string;
};

export type InfoEntrada = { id: string; data: string; km: number | null; combustivel: string | null } | null;

export type FotoSalva = { id: string; categoria: string; caminho: string; previa: string | null };

export type Avaria = {
  id: string;
  numero: number;
  vista: VistaAvaria;
  x: number;
  y: number;
  tipo: string;
  descricao: string | null;
  nova_na_saida: boolean;
};

export type DadosVistoria = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  empresaId: string;
  oficinaNome: string;
  responsavel: string;
  carro: DadosCarro;
  entrada: InfoEntrada;
  fotos: FotoSalva[];
  avarias: Avaria[];
  avariasEntrada: Avaria[];
  pneus: Record<string, EstadoPneu>;
  itens: Record<string, boolean>;
  checklist: string[];
  observacoes: string;
};

export const CARRO_VAZIO: DadosCarro = {
  placa: "",
  marca: "",
  modelo: "",
  cor: "",
  km: "",
  combustivel: null,
  chegouGuincho: false,
  placaGuincho: "",
  prestadorGuincho: "",
  clienteNome: "",
  clienteWhatsapp: "",
};
