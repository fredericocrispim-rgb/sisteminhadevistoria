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
        "tocavel flex min-h-toque-grande w-full items-center gap-3 rounded-2xl px-3 text-left",
        ativo ? "bg-foreground text-background" : "cartao",
        className,
      )}
    >
      <span aria-hidden className={cn("icone-chip grid size-12 shrink-0 place-items-center rounded-2xl [&_svg]:size-6", ativo ? "bg-atencao text-atencao-texto" : "bg-atencao-clara text-atencao-texto")}>
        <Sun strokeWidth={2.2} />
      </span>
      <span className="flex-1 text-lg font-bold">{textos.modoSol.ligar}</span>
      <span aria-hidden className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", ativo ? "bg-acao" : "bg-input")}>
        <span className={cn("absolute top-1 size-6 rounded-full bg-white shadow transition-all", ativo ? "left-7" : "left-1")} />
      </span>
    </button>
  );
}
