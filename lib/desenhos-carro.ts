/**
 * Desenhos ORIGINAIS do carro (linhas simples) usados no mapa de avarias.
 * Os mesmos dados desenham a tela (SVG) e o PDF, para as marcações ficarem no mesmo lugar.
 * Área de desenho: 200 x 96. Posições das avarias são guardadas em % (x, y).
 */

export type Forma =
  | { t: "path"; d: string }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number };

export type VistaAvaria = "lateral_esquerda" | "lateral_direita" | "frente" | "traseira" | "cima";

export const VISTAS: { id: VistaAvaria; nome: string }[] = [
  { id: "lateral_esquerda", nome: "Lado esquerdo" },
  { id: "lateral_direita", nome: "Lado direito" },
  { id: "frente", nome: "Frente" },
  { id: "traseira", nome: "Traseira" },
  { id: "cima", nome: "De cima" },
];

export const LARGURA = 200;
export const ALTURA = 96;

const lateral: Forma[] = [
  { t: "path", d: "M12 70 L14 56 Q16 50 24 48 L46 44 L64 28 Q68 25 76 25 L118 25 Q126 25 132 30 L148 44 L172 48 Q184 50 186 58 L188 70 Z" },
  { t: "path", d: "M68 44 L80 31 L104 31 L104 44 Z" },
  { t: "path", d: "M110 31 L124 31 Q128 31 131 34 L140 44 L110 44 Z" },
  { t: "path", d: "M106 46 L106 68" },
  { t: "circle", cx: 48, cy: 72, r: 13 },
  { t: "circle", cx: 152, cy: 72, r: 13 },
  { t: "circle", cx: 48, cy: 72, r: 5 },
  { t: "circle", cx: 152, cy: 72, r: 5 },
];

const frenteBase: Forma[] = [
  { t: "path", d: "M50 78 L48 52 Q50 44 58 42 L68 22 Q70 18 76 18 L124 18 Q130 18 132 22 L142 42 Q150 44 152 52 L150 78 Z" },
  { t: "path", d: "M72 24 L128 24 L136 40 L64 40 Z" },
  { t: "rect", x: 54, y: 78, w: 16, h: 10, rx: 3 },
  { t: "rect", x: 130, y: 78, w: 16, h: 10, rx: 3 },
];

const frente: Forma[] = [
  ...frenteBase,
  { t: "ellipse", cx: 66, cy: 54, rx: 9, ry: 6 },
  { t: "ellipse", cx: 134, cy: 54, rx: 9, ry: 6 },
  { t: "path", d: "M82 52 L118 52 L116 62 L84 62 Z" },
  { t: "rect", x: 86, y: 66, w: 28, h: 8, rx: 1 },
];

const traseira: Forma[] = [
  ...frenteBase,
  { t: "rect", x: 56, y: 50, w: 20, h: 9, rx: 2 },
  { t: "rect", x: 124, y: 50, w: 20, h: 9, rx: 2 },
  { t: "rect", x: 84, y: 62, w: 32, h: 10, rx: 1 },
];

// Visto de cima, frente do carro para a esquerda (igual ao lado esquerdo)
const cima: Forma[] = [
  { t: "rect", x: 14, y: 16, w: 172, h: 64, rx: 20 },
  { t: "path", d: "M58 22 Q52 48 58 74 L72 68 Q68 48 72 28 Z" },
  { t: "rect", x: 74, y: 26, w: 62, h: 44, rx: 6 },
  { t: "path", d: "M150 26 Q156 48 150 70 L140 66 Q144 48 140 30 Z" },
  { t: "rect", x: 30, y: 8, w: 22, h: 8, rx: 3 },
  { t: "rect", x: 30, y: 80, w: 22, h: 8, rx: 3 },
  { t: "rect", x: 146, y: 8, w: 22, h: 8, rx: 3 },
  { t: "rect", x: 146, y: 80, w: 22, h: 8, rx: 3 },
];

export const DESENHOS: Record<VistaAvaria, { formas: Forma[]; espelhar?: boolean }> = {
  lateral_esquerda: { formas: lateral },
  lateral_direita: { formas: lateral, espelhar: true },
  frente: { formas: frente },
  traseira: { formas: traseira },
  cima: { formas: cima },
};

export const TIPOS_AVARIA = [
  { id: "risco", nome: "Risco", cor: "#d97706" },
  { id: "amassado", nome: "Amassado", cor: "#c81e1e" },
  { id: "quebrado", nome: "Quebrado", cor: "#7c2d12" },
  { id: "trincado", nome: "Trincado", cor: "#6d28d9" },
  { id: "faltando", nome: "Faltando", cor: "#1f2937" },
  { id: "ferrugem", nome: "Ferrugem", cor: "#92400e" },
  { id: "outro", nome: "Outro", cor: "#0e7490" },
] as const;

export type TipoAvaria = (typeof TIPOS_AVARIA)[number]["id"];

export function corDoTipo(tipo: string) {
  return TIPOS_AVARIA.find((t) => t.id === tipo)?.cor ?? "#c81e1e";
}
export function nomeDoTipo(tipo: string) {
  return TIPOS_AVARIA.find((t) => t.id === tipo)?.nome ?? tipo;
}
export function nomeDaVista(vista: string) {
  return VISTAS.find((v) => v.id === vista)?.nome ?? vista;
}
