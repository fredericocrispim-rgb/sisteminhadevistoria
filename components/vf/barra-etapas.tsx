import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

/**
 * Mostra onde a pessoa está: "Passo 2 de 5 – Fotos", com botão Voltar sempre visível.
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
  const nome = etapas[atual - 1];
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-2 px-2 py-2">
        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex min-h-toque shrink-0 items-center gap-1 rounded-xl px-3 text-base font-semibold hover:bg-muted [&_svg]:size-6"
          >
            <ChevronLeft aria-hidden />
            {textos.geral.voltar}
          </button>
        )}
        <div className="min-w-0 flex-1 px-1" aria-live="polite">
          <p className="text-sm font-medium text-muted-foreground">
            {textos.geral.passoDe(atual, etapas.length)}
          </p>
          <p className="truncate text-lg leading-tight font-bold">{nome}</p>
        </div>
        {ajuda}
      </div>
      <ol className="mx-auto flex max-w-xl gap-1 px-3 pb-2" aria-label="Etapas">
        {etapas.map((e, i) => (
          <li
            key={e}
            aria-current={i + 1 === atual ? "step" : undefined}
            className={cn(
              "h-2 flex-1 rounded-full",
              i + 1 < atual ? "bg-acao" : i + 1 === atual ? "bg-oficina" : "bg-muted",
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
