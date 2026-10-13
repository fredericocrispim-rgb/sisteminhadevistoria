"use client";

import { useRef, type KeyboardEvent } from "react";
import { Fuel } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

export const NIVEIS_COMBUSTIVEL = ["vazio", "1/4", "1/2", "3/4", "cheio"] as const;
export type NivelCombustivel = (typeof NIVEIS_COMBUSTIVEL)[number];

const rotulos: Record<NivelCombustivel, string> = {
  vazio: textos.combustivel.vazio,
  "1/4": textos.combustivel.umQuarto,
  "1/2": textos.combustivel.meio,
  "3/4": textos.combustivel.tresQuartos,
  cheio: textos.combustivel.cheio,
};

/** Medidor de combustível grande e tocável: 5 barras que enchem até o nível tocado. */
export function MedidorCombustivel({
  valor,
  onChange,
  erro,
}: {
  valor: NivelCombustivel | null;
  onChange: (v: NivelCombustivel) => void;
  erro?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const indice = valor ? NIVEIS_COMBUSTIVEL.indexOf(valor) : -1;

  function teclado(e: KeyboardEvent, i: number) {
    const passo = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const prox = Math.min(Math.max(i + passo, 0), NIVEIS_COMBUSTIVEL.length - 1);
    onChange(NIVEIS_COMBUSTIVEL[prox]);
    refs.current[prox]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-lg font-semibold" id="rotulo-combustivel">
        <Fuel aria-hidden className="size-6" />
        {textos.campos.combustivel}
        {valor && <span className="ml-auto rounded-lg bg-muted px-2 text-base">{rotulos[valor]}</span>}
      </span>
      <div
        role="radiogroup"
        aria-labelledby="rotulo-combustivel"
        aria-invalid={erro || undefined}
        className={cn(
          "grid grid-cols-5 items-end gap-1.5 rounded-xl border-[length:var(--borda)] bg-card p-2",
          erro ? "border-2 border-perigo" : "border-input",
        )}
      >
        {NIVEIS_COMBUSTIVEL.map((n, i) => {
          const cheio = i <= indice;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={valor === n}
              aria-label={rotulos[n]}
              tabIndex={valor === n || (indice === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(n)}
              onKeyDown={(e) => teclado(e, i)}
              className="flex flex-col items-center gap-1 rounded-lg pt-1 hover:bg-muted"
            >
              <span
                aria-hidden
                className={cn(
                  "w-full rounded-md border-[length:var(--borda)] transition-colors",
                  cheio ? (indice === 0 ? "border-perigo bg-perigo" : "border-oficina bg-oficina") : "border-input bg-muted",
                )}
                style={{ height: `${2.25 + i * 0.6}rem` }}
              />
              <span aria-hidden className={cn("text-sm font-bold", valor === n ? "text-foreground" : "text-muted-foreground")}>
                {rotulos[n]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
