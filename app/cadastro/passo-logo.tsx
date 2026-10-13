"use client";
/* eslint-disable @next/next/no-img-element -- prévia local da logo */

import { useRef, useState } from "react";
import { ArrowRight, Camera, Check, ImageUp, Loader2, LogIn, RefreshCw } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, LogoOficina, MensagemErroCampo } from "@/components/vf";
import { CORES_PRONTAS, corSeguraParaTextoBranco } from "@/lib/cores";
import { processarLogo, type LogoProcessada } from "@/lib/logo-imagem";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { salvarLogo } from "./acoes";
import type { EmpresaCadastro } from "./assistente";

const t = textos.cadastro.logo;

export function PassoLogo({ empresa, aoTerminar }: { empresa: EmpresaCadastro; aoTerminar: (e: EmpresaCadastro) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<LogoProcessada | null>(null);
  const [semLogo, setSemLogo] = useState(false);
  const [cor, setCor] = useState(empresa.cor);
  const [sugerida, setSugerida] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();

  const temLogo = Boolean(logo || empresa.logo);
  const escolhendo = !temLogo && !semLogo;
  const previa = logo?.previa ?? empresa.logo;

  async function aoEscolher(lista: FileList | null) {
    const f = lista?.[0];
    if (!f) return;
    setErro(undefined);
    setProcessando(true);
    try {
      const p = await processarLogo(f);
      setLogo(p);
      setSemLogo(false);
      if (p.corSugerida) {
        setSugerida(p.corSugerida);
        setCor(p.corSugerida);
      }
    } catch {
      setErro(t.erroArquivo);
    } finally {
      setProcessando(false);
      if (camera.current) camera.current.value = "";
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  async function continuar() {
    setSalvando(true);
    setErro(undefined);
    try {
      let logos = null;
      if (logo) {
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
        logos = { app, pdf, email, original };
      }
      const r = await salvarLogo({ cor, logos });
      if (!r.ok) throw new Error(r.erro);
      aoTerminar({ ...empresa, cor: corSeguraParaTextoBranco(cor), logo: logos?.app ?? empresa.logo });
    } catch {
      setErro("Não deu certo. Confira a internet e tente de novo.");
      setSalvando(false);
    }
  }

  const entradas = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => aoEscolher(e.target.files)} />
      <input ref={arquivo} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => aoEscolher(e.target.files)} />
    </>
  );

  if (processando) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Loader2 aria-hidden className="size-12 animate-spin text-oficina" />
        <p className="text-xl font-bold">{t.processando}</p>
      </div>
    );
  }

  if (escolhendo) {
    return (
      <div className="flex flex-col gap-3">
        {entradas}
        <button
          type="button"
          onClick={() => camera.current?.click()}
          className="tocavel flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl bg-oficina text-xl font-extrabold text-oficina-texto [&_svg]:size-12"
        >
          <Camera aria-hidden />
          {t.tirarFoto}
        </button>
        <button
          type="button"
          onClick={() => arquivo.current?.click()}
          className="tocavel flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl bg-superficie text-xl font-extrabold [&_svg]:size-10"
        >
          <ImageUp aria-hidden />
          {t.escolher}
        </button>
        {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
        <BotaoSecundario className="mt-2 bg-transparent text-muted-foreground" onClick={() => setSemLogo(true)}>
          {t.semLogo}
        </BotaoSecundario>
      </div>
    );
  }

  const cores = sugerida && !CORES_PRONTAS.includes(sugerida as (typeof CORES_PRONTAS)[number]) ? [sugerida, ...CORES_PRONTAS] : [...CORES_PRONTAS];

  return (
    <div className="flex flex-col gap-6">
      {entradas}

      {/* Prévia: como fica no app e no documento */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.comoFica}</h2>
        <div className="flex flex-col gap-3 rounded-3xl bg-superficie p-4">
          <div className="flex items-center gap-3">
            {previa ? (
              <img src={previa} alt="" className="size-12 shrink-0 rounded-2xl bg-white object-contain p-1" />
            ) : (
              <LogoOficina nome={empresa.nome} cor={corSeguraParaTextoBranco(cor)} />
            )}
            <span className="text-lg font-extrabold">{empresa.nome}</span>
          </div>
          <div
            className="flex min-h-20 items-center justify-center gap-2 rounded-2xl text-xl font-extrabold text-white [&_svg]:size-8"
            style={{ backgroundColor: corSeguraParaTextoBranco(cor) }}
          >
            <LogIn aria-hidden /> {textos.vistoria.chegadaBotao}
          </div>
          {/* Cabeçalho do termo em PDF */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-3 p-3">
              {previa ? (
                <img src={previa} alt="" className="h-10 max-w-28 object-contain" />
              ) : (
                <LogoOficina nome={empresa.nome} cor={corSeguraParaTextoBranco(cor)} tamanho="sm" />
              )}
              <div className="min-w-0 text-[0.7rem] leading-tight text-neutral-700">
                <p className="truncate font-bold text-neutral-900">{empresa.nome}</p>
                <p>Termo de Vistoria – CHEGADA</p>
              </div>
            </div>
            <div className="h-1.5" style={{ backgroundColor: corSeguraParaTextoBranco(cor) }} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t.cor}</h2>
        <div role="radiogroup" aria-label={t.cor} className="flex flex-wrap gap-2">
          {cores.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cor === c}
              aria-label={c === sugerida ? "Cor da logo" : c}
              onClick={() => setCor(c)}
              className={cn("tocavel grid size-14 place-items-center rounded-full", cor === c && "ring-4 ring-foreground ring-offset-2")}
              style={{ backgroundColor: corSeguraParaTextoBranco(c) }}
            >
              {cor === c && <Check aria-hidden strokeWidth={3} className="size-7 text-white" />}
            </button>
          ))}
        </div>
      </section>

      <BotaoSecundario icone={<RefreshCw aria-hidden />} onClick={() => arquivo.current?.click()}>
        {temLogo ? t.trocar : t.escolher}
      </BotaoSecundario>

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo carregando={salvando} icone={<ArrowRight aria-hidden />} onClick={continuar}>
        {textos.cadastro.continuar}
      </BotaoPrincipal>
    </div>
  );
}
