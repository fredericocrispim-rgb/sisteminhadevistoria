"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario } from "@/components/vf";
import { textos } from "@/lib/textos";

/** Botões para mandar o link de indicação no WhatsApp ou copiar. */
export function CompartilharIndicacao({ link, mensagem }: { link: string; mensagem: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Navegador antigo: seleciona o texto para copiar
      const campo = document.createElement("textarea");
      campo.value = link;
      document.body.appendChild(campo);
      campo.select();
      document.execCommand("copy");
      campo.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 4000);
  }

  return (
    <div className="flex flex-col gap-2">
      <BotaoPrincipal nativo href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} icone={<MessageCircle aria-hidden />}>
        {textos.indicar.enviarWhatsapp}
      </BotaoPrincipal>
      <BotaoSecundario icone={copiado ? <Check aria-hidden /> : <Copy aria-hidden />} onClick={copiar}>
        {copiado ? textos.indicar.copiado : textos.indicar.copiarLink}
      </BotaoSecundario>
      <p className="text-center text-base break-all text-muted-foreground">{link}</p>
    </div>
  );
}
