"use client";
/* eslint-disable @next/next/no-img-element -- fotos locais/URL assinada */

import { useRef, useState } from "react";
import { ArrowRight, Camera, RefreshCw, ThumbsUp } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, CartaoFoto, MensagemErroCampo, SilhuetaCarro, type EstadoFoto } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { prepararFoto } from "@/lib/foto";
import { FOTOS_OBRIGATORIAS, dataHoraBR, placaParaMostrar } from "@/lib/vistoria";
import { placaParaBanco } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import type { FotoSalva } from "./tipos";

export function PassoFotos({
  vistoriaId,
  empresaId,
  placa,
  oficinaNome,
  iniciais,
  aoMudar,
  aoTerminar,
}: {
  vistoriaId: string;
  empresaId: string;
  placa: string;
  oficinaNome: string;
  iniciais: FotoSalva[];
  aoMudar: (fotos: FotoSalva[]) => void;
  aoTerminar: () => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<FotoSalva[]>(iniciais);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [falhou, setFalhou] = useState<string | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);

  const feita = (cat: string) => fotos.find((f) => f.categoria === cat);
  const primeiraFaltando = FOTOS_OBRIGATORIAS.find((f) => !feita(f.categoria));
  const atual = FOTOS_OBRIGATORIAS.find((f) => f.categoria === (escolhida ?? primeiraFaltando?.categoria)) ?? FOTOS_OBRIGATORIAS[0];
  const fotoAtual = feita(atual.categoria);
  const faltam = FOTOS_OBRIGATORIAS.filter((f) => !feita(f.categoria)).length;

  function abrirCamera(categoria: string) {
    setEscolhida(categoria);
    setFalhou(null);
    entrada.current?.click();
  }

  async function aoTirar(arquivo: File | undefined) {
    if (entrada.current) entrada.current.value = "";
    if (!arquivo) return;
    const categoria = atual.categoria;
    setEnviando(categoria);
    setFalhou(null);
    try {
      const { blob, previa } = await prepararFoto(arquivo, [dataHoraBR(new Date()), `${placaParaMostrar(placaParaBanco(placa))} · ${oficinaNome}`]);
      const supabase = criarClienteNavegador();
      const caminho = `${empresaId}/${vistoriaId}/${categoria}-${Date.now()}.jpg`;
      const { error: erroUpload } = await supabase.storage.from("vistorias").upload(caminho, blob, { contentType: "image/jpeg" });
      if (erroUpload) throw erroUpload;

      const anterior = feita(categoria);
      if (anterior) await supabase.from("vistoria_fotos").delete().eq("id", anterior.id);
      const { data, error } = await supabase
        .from("vistoria_fotos")
        .insert({ vistoria_id: vistoriaId, categoria, url: caminho, obrigatoria: true, tamanho_bytes: blob.size })
        .select("id")
        .single();
      if (error || !data) throw error;

      const novas = [...fotos.filter((f) => f.categoria !== categoria), { id: data.id, categoria, caminho, previa }];
      setFotos(novas);
      aoMudar(novas);
      setEscolhida(null); // volta a seguir a ordem: próxima que falta
    } catch {
      setFalhou(categoria);
    } finally {
      setEnviando(null);
    }
  }

  const estadoDe = (cat: string): EstadoFoto =>
    enviando === cat ? "enviando" : falhou === cat ? "erro" : feita(cat) ? "ok" : "vazio";

  return (
    <div className="flex flex-col gap-4">
      <input ref={entrada} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => aoTirar(e.target.files?.[0])} />

      {faltam === 0 && !escolhida ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-acao-clara p-6 text-center">
          <ThumbsUp aria-hidden className="size-14 text-acao" />
          <p className="text-2xl font-extrabold">Todas as fotos prontas</p>
          <p className="text-base font-semibold text-muted-foreground">Toque numa foto para tirar de novo.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 overflow-hidden rounded-3xl bg-oficina-clara text-center">
          {fotoAtual?.previa ? (
            <img src={fotoAtual.previa} alt={atual.titulo} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="px-4 pt-6">
              <SilhuetaCarro vista={atual.vista} className="mx-auto w-4/5 text-oficina" />
            </div>
          )}
          <div className="px-4 pb-5">
            <p className="text-[1.75rem] leading-tight font-extrabold">{atual.titulo}</p>
            <p className="text-lg font-semibold text-muted-foreground">{atual.dica}</p>
          </div>
        </div>
      )}

      {falhou && <MensagemErroCampo>A foto não foi enviada. Confira a internet e tire de novo.</MensagemErroCampo>}

      <div className="grid grid-cols-4 gap-2">
        {FOTOS_OBRIGATORIAS.map((f) => (
          <CartaoFoto
            key={f.categoria}
            titulo={f.titulo}
            vista={f.vista}
            estado={estadoDe(f.categoria)}
            src={feita(f.categoria)?.previa ?? undefined}
            atual={f.categoria === atual.categoria && (faltam > 0 || Boolean(escolhida))}
            onClick={() => (feita(f.categoria) ? setEscolhida(f.categoria) : abrirCamera(f.categoria))}
          />
        ))}
      </div>
      {faltam > 0 && <p className="text-center text-lg font-bold text-muted-foreground">{textos.fotos.faltam(faltam)}</p>}

      {fotoAtual && escolhida && (
        <BotaoSecundario icone={<RefreshCw aria-hidden />} onClick={() => abrirCamera(atual.categoria)} disabled={Boolean(enviando)}>
          {textos.fotos.tirarDeNovo}
        </BotaoSecundario>
      )}

      {faltam > 0 ? (
        <BotaoPrincipal
          fixo
          carregando={Boolean(enviando)}
          icone={<Camera aria-hidden />}
          onClick={() => abrirCamera(fotoAtual ? primeiraFaltando!.categoria : atual.categoria)}
        >
          {textos.fotos.tirarFoto}
        </BotaoPrincipal>
      ) : (
        <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />} onClick={aoTerminar} disabled={Boolean(enviando)}>
          {textos.geral.proximo}
        </BotaoPrincipal>
      )}
    </div>
  );
}
