"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraEtapas } from "@/components/vf";
import { textos } from "@/lib/textos";
import { PassoVoce } from "./passo-voce";
import { PassoLogo } from "./passo-logo";
import { TelaPronto } from "./tela-pronto";

export type EmpresaCadastro = { id: string; nome: string; logo: string | null };
export type UsuarioCadastro = { nome: string; whatsapp: string; email: string };

const etapas = [...textos.cadastro.etapas];

/** Cadastro em 2 passos: (1) você e a oficina, (2) logo. */
export function Assistente({
  passoInicial,
  usuario,
  empresaInicial,
  diasTeste,
  somenteEdicao,
}: {
  passoInicial: number;
  usuario: UsuarioCadastro;
  empresaInicial: EmpresaCadastro | null;
  diasTeste: number;
  /** Veio do menu "Mais" para trocar a logo: ao terminar, volta para o início. */
  somenteEdicao: boolean;
}) {
  const router = useRouter();
  const [passo, setPasso] = useState(passoInicial);
  const [empresa, setEmpresa] = useState(empresaInicial);

  function ir(p: number) {
    setPasso(p);
    window.scrollTo(0, 0);
  }

  function terminarEdicao() {
    router.push("/inicio");
    router.refresh();
  }

  if (passo === 3 && empresa) return <TelaPronto empresa={empresa} diasTeste={diasTeste} />;

  const voltar = somenteEdicao ? terminarEdicao : passo === 2 ? () => ir(1) : undefined;

  return (
    <>
      <BarraEtapas etapas={etapas} atual={passo} onVoltar={voltar} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-2">
        {passo === 1 && (
          <PassoVoce
            inicial={usuario}
            oficinaInicial={empresa?.nome ?? ""}
            aoTerminar={(e) => {
              setEmpresa((atual) => ({ ...e, logo: atual?.logo ?? null }));
              ir(2);
            }}
          />
        )}
        {passo === 2 && empresa && (
          <PassoLogo
            empresa={empresa}
            aoTerminar={(e) => {
              setEmpresa(e);
              if (somenteEdicao) terminarEdicao();
              else ir(3);
            }}
          />
        )}
      </main>
    </>
  );
}
