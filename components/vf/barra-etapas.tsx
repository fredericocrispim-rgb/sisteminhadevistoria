import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

/**
 * Topo das etapas: Voltar, nome da etapa em letra grande, "2 de 5" e barrinhas de progresso.
 * `atual` começa em 1.
 */
export function BarraEtapas({
  etapas,
  atual,
  onVoltar,
  ajuda,
}: {
  etapas: string[];
  atual: number;
  onVoltar?: () => void;
  /** Lugar para o botão AjudaRapida da etapa. */
  ajuda?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-1 px-2 pt-2">
        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            className="tocavel inline-flex min-h-toque shrink-0 items-center gap-1.5 rounded-2xl px-3 text-lg font-bold [&_svg]:size-7"
          >
            <ArrowLeft aria-hidden />
            {textos.geral.voltar}
          </button>
        )}
        <div className="flex-1" />
        {ajuda}
      </div>
      <div className="mx-auto flex max-w-xl items-end justify-between gap-3 px-4 pt-1" aria-live="polite">
        <h1 className="text-[1.75rem] leading-tight font-extrabold">{etapas[atual - 1]}</h1>
        <span className="mb-1 shrink-0 rounded-full bg-superficie px-3 py-0.5 text-base font-bold">
          <span className="sr-only">Passo </span>
          {atual} de {etapas.length}
        </span>
      </div>
      <ol className="mx-auto flex max-w-xl gap-1.5 px-4 pt-3 pb-3" aria-label="Etapas">
        {etapas.map((e, i) => (
          <li
            key={e}
            aria-current={i + 1 === atual ? "step" : undefined}
            className={cn("h-1.5 flex-1 rounded-full", i + 1 <= atual ? (i + 1 < atual ? "bg-acao" : "bg-oficina") : "bg-superficie")}
          >
            <span className="sr-only">
              {e}
              {i + 1 < atual ? " (feito)" : i + 1 === atual ? " (agora)" : ""}
            </span>
          </li>
        ))}
      </ol>
    </header>
  );
}
