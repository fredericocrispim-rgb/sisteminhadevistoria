/** Cores da oficina: a cor precisa deixar o texto BRANCO legível (contraste mínimo 4,5). */

export type Rgb = [number, number, number];

export function hexParaRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbParaHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function luminancia([r, g, b]: Rgb): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a: string, b: string): number {
  const la = luminancia(hexParaRgb(a));
  const lb = luminancia(hexParaRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Escurece a cor até o texto branco ficar legível. */
export function corSeguraParaTextoBranco(hex: string): string {
  let rgb = hexParaRgb(hex);
  for (let i = 0; i < 30 && contraste(rgbParaHex(rgb), "#ffffff") < 4.5; i++) {
    rgb = rgb.map((v) => v * 0.9) as Rgb;
  }
  return rgbParaHex(rgb);
}

/**
 * Cor mais marcante de uma imagem (pixels RGBA do canvas).
 * Ignora transparente, quase branco, quase preto e cinzas.
 */
export function corDominante(pixels: Uint8ClampedArray): string | null {
  const baldes = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (a < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 235 && min > 235) continue; // branco
    if (max < 35) continue; // preto
    if (max - min < 30) continue; // cinza
    const chave = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const balde = baldes.get(chave) ?? { n: 0, r: 0, g: 0, b: 0 };
    balde.n++;
    balde.r += r;
    balde.g += g;
    balde.b += b;
    baldes.set(chave, balde);
  }
  let melhor: { n: number; r: number; g: number; b: number } | null = null;
  for (const b of baldes.values()) if (!melhor || b.n > melhor.n) melhor = b;
  if (!melhor) return null;
  return rgbParaHex([melhor.r / melhor.n, melhor.g / melhor.n, melhor.b / melhor.n]);
}

/** 8 cores prontas para a oficina escolher (todas com texto branco legível). */
export const CORES_PRONTAS = [
  "#2563eb", // azul (cor da marca)
  "#0f2f57", // azul-marinho
  "#0e7490", // petróleo
  "#15803d", // verde
  "#b91c1c", // vermelho
  "#c2410c", // laranja
  "#6d28d9", // roxo
  "#1f2937", // grafite
] as const;

/** Iniciais para o monograma: "Auto Center Silva" → "AS". */
export function iniciais(nome: string): string {
  const ignorar = new Set(["DE", "DA", "DO", "DAS", "DOS", "E", "LTDA", "ME", "EIRELI", "EPP", "SA", "S/A"]);
  const palavras = nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^A-Z0-9]+/)
    .filter((p) => p && !ignorar.has(p));
  if (palavras.length === 0) return "?";
  if (palavras.length === 1) return palavras[0].slice(0, 2);
  return palavras[0][0] + palavras[palavras.length - 1][0];
}
