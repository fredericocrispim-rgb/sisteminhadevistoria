import { useId } from "react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

/** Bandeira do Brasil desenhada (sem emoji), no tamanho do texto ao lado. */
export function BandeiraBrasil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" role="img" aria-label={textos.produto.bandeira} className={cn("h-[0.9em] w-auto shrink-0 rounded-[2px] shadow-sm", className)}>
      <rect width="20" height="14" fill="#009c3b" />
      <path d="M10 1.6 18.2 7 10 12.4 1.8 7Z" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3.3" fill="#002776" />
      <path d="M6.85 6.3c2.1-.35 4.3.05 6.25 1.2" stroke="#ffffff" strokeWidth=".55" fill="none" />
    </svg>
  );
}

/**
 * Logotipo do Vistoria Rápida: círculo azul com 4 quadradinhos (3 claros e 1 verde).
 * Com `comNome`: símbolo + "Vistoria Rápida" + ".digital" (em verde, menor) + bandeira do Brasil.
 */
export function LogoProduto({ className, comNome }: { className?: string; comNome?: boolean }) {
  const id = useId();
  const simbolo = (
    <svg viewBox="0 0 64 64" role="img" aria-label={textos.produto.nome} className={cn("size-12 shrink-0", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      <rect x="15.5" y="15.5" width="15" height="15" rx="3.5" fill="#ffffff" />
      <rect x="33.5" y="15.5" width="15" height="15" rx="3.5" fill="#e8efff" />
      <rect x="15.5" y="33.5" width="15" height="15" rx="3.5" fill="#e8efff" />
      <rect x="33.5" y="33.5" width="15" height="15" rx="3.5" fill="#22b573" />
    </svg>
  );
  if (!comNome) return simbolo;
  return (
    <span className="flex items-center gap-3">
      {simbolo}
      <span className="flex flex-col leading-none">
        <span className="flex items-center gap-2 text-[1.3rem] font-extrabold tracking-tight whitespace-nowrap">
          {textos.produto.nome}
          <BandeiraBrasil />
        </span>
        <span className="mt-1 text-sm font-bold tracking-wide text-acao">{textos.produto.sufixo}</span>
      </span>
    </span>
  );
}
