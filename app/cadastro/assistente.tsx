"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraEtapas } from "@/components/vf";
import { textos } from "@/lib/textos";
import { PassoVoce, type PerguntaVoce } from "./passo-voce";
import { PassoLogo } from "./passo-logo";
import { TelaPronto } from "./tela-pronto";

export type EmpresaCadastro = { id: string; nome: string; logo: string | null };
export type UsuarioCadastro = { nome: string; whatsapp: string; email: string };

/** Uma pergunta por tela: o título de cada tela é a própria pergunta. */
const perguntas = [...textos.cadastro.perguntas];
const TELA_LOGO = perguntas.length; // 4
const TELA_PRONTO = TELA_LOGO + 1;

/**
 * Cadastro em 4 telas: (1) seu nome, (2) seu WhatsApp, (3) nome da oficina, (4) logo.
 * `passoInicial` vem da página: 1 = começar do início, 2 = só falta a logo.
 */
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
  const [tela, setTela] = useState(passoInicial >= 2 ? TELA_LOGO : 1);
  const [empresa, setEmpresa] = useState(empresaInicial);
  const [voce, setVoce] = useState(usuario);

  function ir(p: number) {
    setTela(p);
    window.scrollTo(0, 0);
  }

  function terminarEdicao() {
    router.push("/inicio");
    router.refresh();
  }

  if (tela === TELA_PRONTO && empresa) return <TelaPronto empresa={empresa} diasTeste={diasTeste} />;

  const voltar = somenteEdicao ? terminarEdicao : tela > 1 ? () => ir(tela - 1) : undefined;

  return (
    <>
      {somenteEdicao ? (
        <BarraEtapas etapas={[textos.cadastro.logo.escolher]} atual={1} onVoltar={voltar} />
      ) : (
        <BarraEtapas etapas={perguntas} atual={tela} onVoltar={voltar} />
      )}
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-2">
        {/* Fica montado nas 3 primeiras telas para guardar o que já foi digitado */}
        {tela < TELA_LOGO && (
          <PassoVoce
            pergunta={tela as PerguntaVoce}
            inicial={voce}
            oficinaInicial={empresa?.nome ?? ""}
            aoAvancar={ir}
            aoTerminar={(e, dados) => {
              setVoce((atual) => ({ ...atual, ...dados }));
              setEmpresa((atual) => ({ ...e, logo: atual?.logo ?? null }));
              ir(TELA_LOGO);
            }}
          />
        )}
        {tela === TELA_LOGO && empresa && (
          <PassoLogo
            empresa={empresa}
            aoTerminar={(e) => {
              setEmpresa(e);
              if (somenteEdicao) terminarEdicao();
              else ir(TELA_PRONTO);
            }}
          />
        )}
      </main>
    </>
  );
}
