/* eslint-disable @next/next/no-img-element -- fotos vêm do aparelho/URL assinada, não do otimizador do Next */
import { Camera, CheckCircle2, CloudOff, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { SilhuetaCarro, type VistaFoto } from "./silhueta-carro";

export type EstadoFoto = "vazio" | "enviando" | "ok" | "erro" | "aguardando";

const visual: Record<EstadoFoto, { classe: string; icone: React.ReactNode; texto: string }> = {
  vazio: { classe: "border-dashed border-input bg-card", icone: <Camera aria-hidden />, texto: textos.fotos.estado.vazio },
  enviando: { classe: "border-oficina bg-card", icone: <Loader2 aria-hidden className="animate-spin" />, texto: textos.fotos.estado.enviando },
  ok: { classe: "border-acao bg-sucesso-fundo", icone: <CheckCircle2 aria-hidden className="text-acao" />, texto: textos.fotos.estado.ok },
  erro: { classe: "border-perigo bg-perigo-fundo", icone: <RotateCcw aria-hidden className="text-perigo" />, texto: textos.fotos.estado.erro },
  aguardando: { classe: "border-atencao bg-atencao-fundo", icone: <CloudOff aria-hidden className="text-atencao-texto" />, texto: textos.fotos.estado.aguardando },
};

/**
 * Cartão de uma foto da vistoria. Vazio: mostra a silhueta do ângulo certo.
 * Com foto: mostra a imagem e o estado do envio.
 */
export function CartaoFoto({
  numero,
  titulo,
  vista,
  estado,
  src,
  obrigatoria,
  progresso,
  onClick,
}: {
  numero?: number;
  titulo: string;
  vista: VistaFoto;
  estado: EstadoFoto;
  src?: string;
  obrigatoria?: boolean;
  /** 0 a 100, enquanto envia */
  progresso?: number;
  onClick?: () => void;
}) {
  const v = visual[estado];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border-2 text-left transition-colors hover:brightness-[0.98]",
        v.classe,
      )}
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-muted/40">
        {src ? (
          <img src={src} alt={titulo} className="size-full object-cover" />
        ) : (
          <SilhuetaCarro vista={vista} className="w-4/5 text-muted-foreground" />
        )}
        {numero !== undefined && (
          <span className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-oficina text-base font-bold text-oficina-texto">
            {numero}
          </span>
        )}
        {estado === "enviando" && progresso !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-2 bg-black/20" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label={textos.fotos.estado.enviando}>
            <div className="h-full bg-oficina transition-all" style={{ width: `${progresso}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <span className="text-base leading-tight font-bold">
          {titulo}
          {obrigatoria && estado === "vazio" && <span className="text-perigo"> *</span>}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground [&_svg]:size-4">
          {v.icone}
          {v.texto}
        </span>
      </div>
    </button>
  );
}
