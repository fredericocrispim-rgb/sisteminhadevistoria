"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Caixa de marcar GRANDE (nada de quadradinho pequeno). */
export function CaixaMarcar({
  marcado,
  onChange,
  children,
  erro,
}: {
  marcado: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  erro?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-toque items-center gap-3 rounded-2xl bg-superficie px-4 py-3 text-lg",
        erro && "ring-2 ring-perigo",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={marcado}
        onClick={() => onChange(!marcado)}
        className={cn(
          "tocavel grid size-9 shrink-0 place-items-center rounded-xl border-2",
          marcado ? "border-acao bg-acao text-white" : "border-input bg-background",
        )}
      >
        {marcado && <Check aria-hidden strokeWidth={3} className="size-6" />}
        <span className="sr-only">Marcar</span>
      </button>
      <span className="flex-1 font-semibold">{children}</span>
    </div>
  );
}
