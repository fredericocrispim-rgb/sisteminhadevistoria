"use client";
/* eslint-disable @next/next/no-img-element -- prévia local da logo */

import { useRef, useState } from "react";
import { ArrowRight, ImageUp, Loader2, RefreshCw } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, MensagemErroCampo } from "@/components/vf";
import { processarLogo, type LogoProcessada } from "@/lib/logo-imagem";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { textos } from "@/lib/textos";
import { salvarLogo } from "./acoes";
import type { EmpresaCadastro } from "./assistente";

const t = textos.cadastro.logo;

/** Passo 2: logo da empresa (no celular, o botão oferece câmera ou galeria). Cores: sempre as do Sisteminha. */
export function PassoLogo({ empresa, aoTerminar }: { empresa: EmpresaCadastro; aoTerminar: (e: EmpresaCadastro) => void }) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<LogoProcessada | null>(null);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();

  const previa = logo?.previa ?? empresa.logo;

  async function aoEscolher(lista: FileList | null) {
    const f = lista?.[0];
    if (arquivo.current) arquivo.current.value = "";
    if (!f) return;
    setErro(undefined);
    setProcessando(true);
    try {
      setLogo(await processarLogo(f));
    } catch {
      setErro(t.erroArquivo);
    } finally {
      setProcessando(false);
    }
  }

  async function continuar() {
    if (!logo) return aoTerminar(empresa);
    setSalvando(true);
    setErro(undefined);
    try {
      const supabase = criarClienteNavegador();
      const marca = Date.now();
      const enviar = async (tipo: "app" | "pdf" | "email" | "original", blob: Blob) => {
        const caminho = `${empresa.id}/logo-${tipo}-${marca}.png`;
        const { error } = await supabase.storage.from("marcas").upload(caminho, blob, { contentType: "image/png", upsert: true });
        if (error) throw error;
        return supabase.storage.from("marcas").getPublicUrl(caminho).data.publicUrl;
      };
      const [app, pdf, email, original] = await Promise.all([
        enviar("app", logo.app),
        enviar("pdf", logo.pdf),
        enviar("email", logo.email),
        enviar("original", logo.original),
      ]);
      const r = await salvarLogo({ logos: { app, pdf, email, original } });
      if (!r.ok) throw new Error(r.erro);
      aoTerminar({ ...empresa, logo: app });
    } catch {
      setErro("Não deu certo. Confira a internet e tente de novo.");
      setSalvando(false);
    }
  }

  const entrada = <input ref={arquivo} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => aoEscolher(e.target.files)} />;

  if (processando) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Loader2 aria-hidden className="size-12 animate-spin text-oficina" />
        <p className="text-xl font-bold">{t.processando}</p>
      </div>
    );
  }

  // Ainda sem logo: um botão grande
  if (!previa) {
    return (
      <div className="flex flex-col gap-3">
        {entrada}
        <button
          type="button"
          onClick={() => arquivo.current?.click()}
          className="tocavel flex min-h-48 flex-col items-center justify-center gap-3 rounded-3xl bg-oficina text-2xl font-extrabold text-oficina-texto [&_svg]:size-14"
        >
          <ImageUp aria-hidden />
          {t.escolher}
        </button>
        {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
        <BotaoSecundario className="mt-2 bg-transparent text-muted-foreground" onClick={() => aoTerminar(empresa)}>
          {t.semLogo}
        </BotaoSecundario>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {entrada}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.comoFica}</h2>
        <div className="flex flex-col gap-3 rounded-3xl bg-superficie p-4">
          <div className="flex items-center gap-3">
            <img src={previa} alt="" className="size-14 shrink-0 rounded-2xl bg-white object-contain p-1" />
            <span className="text-lg font-extrabold">{empresa.nome}</span>
          </div>
          {/* Cabeçalho do termo em PDF */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-3 p-3">
              <img src={previa} alt="" className="h-10 max-w-28 object-contain" />
              <div className="min-w-0 text-[0.7rem] leading-tight text-neutral-700">
                <p className="truncate font-bold text-neutral-900">{empresa.nome}</p>
                <p>Termo de Vistoria – CHEGADA</p>
              </div>
            </div>
            <div className="h-1.5 bg-oficina" />
          </div>
        </div>
      </section>

      <BotaoSecundario icone={<RefreshCw aria-hidden />} onClick={() => arquivo.current?.click()}>
        {t.trocar}
      </BotaoSecundario>

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo carregando={salvando} icone={<ArrowRight aria-hidden />} onClick={continuar}>
        {textos.cadastro.continuar}
      </BotaoPrincipal>
    </div>
  );
}

