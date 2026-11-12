import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const cores = {
  oficina: "bg-oficina text-oficina-texto shadow-[0_22px_40px_-20px_rgb(37_99_235/0.9)]",
  acao: "bg-acao text-acao-texto shadow-[0_22px_40px_-20px_rgb(19_134_90/0.9)]",
};

/** Botão enorme da tela inicial (CHEGOU CARRO / ENTREGAR CARRO). */
export function BotaoGigante({
  href,
  cor,
  icone,
  children,
}: {
  href: string;
  cor: keyof typeof cores;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "tocavel brilho group relative isolate flex min-h-[28svh] flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] px-4",
        cores[cor],
      )}
    >
      {/* Círculos de luz no fundo (a mesma cor, mais clara): só decoração */}
      <span aria-hidden className="absolute -top-16 -right-14 -z-10 size-52 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-20 -left-12 -z-10 size-44 rounded-full bg-white/[0.07]" />
      {/* Ícone num quadrado arredondado de vidro */}
      <span className="grid size-24 place-items-center rounded-[1.75rem] bg-white/18 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] ring-1 ring-white/30 [&_svg]:size-12 [&_svg]:stroke-[2.4]">
        {icone}
      </span>
      <span className="text-center text-[1.75rem] leading-tight font-extrabold tracking-wide">{children}</span>
      {/* Setinha no canto: "toque aqui para começar" */}
      <span aria-hidden className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/18 ring-1 ring-white/30">
        <ArrowRight className="size-5! stroke-[2.6] transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
