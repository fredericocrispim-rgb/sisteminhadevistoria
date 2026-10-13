"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BotaoPrincipal, CaixaMarcar, Campo, CampoTelefone, MensagemErroCampo } from "@/components/vf";
import { telefoneValido } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import { salvarPasso1 } from "./acoes";
import type { EmpresaCadastro, UsuarioCadastro } from "./assistente";

const t = textos.cadastro.voce;

/** Passo 1: seu nome, seu WhatsApp e o nome da oficina. Só isso. */
export function PassoVoce({
  inicial,
  oficinaInicial,
  aoTerminar,
}: {
  inicial: UsuarioCadastro;
  oficinaInicial: string;
  aoTerminar: (empresa: EmpresaCadastro) => void;
}) {
  const [nome, setNome] = useState(inicial.nome);
  const [whatsapp, setWhatsapp] = useState(inicial.whatsapp);
  const [oficina, setOficina] = useState(oficinaInicial);
  const [aceite, setAceite] = useState(Boolean(oficinaInicial));
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
  const erroAceite = conferir && !aceite;

  async function continuar() {
    setConferir(true);
    if (nome.trim().length < 2 || !telefoneValido(whatsapp) || oficina.trim().length < 2 || !aceite) return;
    setCarregando(true);
    const r = await salvarPasso1({ nome, whatsapp, oficina, aceite: true });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    aoTerminar({ id: r.empresaId, nome: oficina.trim(), logo: null });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        continuar();
      }}
    >
      <Campo rotulo={t.nome} autoComplete="name" autoCapitalize="words" valor={nome} onValor={setNome} erro={erroNome} />
      <CampoTelefone rotulo={t.whatsapp} valor={whatsapp} onValor={setWhatsapp} erro={erroWhats} />
      <Campo
        rotulo={textos.cadastro.oficina.nome}
        dica={textos.cadastro.oficina.nomeDica}
        autoCapitalize="words"
        autoComplete="organization"
        valor={oficina}
        onValor={setOficina}
        erro={erroOficina}
      />
      <div className="flex flex-col gap-2">
        <CaixaMarcar marcado={aceite} onChange={setAceite} erro={erroAceite}>
          {t.aceite}{" "}
          <Link href="/termos" target="_blank" className="text-oficina underline underline-offset-4">
            {t.termos}
          </Link>{" "}
          {t.e}{" "}
          <Link href="/privacidade" target="_blank" className="text-oficina underline underline-offset-4">
            {t.privacidade}
          </Link>
        </CaixaMarcar>
        {erroAceite && <MensagemErroCampo>{t.erroAceite}</MensagemErroCampo>}
      </div>
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo type="submit" carregando={carregando} icone={<ArrowRight aria-hidden />}>
        {textos.cadastro.continuar}
      </BotaoPrincipal>
    </form>
  );
}
