/* eslint-disable @next/next/no-img-element -- fotos vêm do aparelho/URL assinada, não do otimizador do Next */
import { Check, CloudOff, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { SilhuetaCarro, type VistaFoto } from "./silhueta-carro";

export type EstadoFoto = "vazio" | "enviando" | "ok" | "erro" | "aguardando";

const selo: Record<Exclude<EstadoFoto, "vazio">, { classe: string; icone: React.ReactNode; texto: string }> = {
  enviando: { classe: "bg-oficina text-white", icone: <Loader2 aria-hidden className="animate-spin" />, texto: textos.fotos.estado.enviando },
  ok: { classe: "bg-acao text-white", icone: <Check aria-hidden strokeWidth={3} />, texto: textos.fotos.estado.ok },
  erro: { classe: "bg-perigo text-white", icone: <RotateCcw aria-hidden strokeWidth={3} />, texto: textos.fotos.estado.erro },
  aguardando: { classe: "bg-atencao text-atencao-texto", icone: <CloudOff aria-hidden strokeWidth={3} />, texto: textos.fotos.estado.aguardando },
};

/**
 * Miniatura de uma foto da vistoria. Vazia: mostra o desenho do ângulo.
 * Com foto: mostra a imagem e um selo colorido (enviando / ok / erro / sem internet).
 */
export function CartaoFoto({
  titulo,
  vista,
  estado,
  src,
  atual,
  onClick,
}: {
  titulo: string;
  vista: VistaFoto;
  estado: EstadoFoto;
  src?: string;
  /** Destaca a foto que deve ser tirada agora. */
  atual?: boolean;
  onClick?: () => void;
}) {
  const s = estado === "vazio" ? null : selo[estado];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${titulo}: ${s ? s.texto : textos.fotos.estado.vazio}`}
      className={cn(
        "tocavel relative flex w-full flex-col items-center gap-1 rounded-2xl bg-superficie p-1.5 pb-2 text-center",
        atual && "ring-3 ring-oficina",
        estado === "erro" && "ring-3 ring-perigo",
      )}
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-background">
        {src ? (
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <SilhuetaCarro vista={vista} className={cn("w-[85%]", atual ? "text-oficina" : "text-muted-foreground/60")} />
        )}
      </div>
      <span className="text-sm leading-tight font-bold">{titulo}</span>
      {s && (
        <span className={cn("absolute top-0.5 right-0.5 grid size-7 place-items-center rounded-full shadow [&_svg]:size-4", s.classe)}>
          {s.icone}
        </span>
      )}
    </button>
  );
}
