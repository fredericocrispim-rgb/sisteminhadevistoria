import { useId } from "react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

/**
 * Logotipo do Sisteminha de Vistoria: círculo azul com 4 quadradinhos
 * (3 claros e 1 verde). Desenhado em SVG para ficar nítido em qualquer tamanho.
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
      <span className="text-xl leading-tight font-extrabold">{textos.produto.nome}</span>
    </span>
  );
}
