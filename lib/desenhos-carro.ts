/**
 * Desenhos ORIGINAIS do carro, da moto e do caminhão (linhas simples) usados no mapa de avarias
 * (e, para moto e caminhão, também como guia das fotos).
 * Os mesmos dados desenham a tela (SVG) e o PDF, para as marcações ficarem no mesmo lugar.
 * Área de desenho: 200 x 96. Posições das avarias são guardadas em % (x, y).
 */

/** `p` só muda o estilo no guia das fotos: roda (cheia), cubo (branco), vidro. O mapa ignora. */
type Estilo = { p?: "roda" | "cubo" | "vidro" };
export type Forma = Estilo &
  (
    | { t: "path"; d: string }
    | { t: "circle"; cx: number; cy: number; r: number }
    | { t: "rect"; x: number; y: number; w: number; h: number; rx?: number }
    | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  );

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

/* ---------- Motocicleta ---------- */

const motoLateral: Forma[] = [
  { t: "path", d: "M66 34 Q74 26 92 26 L110 28 Q116 30 118 34 L150 34 Q164 34 170 40 L166 44 L118 44 L112 50 L76 50 Z" },
  { t: "rect", x: 80, y: 50, w: 30, h: 18, rx: 4 },
  { t: "path", d: "M42 66 L60 24" },
  { t: "path", d: "M52 22 L68 18" },
  { t: "path", d: "M62 21 L57 11" },
  { t: "ellipse", cx: 63, cy: 34, rx: 6, ry: 5, p: "vidro" },
  { t: "path", d: "M24 56 Q40 40 58 52" },
  { t: "path", d: "M140 44 Q160 40 174 52" },
  { t: "path", d: "M110 58 L156 66" },
  { t: "path", d: "M98 70 Q124 70 150 60" },
  { t: "circle", cx: 42, cy: 66, r: 20, p: "roda" },
  { t: "circle", cx: 156, cy: 66, r: 20, p: "roda" },
  { t: "circle", cx: 42, cy: 66, r: 7, p: "cubo" },
  { t: "circle", cx: 156, cy: 66, r: 7, p: "cubo" },
];

const motoFrente: Forma[] = [
  { t: "path", d: "M80 30 Q100 14 120 30 L116 50 Q100 56 84 50 Z" },
  { t: "path", d: "M90 56 L94 50 M110 56 L106 50" },
  { t: "path", d: "M50 28 L80 30 M120 30 L150 28" },
  { t: "rect", x: 38, y: 24, w: 13, h: 8, rx: 3 },
  { t: "rect", x: 149, y: 24, w: 13, h: 8, rx: 3 },
  { t: "path", d: "M68 29 L62 15 M132 29 L138 15" },
  { t: "ellipse", cx: 60, cy: 11, rx: 7, ry: 5, p: "vidro" },
  { t: "ellipse", cx: 140, cy: 11, rx: 7, ry: 5, p: "vidro" },
  { t: "circle", cx: 100, cy: 38, r: 8, p: "vidro" },
  { t: "rect", x: 70, y: 40, w: 9, h: 5, rx: 2 },
  { t: "rect", x: 121, y: 40, w: 9, h: 5, rx: 2 },
  { t: "path", d: "M86 62 Q100 54 114 62" },
  { t: "rect", x: 92, y: 60, w: 16, h: 32, rx: 7, p: "roda" },
];

const motoTraseira: Forma[] = [
  { t: "path", d: "M76 34 Q100 22 124 34 L118 50 L82 50 Z" },
  { t: "path", d: "M50 22 L150 22" },
  { t: "rect", x: 38, y: 18, w: 13, h: 8, rx: 3 },
  { t: "rect", x: 149, y: 18, w: 13, h: 8, rx: 3 },
  { t: "rect", x: 88, y: 36, w: 24, h: 7, rx: 3 },
  { t: "rect", x: 66, y: 40, w: 9, h: 5, rx: 2 },
  { t: "rect", x: 125, y: 40, w: 9, h: 5, rx: 2 },
  { t: "rect", x: 84, y: 52, w: 32, h: 14, rx: 2 },
  { t: "ellipse", cx: 134, cy: 72, rx: 11, ry: 6 },
  { t: "rect", x: 92, y: 66, w: 16, h: 26, rx: 7, p: "roda" },
];

const motoCima: Forma[] = [
  { t: "ellipse", cx: 88, cy: 48, rx: 22, ry: 14 },
  { t: "rect", x: 108, y: 38, w: 50, h: 20, rx: 9 },
  { t: "path", d: "M54 20 L54 76" },
  { t: "rect", x: 49, y: 12, w: 10, h: 10, rx: 3 },
  { t: "rect", x: 49, y: 74, w: 10, h: 10, rx: 3 },
  { t: "circle", cx: 44, cy: 26, r: 4 },
  { t: "circle", cx: 44, cy: 70, r: 4 },
  { t: "rect", x: 12, y: 42, w: 40, h: 12, rx: 6, p: "roda" },
  { t: "rect", x: 150, y: 42, w: 42, h: 12, rx: 6, p: "roda" },
];

/* ---------- Caminhão ---------- */

const caminhaoLateral: Forma[] = [
  { t: "path", d: "M12 72 L12 34 Q12 20 26 18 L58 16 Q66 16 66 26 L66 72 Z" },
  { t: "rect", x: 70, y: 10, w: 120, h: 58, rx: 3 },
  { t: "path", d: "M18 24 L56 22 L58 42 L18 44 Z", p: "vidro" },
  { t: "path", d: "M66 70 L190 70" },
  { t: "rect", x: 8, y: 62, w: 10, h: 9, rx: 2 },
  { t: "circle", cx: 38, cy: 76, r: 13, p: "roda" },
  { t: "circle", cx: 140, cy: 76, r: 13, p: "roda" },
  { t: "circle", cx: 168, cy: 76, r: 13, p: "roda" },
  { t: "circle", cx: 38, cy: 76, r: 5, p: "cubo" },
  { t: "circle", cx: 140, cy: 76, r: 5, p: "cubo" },
  { t: "circle", cx: 168, cy: 76, r: 5, p: "cubo" },
];

const caminhaoFrente: Forma[] = [
  { t: "rect", x: 46, y: 8, w: 108, h: 68, rx: 10 },
  { t: "rect", x: 54, y: 16, w: 92, h: 28, rx: 4, p: "vidro" },
  { t: "rect", x: 72, y: 50, w: 56, h: 18, rx: 2 },
  { t: "path", d: "M76 56 L124 56 M76 62 L124 62" },
  { t: "rect", x: 54, y: 52, w: 14, h: 9, rx: 3 },
  { t: "rect", x: 132, y: 52, w: 14, h: 9, rx: 3 },
  { t: "rect", x: 44, y: 76, w: 112, h: 8, rx: 3 },
  { t: "rect", x: 30, y: 18, w: 10, h: 22, rx: 3 },
  { t: "rect", x: 160, y: 18, w: 10, h: 22, rx: 3 },
  { t: "path", d: "M40 24 L46 24 M154 24 L160 24" },
  { t: "rect", x: 50, y: 84, w: 18, h: 10, rx: 3, p: "roda" },
  { t: "rect", x: 132, y: 84, w: 18, h: 10, rx: 3, p: "roda" },
];

const caminhaoTraseira: Forma[] = [
  { t: "rect", x: 40, y: 6, w: 120, h: 72, rx: 3 },
  { t: "path", d: "M100 6 L100 78" },
  { t: "path", d: "M92 30 L92 54 M108 30 L108 54" },
  { t: "rect", x: 46, y: 68, w: 14, h: 7, rx: 2 },
  { t: "rect", x: 140, y: 68, w: 14, h: 7, rx: 2 },
  { t: "rect", x: 86, y: 64, w: 28, h: 11, rx: 1 },
  { t: "rect", x: 38, y: 79, w: 124, h: 6, rx: 2 },
  { t: "rect", x: 48, y: 85, w: 22, h: 9, rx: 3, p: "roda" },
  { t: "rect", x: 130, y: 85, w: 22, h: 9, rx: 3, p: "roda" },
];

const caminhaoCima: Forma[] = [
  { t: "rect", x: 10, y: 22, w: 46, h: 52, rx: 8 },
  { t: "path", d: "M18 28 Q13 48 18 68", p: "vidro" },
  { t: "rect", x: 60, y: 14, w: 130, h: 68, rx: 3 },
  { t: "rect", x: 24, y: 13, w: 9, h: 8, rx: 2 },
  { t: "rect", x: 24, y: 75, w: 9, h: 8, rx: 2 },
];

const DESENHOS_MOTO: typeof DESENHOS = {
  lateral_esquerda: { formas: motoLateral },
  lateral_direita: { formas: motoLateral, espelhar: true },
  frente: { formas: motoFrente },
  traseira: { formas: motoTraseira },
  cima: { formas: motoCima },
};

const DESENHOS_CAMINHAO: typeof DESENHOS = {
  lateral_esquerda: { formas: caminhaoLateral },
  lateral_direita: { formas: caminhaoLateral, espelhar: true },
  frente: { formas: caminhaoFrente },
  traseira: { formas: caminhaoTraseira },
  cima: { formas: caminhaoCima },
};

/** Desenhos do veículo certo (carro, moto ou caminhão). */
export function desenhosDo(tipo: string | null | undefined) {
  return tipo === "moto" ? DESENHOS_MOTO : tipo === "caminhao" ? DESENHOS_CAMINHAO : DESENHOS;
}

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
