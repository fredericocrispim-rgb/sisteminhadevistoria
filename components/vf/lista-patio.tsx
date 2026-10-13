import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { placaParaMostrar } from "@/lib/vistoria";
import type { CarroNoPatio } from "@/lib/patio";

/** Lista dos carros no pátio. Tocar abre a ENTREGA já ligada à chegada. */
export function ListaPatio({ carros }: { carros: CarroNoPatio[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {carros.map((c) => (
        <li key={c.entradaId}>
          <Link
            href={`/vistorias/nova?tipo=SAIDA&entrada=${c.entradaId}`}
            className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-superficie px-4 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-2xl font-extrabold tracking-wider">{placaParaMostrar(c.placa)}</span>
              <span className="block truncate text-base text-muted-foreground">{[c.descricao, c.cliente].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="shrink-0 rounded-full bg-background px-3 py-1 text-sm font-bold">
              {c.dias === 0 ? "Hoje" : c.dias === 1 ? "1 dia" : `${c.dias} dias`}
            </span>
            <ChevronRight aria-hidden className="size-7 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
