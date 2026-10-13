"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tom = "bom" | "ruim" | "neutro";

export type OpcaoSeletor<T extends string> = {
  valor: T;
  rotulo: string;
  icone?: ReactNode;
  /** Cor quando marcado: verde (bom), vermelho (ruim) ou cor da oficina (neutro). */
  tom?: Tom;
};

const corMarcado: Record<Tom, string> = {
  bom: "border-acao bg-acao text-acao-texto",
  ruim: "border-perigo bg-perigo text-white",
  neutro: "border-oficina bg-oficina text-oficina-texto",
};

/**
 * Opções em botões grandes (ex.: BOM / RUIM / AUSENTE). Nada de caixinhas pequenas.
 * Funciona com toque, teclado (setas) e leitor de tela.
 */
export function SeletorGrande<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
  colunas,
  erro,
  ocultarRotulo,
}: {
  rotulo: string;
  opcoes: OpcaoSeletor<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  colunas?: 2 | 3 | 4 | 5;
  erro?: boolean;
  ocultarRotulo?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const cols = colunas ?? (opcoes.length <= 3 ? opcoes.length : 2);
  const indiceMarcado = opcoes.findIndex((o) => o.valor === valor);

  function teclado(e: KeyboardEvent, i: number) {
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const prox = (i + passo + opcoes.length) % opcoes.length;
    onChange(opcoes[prox].valor);
    refs.current[prox]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={rotulo} aria-invalid={erro || undefined} className="flex flex-col gap-2">
      {!ocultarRotulo && <span className="text-lg font-semibold">{rotulo}</span>}
      <div
        className={cn(
          "grid gap-2",
          { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[cols],
        )}
      >
        {opcoes.map((o, i) => {
          const marcado = o.valor === valor;
          return (
            <button
              key={o.valor}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={marcado}
              tabIndex={marcado || (indiceMarcado === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(o.valor)}
              onKeyDown={(e) => teclado(e, i)}
              className={cn(
                "relative flex min-h-toque flex-col items-center justify-center gap-1 rounded-xl border-[length:var(--borda)] px-2 py-2 text-base font-bold transition-colors [&_svg]:size-6",
                marcado
                  ? corMarcado[o.tom ?? "neutro"]
                  : cn("bg-card text-foreground hover:bg-muted", erro ? "border-perigo border-2" : "border-input"),
              )}
            >
              {marcado && <Check aria-hidden className="absolute top-1.5 right-1.5 !size-4" />}
              {o.icone}
              <span className="leading-tight">{o.rotulo}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
