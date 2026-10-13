"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BotaoPrincipal, CaixaMarcar, Campo, CampoTelefone, MensagemErroCampo } from "@/components/vf";
import { telefoneValido } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import { salvarVoce } from "./acoes";
import type { UsuarioCadastro } from "./assistente";

const t = textos.cadastro.voce;

export function PassoVoce({
  inicial,
  aoTerminar,
}: {
  inicial: UsuarioCadastro;
  aoTerminar: (d: { nome: string; whatsapp: string }) => void;
}) {
  const [nome, setNome] = useState(inicial.nome);
  const [whatsapp, setWhatsapp] = useState(inicial.whatsapp);
  const [aceite, setAceite] = useState(false);
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
  const erroAceite = conferir && !aceite;

  async function continuar() {
    setConferir(true);
    if (nome.trim().length < 2 || !telefoneValido(whatsapp) || !aceite) return;
    setCarregando(true);
    const r = await salvarVoce({ nome, whatsapp, aceite: true });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    aoTerminar({ nome: nome.trim(), whatsapp });
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
      <p className="-mt-3 text-base text-muted-foreground">{inicial.email}</p>
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
