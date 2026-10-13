"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, Home, RefreshCw, Send } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario } from "@/components/vf";
import { gerarPdfDeNovo, registrarEnvio } from "../../acoes";

export function AcoesPronto({
  vistoriaId,
  whatsappCliente,
  mensagem,
  linkPdf,
  linkPublico,
  enviada,
}: {
  vistoriaId: string;
  whatsappCliente: string | null;
  mensagem: string;
  linkPdf: string | null;
  linkPublico: string;
  enviada: boolean;
}) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [jaEnviou, setJaEnviou] = useState(enviada);
  const destino = whatsappCliente ? `https://wa.me/${whatsappCliente}` : "https://wa.me/";

  return (
    <div className="mt-4 flex w-full flex-col gap-3">
      {jaEnviou && <p className="rounded-2xl bg-acao-clara px-4 py-3 text-lg font-bold text-acao">Enviado pelo WhatsApp</p>}
      {linkPdf ? (
        <BotaoSecundario href={linkPdf} nativo icone={<FileText aria-hidden />}>
          Ver termo (PDF)
        </BotaoSecundario>
      ) : (
        <BotaoSecundario
          icone={<RefreshCw aria-hidden />}
          carregando={gerando}
          onClick={async () => {
            setGerando(true);
            await gerarPdfDeNovo(vistoriaId);
            setGerando(false);
            router.refresh();
          }}
        >
          Criar o PDF
        </BotaoSecundario>
      )}
      <BotaoSecundario href={linkPublico} icone={<Eye aria-hidden />}>
        Ver como o cliente vê
      </BotaoSecundario>
      <BotaoSecundario href="/inicio" icone={<Home aria-hidden />} className="bg-transparent">
        Voltar ao início
      </BotaoSecundario>

      <BotaoPrincipal
        fixo
        icone={<Send aria-hidden />}
        onClick={() => {
          window.open(`${destino}?text=${encodeURIComponent(mensagem)}`, "_blank");
          setJaEnviou(true);
          registrarEnvio(vistoriaId, whatsappCliente ?? "escolhido no WhatsApp");
        }}
      >
        {jaEnviou ? "Enviar de novo" : "Enviar para o cliente"}
      </BotaoPrincipal>
    </div>
  );
}
