"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraEtapas } from "@/components/vf";
import { textos } from "@/lib/textos";
import { PassoVoce } from "./passo-voce";
import { PassoOficina } from "./passo-oficina";
import { PassoLogo } from "./passo-logo";
import { PassoEquipe } from "./passo-equipe";
import { TelaPronto } from "./tela-pronto";

export type EmpresaCadastro = { id: string; nome: string; cor: string; logo: string | null };
export type UsuarioCadastro = { nome: string; whatsapp: string; email: string };

const etapas = [...textos.cadastro.etapas];

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
  /** Veio do menu "Mais" para trocar logo ou convidar: ao terminar, volta para o início. */
  somenteEdicao: boolean;
}) {
  const router = useRouter();
  const [passo, setPasso] = useState(passoInicial);
  const [empresa, setEmpresa] = useState(empresaInicial);
  const [eu, setEu] = useState(usuario);

  function ir(p: number) {
    setPasso(p);
    window.scrollTo(0, 0);
  }

  function terminarEdicao() {
    router.push("/inicio");
    router.refresh();
  }

  if (passo === 5 && empresa) return <TelaPronto empresa={empresa} diasTeste={diasTeste} />;

  const voltar = passo === 2 ? () => ir(1) : passo === 4 && !somenteEdicao ? () => ir(3) : somenteEdicao ? terminarEdicao : undefined;

  return (
    <>
      <BarraEtapas etapas={etapas} atual={passo} onVoltar={voltar} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-2">
        {passo === 1 && (
          <PassoVoce
            inicial={eu}
            aoTerminar={(dados) => {
              setEu((u) => ({ ...u, ...dados }));
              ir(empresa ? 3 : 2);
            }}
          />
        )}
        {passo === 2 && (
          <PassoOficina
            whatsappUsuario={eu.whatsapp}
            aoTerminar={(e) => {
              setEmpresa(e);
              ir(3);
            }}
          />
        )}
        {passo === 3 && empresa && (
          <PassoLogo
            empresa={empresa}
            aoTerminar={(e) => {
              setEmpresa(e);
              if (somenteEdicao) terminarEdicao();
              else ir(4);
            }}
          />
        )}
        {passo === 4 && empresa && (
          <PassoEquipe empresa={empresa} aoTerminar={() => (somenteEdicao ? terminarEdicao() : ir(5))} />
        )}
      </main>
    </>
  );
}
