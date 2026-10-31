"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Circle, RefreshCw, Square, Trash2, Video, X } from "lucide-react";
import { BotaoSecundario, MensagemErroCampo } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { formatarDuracao } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import type { VideoSalvo } from "./tipos";

const t = textos.video;

/** MP4 primeiro (abre em qualquer celular, inclusive iPhone); senão WebM. */
const FORMATOS = ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

function formatoSuportado() {
  if (typeof MediaRecorder === "undefined") return null;
  return FORMATOS.find((f) => MediaRecorder.isTypeSupported(f)) ?? null;
}

type Etapa = "fechado" | "camera" | "gravando" | "revisar";

/**
 * Vídeo da vistoria (plano Pro), gravado aqui mesmo e já comprimido
 * (qualidade de celular, ~1 Mbps: 1 minuto ≈ 8 MB). Para sozinho no limite do plano.
 */
export function GravarVideo({
  vistoriaId,
  empresaId,
  segundos,
  inicial,
  aoMudar,
  aoOcupar,
}: {
  vistoriaId: string;
  empresaId: string;
  segundos: number;
  inicial: VideoSalvo | null;
  aoMudar: (video: VideoSalvo | null) => void;
  aoOcupar: (ocupado: boolean) => void;
}) {
  const visor = useRef<HTMLVideoElement>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const inicio = useRef(0);
  const [etapa, setEtapa] = useState<Etapa>("fechado");
  const [video, setVideo] = useState<VideoSalvo | null>(inicial);
  const [gravado, setGravado] = useState<{ blob: Blob; url: string; duracao: number } | null>(null);
  const [tempo, setTempo] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();

  function desligarCamera() {
    fluxo.current?.getTracks().forEach((faixa) => faixa.stop());
    fluxo.current = null;
  }

  // Ao sair da tela: desliga a câmera
  useEffect(() => desligarCamera, []);

  // Relógio da gravação; para sozinho no limite
  useEffect(() => {
    if (etapa !== "gravando") return;
    const id = setInterval(() => {
      const s = (Date.now() - inicio.current) / 1000;
      setTempo(s);
      if (s >= segundos) gravador.current?.stop();
    }, 250);
    return () => clearInterval(id);
  }, [etapa, segundos]);

  async function abrirCamera() {
    setErro(undefined);
    if (!formatoSuportado() || !navigator.mediaDevices?.getUserMedia) return setErro(t.naoSuporta);
    try {
      const camera = { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } };
      // Com som (barulho do motor); se o microfone for negado, grava sem som
      fluxo.current = await navigator.mediaDevices.getUserMedia({ video: camera, audio: true }).catch(() => navigator.mediaDevices.getUserMedia({ video: camera }));
      setEtapa("camera");
      requestAnimationFrame(() => {
        if (visor.current && fluxo.current) {
          visor.current.srcObject = fluxo.current;
          void visor.current.play().catch(() => {});
        }
      });
    } catch {
      setErro(t.erroCamera);
    }
  }

  function comecar() {
    const formato = formatoSuportado();
    if (!fluxo.current || !formato) return;
    pedacos.current = [];
    const g = new MediaRecorder(fluxo.current, { mimeType: formato, videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 64_000 });
    g.ondataavailable = (e) => e.data.size > 0 && pedacos.current.push(e.data);
    g.onstop = () => {
      const duracao = Math.min(segundos, (Date.now() - inicio.current) / 1000);
      const blob = new Blob(pedacos.current, { type: formato.split(";")[0] });
      desligarCamera();
      setGravado({ blob, url: URL.createObjectURL(blob), duracao });
      setEtapa("revisar");
    };
    gravador.current = g;
    inicio.current = Date.now();
    setTempo(0);
    g.start(1000);
    setEtapa("gravando");
  }

  function fechar() {
    if (gravador.current?.state === "recording") {
      gravador.current.onstop = null;
      gravador.current.stop();
    }
    desligarCamera();
    if (gravado) URL.revokeObjectURL(gravado.url);
    setGravado(null);
    setEtapa("fechado");
  }

  async function usar() {
    if (!gravado) return;
    setEtapa("fechado");
    setEnviando(true);
    aoOcupar(true);
    setErro(undefined);
    try {
      const tipo = gravado.blob.type.startsWith("video/mp4") ? "video/mp4" : "video/webm";
      const supabase = criarClienteNavegador();
      const caminho = `${empresaId}/${vistoriaId}/video-${Date.now()}.${tipo === "video/mp4" ? "mp4" : "webm"}`;
      const { error: erroUpload } = await supabase.storage.from("vistorias").upload(caminho, gravado.blob, { contentType: tipo });
      if (erroUpload) throw erroUpload;
      if (video) await supabase.from("vistoria_videos").delete().eq("id", video.id);
      const { data, error } = await supabase
        .from("vistoria_videos")
        .insert({ vistoria_id: vistoriaId, empresa_id: empresaId, url: caminho, tipo, tamanho_bytes: gravado.blob.size, duracao_segundos: Math.round(gravado.duracao) })
        .select("id")
        .single();
      if (error || !data) throw error;
      const novo: VideoSalvo = { id: data.id, caminho, tipo, duracao: Math.round(gravado.duracao), previa: gravado.url };
      setVideo(novo);
      setGravado(null);
      aoMudar(novo);
    } catch {
      setErro(t.erroEnvio);
      setEtapa("revisar"); // o vídeo continua aqui: dá para tentar de novo
    } finally {
      setEnviando(false);
      aoOcupar(false);
    }
  }

  async function apagar() {
    if (!video) return;
    setEnviando(true);
    const { error } = await criarClienteNavegador().from("vistoria_videos").delete().eq("id", video.id);
    setEnviando(false);
    if (error) return setErro(t.erroEnvio);
    setVideo(null);
    aoMudar(null);
  }

  const maximo = formatarDuracao(segundos);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <Video aria-hidden className="size-6" /> {t.titulo}
        {video?.duracao != null && <span className="text-base font-bold text-muted-foreground">· {formatarDuracao(video.duracao)}</span>}
      </h2>

      {video?.previa ? (
        <video src={video.previa} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black" />
      ) : video ? (
        <p className="rounded-2xl bg-acao-clara px-4 py-3 text-lg font-bold text-acao">{t.pronto}</p>
      ) : (
        <p className="text-base text-muted-foreground">{t.opcional}</p>
      )}

      {enviando && <p className="rounded-2xl bg-oficina-clara px-4 py-3 text-lg font-bold text-oficina">{t.enviando}</p>}
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}

      {!enviando &&
        (video ? (
          <div className="grid grid-cols-2 gap-2">
            <BotaoSecundario icone={<RefreshCw aria-hidden />} onClick={abrirCamera}>
              {t.gravarDeNovo}
            </BotaoSecundario>
            <BotaoSecundario icone={<Trash2 aria-hidden />} onClick={apagar}>
              {t.apagar}
            </BotaoSecundario>
          </div>
        ) : (
          <BotaoSecundario icone={<Video aria-hidden />} onClick={abrirCamera}>
            {t.gravar(maximo)}
          </BotaoSecundario>
        ))}

      {/* Tela cheia: câmera, gravando ou revendo o vídeo */}
      {etapa !== "fechado" && (
        <div role="dialog" aria-modal="true" aria-label={t.titulo} className="fixed inset-0 z-50 flex flex-col bg-black text-white">
          <div className="relative flex-1 overflow-hidden">
            {etapa === "revisar" && gravado ? (
              <video src={gravado.url} controls playsInline autoPlay className="size-full object-contain" />
            ) : (
              <video ref={visor} muted playsInline className="size-full object-cover" />
            )}
            {etapa !== "revisar" && (
              <p
                aria-live="polite"
                className={cn(
                  "absolute top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-mono text-xl font-extrabold",
                  etapa === "gravando" ? "bg-perigo" : "bg-black/60",
                )}
              >
                {formatarDuracao(tempo)} / {maximo}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {erro && <p className="rounded-2xl bg-perigo px-4 py-2 text-base font-bold">{erro}</p>}
            {etapa === "camera" && (
              <button type="button" onClick={comecar} className="tocavel flex min-h-toque-grande items-center justify-center gap-3 rounded-2xl bg-perigo text-xl font-extrabold">
                <Circle aria-hidden className="size-7 fill-current" /> {t.comecar}
              </button>
            )}
            {etapa === "gravando" && (
              <button
                type="button"
                onClick={() => gravador.current?.stop()}
                className="tocavel flex min-h-toque-grande items-center justify-center gap-3 rounded-2xl bg-white text-xl font-extrabold text-black"
              >
                <Square aria-hidden className="size-7 fill-current" /> {t.parar}
              </button>
            )}
            {etapa === "revisar" && (
              <>
                <button type="button" onClick={usar} className="tocavel flex min-h-toque-grande items-center justify-center gap-3 rounded-2xl bg-acao text-xl font-extrabold text-acao-texto">
                  <Check aria-hidden className="size-7" /> {t.usar}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (gravado) URL.revokeObjectURL(gravado.url);
                    setGravado(null);
                    void abrirCamera();
                  }}
                  className="tocavel flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-white/15 text-lg font-bold"
                >
                  <RefreshCw aria-hidden className="size-6" /> {t.gravarDeNovo}
                </button>
              </>
            )}
            {etapa !== "gravando" && (
              <button type="button" onClick={fechar} className="tocavel flex min-h-toque items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white/80">
                <X aria-hidden className="size-6" /> {t.cancelar}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
