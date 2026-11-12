import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TomIcone = "oficina" | "acao" | "atencao" | "perigo" | "neutro" | "claro";

const tons: Record<TomIcone, string> = {
  oficina: "bg-oficina-clara text-oficina",
  acao: "bg-acao-clara text-acao",
  atencao: "bg-atencao-clara text-atencao-texto",
  perigo: "bg-perigo-clara text-perigo",
  neutro: "bg-background text-muted-foreground ring-1 ring-foreground/5",
  /** Para usar em cima de botão colorido (fundo azul/verde). */
  claro: "bg-white/18 text-current ring-1 ring-white/30",
};

const tamanhos = {
  p: "size-10 rounded-xl [&_svg]:size-5",
  m: "size-12 rounded-2xl [&_svg]:size-6",
  g: "size-16 rounded-[1.25rem] [&_svg]:size-8",
  gg: "size-24 rounded-[1.75rem] [&_svg]:size-12",
};

/**
 * Ícone moderno: dentro de um quadradinho arredondado, com fundo claro da mesma cor.
 * Use nas listas, cartões e avisos (sempre com uma palavra ao lado).
 */
export function IconeChip({
  children,
  tom = "oficina",
  tamanho = "m",
  className,
}: {
  children: ReactNode;
  tom?: TomIcone;
  tamanho?: keyof typeof tamanhos;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("icone-chip grid shrink-0 place-items-center [&_svg]:stroke-[2.2]", tons[tom], tamanhos[tamanho], className)}>
      {children}
    </span>
  );
}
