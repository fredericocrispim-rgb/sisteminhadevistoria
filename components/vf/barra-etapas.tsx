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
    <header className="sticky top-0 z-30 border-b border-foreground/5 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-xl items-center gap-1 px-2 pt-2">
        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            className="tocavel inline-flex min-h-toque shrink-0 items-center gap-2 rounded-2xl pr-3 pl-1 text-lg font-bold"
          >
            <span className="cartao grid size-11 place-items-center rounded-full [&_svg]:size-6">
              <ArrowLeft aria-hidden strokeWidth={2.4} />
            </span>
            {textos.geral.voltar}
          </button>
        )}
        <div className="flex-1" />
        {ajuda}
      </div>
      <div className="mx-auto flex max-w-xl items-end justify-between gap-3 px-4 pt-1" aria-live="polite">
        <h1 className="text-[1.75rem] leading-tight font-extrabold">{etapas[atual - 1]}</h1>
        <span className="mb-1 shrink-0 rounded-full bg-oficina-clara px-3 py-0.5 text-base font-extrabold text-oficina tabular-nums">
          <span className="sr-only">Passo </span>
          {atual} de {etapas.length}
        </span>
      </div>
      <ol className="mx-auto flex max-w-xl gap-1.5 px-4 pt-3 pb-3" aria-label="Etapas">
        {etapas.map((e, i) => (
          <li
            key={e}
            aria-current={i + 1 === atual ? "step" : undefined}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-300",
              i + 1 <= atual ? (i + 1 < atual ? "bg-acao" : "bg-oficina shadow-[0_0_0_3px_rgb(37_99_235/0.15)]") : "bg-foreground/10",
            )}
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
