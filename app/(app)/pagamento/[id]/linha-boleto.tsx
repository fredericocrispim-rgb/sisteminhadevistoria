"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { BotaoSecundario } from "@/components/vf";
import { textos } from "@/lib/textos";

/** Linha digitável do boleto, com botão para copiar e colar no app do banco. */
export function LinhaBoleto({ linha }: { linha: string }) {
  const t = textos.assinatura;
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linha);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 3000);
    } catch {
      // Navegador antigo: a pessoa seleciona o texto à mão
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-superficie p-4">
      <p className="text-lg font-bold">{t.linhaDigitavel}</p>
      <p className="font-mono text-lg font-semibold break-all select-all">{linha}</p>
      <BotaoSecundario icone={copiada ? <Check aria-hidden /> : <Copy aria-hidden />} onClick={copiar}>
        {copiada ? t.linhaCopiada : t.copiarLinha}
      </BotaoSecundario>
    </div>
  );
}
