"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { BotaoPrincipal, MensagemErroCampo } from "@/components/vf";
import { textos } from "@/lib/textos";
import { aceitarConvite } from "./acoes";

export function BotaoAceitar({ token }: { token: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();
  return (
    <>
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal
        fixo
        carregando={carregando}
        icone={<Check aria-hidden />}
        onClick={async () => {
          setCarregando(true);
          const r = await aceitarConvite(token);
          if (!r.ok) {
            setCarregando(false);
            return setErro(r.erro);
          }
          router.replace("/inicio");
          router.refresh();
        }}
      >
        {textos.convite.aceitar}
      </BotaoPrincipal>
    </>
  );
}
