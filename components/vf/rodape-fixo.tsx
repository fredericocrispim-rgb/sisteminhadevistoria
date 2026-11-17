"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Altura do teclado do celular aberto (0 = fechado).
 * O navegador encolhe a "área visível" (visualViewport) quando o teclado abre; a diferença é o teclado.
 */
function useAlturaTeclado() {
  const [altura, setAltura] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const medir = () => {
      const k = window.innerHeight - vv.height - vv.offsetTop;
      setAltura(k > 80 ? Math.round(k) : 0); // menos que isso é barra do navegador, não teclado
    };
    medir();
    vv.addEventListener("resize", medir);
    vv.addEventListener("scroll", medir);
    return () => {
      vv.removeEventListener("resize", medir);
      vv.removeEventListener("scroll", medir);
    };
  }, []);
  return altura;
}

/**
 * Rodapé preso embaixo da tela, ao alcance do polegar.
 * Com o teclado aberto, SOBE e fica logo acima dele: o botão nunca some atrás do teclado
 * (quem usa é leigo e não sabe fechar o teclado para achar o botão).
 */
export function RodapeFixo({ children }: { children: ReactNode }) {
  const teclado = useAlturaTeclado();
  // O rodapé que subiu não pode tampar o campo que a pessoa está digitando: leva o campo para o meio
  useEffect(() => {
    if (!teclado) return;
    const campo = document.activeElement;
    if (campo instanceof HTMLElement && campo.matches("input, textarea")) campo.scrollIntoView({ block: "center" });
  }, [teclado]);
  return (
    <div
      style={teclado ? { bottom: teclado } : undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background/90 to-transparent px-4",
        teclado ? "bg-background pt-2 pb-2" : "pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto max-w-xl">{children}</div>
    </div>
  );
}
