"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home } from "lucide-react";
import { BotaoPrincipal, LogoOficina } from "@/components/vf";
import { textos } from "@/lib/textos";
import type { EmpresaCadastro } from "./assistente";

const t = textos.cadastro.pronto;

export function TelaPronto({ empresa, diasTeste }: { empresa: EmpresaCadastro; diasTeste: number }) {
  const router = useRouter();
  useEffect(() => router.prefetch("/inicio"), [router]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <div className="relative">
        <LogoOficina nome={empresa.nome} url={empresa.logo} cor={empresa.cor} tamanho="lg" />
        <CheckCircle2 aria-hidden className="absolute -right-3 -bottom-3 size-12 rounded-full bg-background text-acao" />
      </div>
      <h1 className="text-[2rem] font-extrabold">{t.titulo}</h1>
      <p className="text-xl text-muted-foreground">
        {t.texto}
        <br />
        {t.teste(diasTeste)}
      </p>
      <BotaoPrincipal
        fixo
        icone={<Home aria-hidden />}
        onClick={() => {
          router.push("/inicio");
          router.refresh();
        }}
      >
        {t.comecar}
      </BotaoPrincipal>
    </main>
  );
}
