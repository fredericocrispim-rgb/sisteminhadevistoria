"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraEtapas } from "@/components/vf";
import { textos } from "@/lib/textos";
import { PassoVoce, type PerguntaVoce } from "./passo-voce";
import { PassoLogo } from "./passo-logo";
import { PassoPlano, type OpcaoPlano } from "./passo-plano";
import { TelaPronto } from "./tela-pronto";

export type EmpresaCadastro = { id: string; nome: string; logo: string | null };
export type UsuarioCadastro = { nome: string; whatsapp: string; email: string };

/** Uma pergunta por tela: o título de cada tela é a própria pergunta. */
const TELA_LOGO = textos.cadastro.perguntas.length; // 4
const TELA_PLANO = TELA_LOGO + 1; // 5 (só quando há mais de um plano à venda)

/**
 * Cadastro: (1) seu nome completo, (2) seu WhatsApp, (3) nome da oficina, (4) logo,
 * (5) escolha do plano (só com Básico e Pro à venda) e, no fim, a tela Tudo pronto (senha provisória e Pix).
 * `passoInicial` vem da página: 1 = começar do início, 2 = só falta a logo.
 */
export function Assistente({
  passoInicial,
  usuario,
  empresaInicial,
  diasTeste,
  planos,
  pagamentoAutomatico,
  somenteEdicao,
}: {
  passoInicial: number;
  usuario: UsuarioCadastro;
  empresaInicial: EmpresaCadastro | null;
  diasTeste: number;
  /** Planos à venda (Básico e, com o vídeo ligado, o Pro). */
  planos: OpcaoPlano[];
  /** Asaas ligado: "Escolher como pagar" (Pix, cartão ou boleto) em vez do Pix manual. */
  pagamentoAutomatico: boolean;
  /** Veio do menu "Mais" para trocar a logo: ao terminar, volta para o início. */
  somenteEdicao: boolean;
}) {
  const router = useRouter();
  const escolherPlano = planos.length > 1;
  const perguntas = escolherPlano ? [...textos.cadastro.perguntas, textos.cadastro.plano.titulo] : [...textos.cadastro.perguntas];
  const TELA_PRONTO = perguntas.length + 1;
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

  if (tela === TELA_PRONTO && empresa) return <TelaPronto empresa={empresa} diasTeste={diasTeste} pagamentoAutomatico={pagamentoAutomatico} />;

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
              else ir(escolherPlano ? TELA_PLANO : TELA_PRONTO);
            }}
          />
        )}
        {tela === TELA_PLANO && escolherPlano && <PassoPlano planos={planos} aoTerminar={() => ir(TELA_PRONTO)} />}
      </main>
    </>
  );
}
