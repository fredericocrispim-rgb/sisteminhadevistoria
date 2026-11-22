"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PagarPix } from "@/components/vf";
import { textos } from "@/lib/textos";
import { qrCodeDaFatura } from "../../assinar/acoes";

const INTERVALO = 3000;
const TENTATIVAS = 20; // ~1 minuto

/**
 * O Asaas leva alguns segundos para gerar o QR Code de uma cobrança nova.
 * Se ele ainda não estava pronto quando a página abriu, esta parte pergunta de novo
 * a cada 3 s e mostra o QR Code assim que ficar pronto.
 */
export function QrPixAguardando({ faturaId, valor }: { faturaId: string; valor: number }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [desistiu, setDesistiu] = useState(false);

  useEffect(() => {
    let vez = 0;
    let parar = false;
    const timer = setInterval(async () => {
      vez += 1;
      try {
        const c = await qrCodeDaFatura(faturaId);
        if (parar) return;
        if (c) {
          setCodigo(c);
          clearInterval(timer);
          return;
        }
      } catch {
        // sem internet: tenta de novo na próxima volta
      }
      if (vez >= TENTATIVAS) {
        setDesistiu(true);
        clearInterval(timer);
      }
    }, INTERVALO);
    return () => {
      parar = true;
      clearInterval(timer);
    };
  }, [faturaId]);

  if (codigo) return <PagarPix codigo={codigo} valor={valor} descricao="Mensalidade" />;
  if (desistiu) return <p className="rounded-3xl bg-superficie p-5 text-center text-lg font-semibold">{textos.assinatura.qrSemResposta}</p>;
  return (
    <div role="status" className="flex items-center justify-center gap-3 rounded-3xl bg-superficie p-5 text-lg font-semibold">
      <Loader2 aria-hidden className="size-7 shrink-0 animate-spin" /> {textos.assinatura.gerandoQr}
    </div>
  );
}
