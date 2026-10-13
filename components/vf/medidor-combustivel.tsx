"use client";

import { useRef, type KeyboardEvent } from "react";
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

/** Medidor de combustível: 5 colunas que enchem até o nível tocado. */
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
      <span className="text-lg font-bold" id="rotulo-combustivel">
        {textos.campos.combustivel}
      </span>
      <div
        role="radiogroup"
        aria-labelledby="rotulo-combustivel"
        aria-invalid={erro || undefined}
        className={cn("grid grid-cols-5 gap-1.5 rounded-2xl bg-superficie p-1.5", erro && "ring-2 ring-perigo")}
      >
        {NIVEIS_COMBUSTIVEL.map((n, i) => {
          const cheio = i <= indice;
          const marcado = valor === n;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={marcado}
              aria-label={rotulos[n]}
              tabIndex={marcado || (indice === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(n)}
              onKeyDown={(e) => teclado(e, i)}
              className={cn(
                "tocavel flex h-24 flex-col justify-end overflow-hidden rounded-xl",
                cheio ? (indice === 0 ? "bg-perigo text-white" : "bg-oficina text-oficina-texto") : "bg-background text-muted-foreground",
              )}
            >
              <span aria-hidden className={cn("pb-2 text-base font-extrabold", marcado && "text-lg")}>
                {rotulos[n]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
