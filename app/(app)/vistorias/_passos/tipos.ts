import type { VistaAvaria } from "@/lib/desenhos-carro";
import type { EstadoPneu, TipoVeiculo } from "@/lib/vistoria";
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

/** Assinatura do cliente, guardada entre o passo 6 (cliente) e o 7 (oficina). */
export type AssinaturaCliente = { nome: string; imagem: string | null; ausente: boolean; motivo: string };

export const ASSINATURA_VAZIA: AssinaturaCliente = { nome: "", imagem: null, ausente: false, motivo: "" };

export type FotoSalva = { id: string; categoria: string; caminho: string; previa: string | null };

/** Vídeo da vistoria (plano Pro). */
export type VideoSalvo = { id: string; caminho: string; tipo: string; duracao: number | null; previa: string | null };

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
  tipoVeiculo: TipoVeiculo;
  empresaId: string;
  oficinaNome: string;
  responsavel: string;
  carro: DadosCarro;
  entrada: InfoEntrada;
  fotos: FotoSalva[];
  video: VideoSalvo | null;
  /** Segundos de vídeo do plano (0 = não grava: plano Básico ou vídeo desligado). */
  videoSegundos: number;
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
