/**
 * Prepara a foto no próprio celular antes de enviar:
 * - diminui para no máximo 1600 px (JPEG ~80%) — envia rápido mesmo no 4G fraco;
 * - grava na imagem o "carimbo": data, hora, placa e nome da oficina.
 */

function carregar(arquivo: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => reject(new Error("foto inválida"));
    img.src = url;
  });
}

export async function prepararFoto(arquivo: File, carimbo: string[]): Promise<{ blob: Blob; previa: string }> {
  const img = await carregar(arquivo);
  const escala = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const l = Math.round(img.naturalWidth * escala);
  const a = Math.round(img.naturalHeight * escala);

  const canvas = document.createElement("canvas");
  canvas.width = l;
  canvas.height = a;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, l, a);

  // Carimbo no canto de baixo
  const fonte = Math.max(14, Math.round(l / 45));
  ctx.font = `bold ${fonte}px system-ui, Arial, sans-serif`;
  const linhas = carimbo.filter(Boolean);
  const alturaLinha = fonte * 1.3;
  const larguraTexto = Math.max(...linhas.map((t) => ctx.measureText(t).width));
  const margem = fonte * 0.6;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, a - alturaLinha * linhas.length - margem * 2, larguraTexto + margem * 2, alturaLinha * linhas.length + margem * 2);
  ctx.fillStyle = "#ffffff";
  linhas.forEach((t, i) => ctx.fillText(t, margem, a - margem - alturaLinha * (linhas.length - 1 - i) - fonte * 0.25));

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("falha"))), "image/jpeg", 0.8),
  );
  return { blob, previa: URL.createObjectURL(blob) };
}

/** Localização do aparelho, se a pessoa permitir. Nunca trava: em 6 s desiste. */
export function pegarLocalizacao(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
    );
  });
}
