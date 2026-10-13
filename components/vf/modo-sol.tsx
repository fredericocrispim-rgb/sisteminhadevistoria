"use client";

import { useSyncExternalStore } from "react";
import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

const CHAVE = "vf-modo-sol";

/** Script que roda antes da tela aparecer, para o modo sol não "piscar". Vai no <head>. */
export const scriptModoSol = `try{if(localStorage.getItem("${CHAVE}")==="1")document.documentElement.classList.add("sol")}catch(e){}`;

const ouvintes = new Set<() => void>();

function assinar(cb: () => void) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}

function ligado() {
  return document.documentElement.classList.contains("sol");
}

function definir(valor: boolean) {
  document.documentElement.classList.toggle("sol", valor);
  try {
    localStorage.setItem(CHAVE, valor ? "1" : "0");
  } catch {
    // Sem armazenamento (modo anônimo): vale só até fechar.
  }
  ouvintes.forEach((cb) => cb());
}

/** Liga/desliga o modo de alto contraste para usar no sol. Um toque. */
export function BotaoModoSol({ className }: { className?: string }) {
  const ativo = useSyncExternalStore(assinar, ligado, () => false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      onClick={() => definir(!ativo)}
      className={cn(
        "flex min-h-toque w-full items-center gap-3 rounded-xl border-[length:var(--borda)] px-4 py-2 text-left",
        ativo ? "border-foreground bg-foreground text-background" : "border-input bg-card",
        className,
      )}
    >
      <Sun aria-hidden className="size-7 shrink-0" />
      <span className="flex flex-1 flex-col">
        <span className="text-lg font-bold">{textos.modoSol.ligar}</span>
        <span className={cn("text-sm", ativo ? "text-background/80" : "text-muted-foreground")}>{textos.modoSol.descricao}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors",
          ativo ? "bg-acao" : "bg-input",
        )}
      >
        <span className={cn("absolute top-1 size-6 rounded-full bg-white shadow transition-all", ativo ? "left-7" : "left-1")} />
      </span>
    </button>
  );
}
