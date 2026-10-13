/**
 * Arruma a logo no próprio aparelho (navegador), sem servidor:
 * 1. Recorta as bordas sobrando (fundo branco ou transparente).
 * 2. Gera 3 versões: app (512 px quadrada), PDF (até 600 px, fundo branco) e e-mail (até 300 px).
 * 3. Sugere a cor da oficina a partir da logo.
 */
import { corDominante, corSeguraParaTextoBranco } from "@/lib/cores";

export const TAMANHO_MAXIMO_LOGO = 5 * 1024 * 1024; // 5 MB

export type LogoProcessada = {
  app: Blob;
  pdf: Blob;
  email: Blob;
  original: Blob;
  previa: string; // URL temporária para mostrar na tela
  corSugerida: string | null;
};

function carregarImagem(arquivo: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem inválida"));
    img.src = url;
  });
}

function criarCanvas(l: number, a: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(l));
  canvas.height = Math.max(1, Math.round(a));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  return { canvas, ctx };
}

function paraBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("falha ao gerar imagem"))), "image/png"),
  );
}

/** Limites da parte "com desenho" (ignora fundo branco/transparente). */
function acharConteudo(dados: ImageData) {
  const { width: l, height: a, data } = dados;
  let x0 = l,
    y0 = a,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      const i = (y * l + x) * 4;
      const fundo = data[i + 3] < 16 || (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240);
      if (!fundo) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, l, a };
  const margem = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
  const x = Math.max(0, x0 - margem);
  const y = Math.max(0, y0 - margem);
  return { x, y, l: Math.min(l, x1 + margem + 1) - x, a: Math.min(a, y1 + margem + 1) - y };
}

/** Desenha a logo "contida" num retângulo, com fundo branco opcional. */
async function versao(fonte: HTMLCanvasElement, larguraMax: number, alturaMax: number, quadrada: boolean, fundoBranco: boolean) {
  const escala = Math.min(1, larguraMax / fonte.width, alturaMax / fonte.height);
  const lLogo = fonte.width * escala;
  const aLogo = fonte.height * escala;
  const l = quadrada ? larguraMax : lLogo;
  const a = quadrada ? alturaMax : aLogo;
  const { canvas, ctx } = criarCanvas(l, a);
  if (fundoBranco) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (quadrada) {
    // 10% de respiro em volta
    const e2 = Math.min((l * 0.8) / fonte.width, (a * 0.8) / fonte.height);
    const lw = fonte.width * e2;
    const ah = fonte.height * e2;
    ctx.drawImage(fonte, (l - lw) / 2, (a - ah) / 2, lw, ah);
  } else {
    ctx.drawImage(fonte, 0, 0, canvas.width, canvas.height);
  }
  return paraBlob(canvas);
}

export async function processarLogo(arquivo: File): Promise<LogoProcessada> {
  if (arquivo.size > TAMANHO_MAXIMO_LOGO) throw new Error("arquivo grande");
  if (!arquivo.type.startsWith("image/") && !arquivo.name.toLowerCase().endsWith(".svg")) throw new Error("não é imagem");

  const img = await carregarImagem(arquivo);
  const larguraNatural = img.naturalWidth || 1000;
  const alturaNatural = img.naturalHeight || 1000;

  // Reduz fotos muito grandes antes de trabalhar
  const reducao = Math.min(1, 2000 / Math.max(larguraNatural, alturaNatural));
  const base = criarCanvas(larguraNatural * reducao, alturaNatural * reducao);
  base.ctx.drawImage(img, 0, 0, base.canvas.width, base.canvas.height);
  URL.revokeObjectURL(img.src);

  const dados = base.ctx.getImageData(0, 0, base.canvas.width, base.canvas.height);
  const area = acharConteudo(dados);
  const recorte = criarCanvas(area.l, area.a);
  recorte.ctx.drawImage(base.canvas, area.x, area.y, area.l, area.a, 0, 0, area.l, area.a);

  const pixels = recorte.ctx.getImageData(0, 0, recorte.canvas.width, recorte.canvas.height).data;
  const cor = corDominante(pixels);

  const [app, pdf, email, original] = await Promise.all([
    versao(recorte.canvas, 512, 512, true, true),
    versao(recorte.canvas, 600, 300, false, true),
    versao(recorte.canvas, 300, 150, false, true),
    versao(recorte.canvas, 1200, 1200, false, false), // guardamos PNG (nunca o SVG original, por segurança)
  ]);

  return {
    app,
    pdf,
    email,
    original,
    previa: URL.createObjectURL(pdf),
    corSugerida: cor ? corSeguraParaTextoBranco(cor) : null,
  };
}
