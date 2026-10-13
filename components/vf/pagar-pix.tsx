"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { formatarReais } from "@/lib/pix";

/**
 * Cartão de pagamento por Pix: valor grande, QR Code e botão "Copiar código Pix".
 * O código vem de gerarPixCopiaECola (lib/pix.ts).
 */
export function PagarPix({ codigo, valor, descricao }: { codigo: string; valor: number; descricao?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      // Navegador antigo: seleciona o texto para a pessoa copiar
      const campo = document.createElement("textarea");
      campo.value = codigo;
      document.body.appendChild(campo);
      campo.select();
      document.execCommand("copy");
      campo.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 4000);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-superficie p-5 text-center">
      <div>
        {descricao && <p className="text-lg font-semibold text-muted-foreground">{descricao}</p>}
        <p className="text-4xl font-extrabold">{formatarReais(valor)}</p>
      </div>
      <div className="rounded-2xl bg-white p-3">
        <QRCodeSVG value={codigo} size={208} level="M" aria-label={textos.pix.escaneie} />
      </div>
      <p className="text-lg font-semibold">{textos.pix.escaneie}</p>
      <button
        type="button"
        onClick={copiar}
        className={cn(
          "tocavel inline-flex min-h-toque-grande w-full items-center justify-center gap-3 rounded-2xl px-5 text-xl font-bold [&_svg]:size-7",
          copiado ? "bg-acao text-acao-texto" : "bg-oficina text-oficina-texto",
        )}
      >
        {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copiado ? textos.geral.copiado : textos.pix.copiarCodigo}
      </button>
      <p className="text-base text-muted-foreground" aria-live="polite">
        {copiado ? textos.pix.copiadoDica : textos.pix.aguardando}
      </p>
    </div>
  );
}
