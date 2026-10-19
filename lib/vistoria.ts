/**
 * Regras da vistoria compartilhadas entre telas, servidor e PDF.
 */
import type { VistaFoto } from "@/components/vf/silhueta-carro";

/** As 6 fotos obrigatórias, na ordem guiada. */
export const FOTOS_OBRIGATORIAS: { categoria: string; titulo: string; vista: VistaFoto; dica: string }[] = [
  { categoria: "frente", titulo: "Frente", vista: "frente", dica: "Fique 3 passos na frente do carro" },
  { categoria: "traseira", titulo: "Traseira", vista: "traseira", dica: "Fique 3 passos atrás do carro" },
  { categoria: "lateral_esquerda", titulo: "Lado esquerdo", vista: "lateral-esquerda", dica: "Pegue o carro inteiro, de lado" },
  { categoria: "lateral_direita", titulo: "Lado direito", vista: "lateral-direita", dica: "Pegue o carro inteiro, de lado" },
  { categoria: "painel", titulo: "Painel", vista: "painel", dica: "Carro ligado. Mostre o km e o combustível" },
  { categoria: "placa", titulo: "Placa", vista: "placa", dica: "Chegue perto. A placa deve dar para ler" },
];

/** Foto a mais, que o usuário tira se quiser (não é obrigatória). */
export const FOTO_EXTRA = { categoria: "extra", titulo: "Outra foto", vista: "extra" as VistaFoto, dica: "Opcional. Um detalhe que você quer mostrar" };

/** Nome de cada foto, inclusive as que não são mais pedidas (vistorias antigas). */
const NOMES_FOTOS_ANTIGAS: Record<string, string> = {
  diagonal_dianteira: "Canto da frente",
  diagonal_traseira: "Canto de trás",
};

export function tituloFoto(categoria: string) {
  return FOTOS_OBRIGATORIAS.find((f) => f.categoria === categoria)?.titulo ?? (categoria === FOTO_EXTRA.categoria ? FOTO_EXTRA.titulo : NOMES_FOTOS_ANTIGAS[categoria]) ?? categoria;
}

/** Ordem para mostrar as fotos: obrigatórias, depois a extra, depois as que não são mais pedidas. */
export function ordemFoto(categoria: string) {
  const i = FOTOS_OBRIGATORIAS.findIndex((f) => f.categoria === categoria);
  if (i !== -1) return i;
  return categoria === FOTO_EXTRA.categoria ? FOTOS_OBRIGATORIAS.length : 99;
}

export const PNEUS = [
  { posicao: "dianteiro_esquerdo", nome: "Dianteiro esquerdo" },
  { posicao: "dianteiro_direito", nome: "Dianteiro direito" },
  { posicao: "traseiro_esquerdo", nome: "Traseiro esquerdo" },
  { posicao: "traseiro_direito", nome: "Traseiro direito" },
  { posicao: "estepe", nome: "Estepe" },
] as const;

export type EstadoPneu = "bom" | "ruim" | "ausente";

export const MARCAS_COMUNS = [
  "Fiat", "Volkswagen", "Chevrolet", "Toyota", "Hyundai", "Honda",
  "Renault", "Jeep", "Ford", "Nissan", "Peugeot", "Citroën",
];

export const CORES_CARRO = [
  { nome: "Branco", hex: "#ffffff" },
  { nome: "Prata", hex: "#c0c4c8" },
  { nome: "Cinza", hex: "#6b7280" },
  { nome: "Preto", hex: "#111111" },
  { nome: "Vermelho", hex: "#c81e1e" },
  { nome: "Azul", hex: "#1d4ed8" },
  { nome: "Verde", hex: "#15803d" },
  { nome: "Bege", hex: "#d6c3a1" },
  { nome: "Marrom", hex: "#6b4226" },
  { nome: "Amarelo", hex: "#eab308" },
  { nome: "Laranja", hex: "#ea580c" },
  { nome: "Outra", hex: "" },
];

export const NOMES_COMBUSTIVEL: Record<string, string> = {
  vazio: "Vazio",
  "1/4": "1/4",
  "1/2": "1/2",
  "3/4": "3/4",
  cheio: "Cheio",
};

/** Data e hora no fuso de Brasília: 13/10/2026 14:05 */
export function dataHoraBR(iso: string | Date) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** CPF/CNPJ mascarado para documentos públicos: ***.456.789-** */
export function mascararDocumento(doc?: string | null) {
  const d = (doc ?? "").replace(/\D/g, "");
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return "";
}

/** Placa para mostrar: ABC1234 → ABC-1234; Mercosul fica junta. */
export function placaParaMostrar(placa: string) {
  return /^[A-Z]{3}[0-9]{4}$/.test(placa) ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;
}

export const nomeTipo = (tipo: string) => (tipo === "SAIDA" ? "ENTREGA" : "CHEGADA");
