"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BotaoPrincipal, Campo, CampoTelefone, MensagemErroCampo } from "@/components/vf";
import { telefoneValido } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import { salvarPasso1 } from "./acoes";
import type { EmpresaCadastro, UsuarioCadastro } from "./assistente";

const t = textos.cadastro.voce;

/** Qual pergunta está na tela: 1 = seu nome, 2 = seu WhatsApp, 3 = nome da oficina. */
export type PerguntaVoce = 1 | 2 | 3;

/**
 * Seu nome, seu WhatsApp e o nome da oficina: UMA pergunta por tela.
 * Os dados ficam guardados aqui (o Assistente troca só a pergunta); na 3ª, salva tudo de uma vez.
 * O aceite dos termos fica escrito embaixo do último botão (sem caixinha para marcar).
 */
export function PassoVoce({
  pergunta,
  inicial,
  oficinaInicial,
  aoAvancar,
  aoTerminar,
}: {
  pergunta: PerguntaVoce;
  inicial: UsuarioCadastro;
  oficinaInicial: string;
  aoAvancar: (proxima: PerguntaVoce) => void;
  aoTerminar: (empresa: EmpresaCadastro, voce: { nome: string; whatsapp: string }) => void;
}) {
  const [nome, setNome] = useState(inicial.nome);
  const [whatsapp, setWhatsapp] = useState(inicial.whatsapp);
  const [oficina, setOficina] = useState(oficinaInicial);
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  const erroNome = conferir && nome.trim().length < 2 ? t.erroNome : undefined;
  const erroWhats = conferir
    ? !whatsapp
      ? textos.erros.telefoneFalta
      : !telefoneValido(whatsapp)
        ? textos.erros.telefoneInvalido
        : undefined
    : undefined;
  const erroOficina = conferir && oficina.trim().length < 2 ? textos.cadastro.oficina.erroNome : undefined;

  async function avancar() {
    setConferir(true);
    setErro(undefined);
    if (pergunta === 1) {
      if (nome.trim().length < 2) return;
      setConferir(false);
      return aoAvancar(2);
    }
    if (pergunta === 2) {
      if (!telefoneValido(whatsapp)) return;
      setConferir(false);
      return aoAvancar(3);
    }
    if (oficina.trim().length < 2) return;
    // Se faltou algo de uma tela anterior, leva até ela
    if (nome.trim().length < 2) return aoAvancar(1);
    if (!telefoneValido(whatsapp)) return aoAvancar(2);
    setCarregando(true);
    const r = await salvarPasso1({ nome, whatsapp, oficina, aceite: true });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    aoTerminar({ id: r.empresaId, nome: oficina.trim(), logo: null }, { nome: nome.trim(), whatsapp });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        avancar();
      }}
    >
      {pergunta === 1 && (
        <Campo
          key="nome"
          rotulo={t.nome}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          autoFocus
          valor={nome}
          onValor={setNome}
          erro={erroNome}
        />
      )}
      {pergunta === 2 && (
        <CampoTelefone
          key="whatsapp"
          rotulo={t.whatsapp}
          dica={t.whatsappDica}
          enterKeyHint="next"
          autoFocus
          valor={whatsapp}
          onValor={setWhatsapp}
          erro={erroWhats}
        />
      )}
      {pergunta === 3 && (
        <Campo
          key="oficina"
          rotulo={textos.cadastro.oficina.nome}
          dica={textos.cadastro.oficina.nomeDica}
          autoCapitalize="words"
          autoComplete="organization"
          enterKeyHint="go"
          autoFocus
          valor={oficina}
          onValor={setOficina}
          erro={erroOficina}
        />
      )}
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      {/* Logo abaixo do campo (sem `fixo`): preso no rodapé, o teclado do celular tampava o botão */}
      <BotaoPrincipal type="submit" carregando={carregando} icone={<ArrowRight aria-hidden />}>
        {textos.cadastro.proximo}
      </BotaoPrincipal>
      {pergunta === 3 && (
        <p className="text-base text-muted-foreground">
          {t.aceiteAoContinuar}{" "}
          <Link href="/termos" target="_blank" className="text-oficina underline underline-offset-4">
            {t.termos}
          </Link>{" "}
          {t.e}{" "}
          <Link href="/privacidade" target="_blank" className="text-oficina underline underline-offset-4">
            {t.privacidade}
          </Link>
          .
        </p>
      )}
    </form>
  );
}
