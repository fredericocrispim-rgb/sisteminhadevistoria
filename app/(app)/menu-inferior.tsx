"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, ClipboardList, House, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

const itens = [
  { href: "/inicio", nome: textos.menu.inicio, icone: House },
  { href: "/vistorias", nome: textos.menu.vistorias, icone: ClipboardList },
  { href: "/patio", nome: textos.menu.patio, icone: CarFront },
  { href: "/mais", nome: textos.menu.mais, icone: LayoutGrid },
];

/** Menu de baixo: barra flutuante de vidro, com o item da tela atual em destaque. */
export function MenuInferior() {
  const caminho = usePathname();
  // Durante a vistoria e no pagamento o menu some: o botão principal fica sozinho embaixo
  if (/^\/(vistorias\/(nova|[0-9a-f-]{36})|assinar|pagamento)/.test(caminho)) return null;
  return (
    <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <ul className="mx-auto grid max-w-xl grid-cols-4 gap-1 rounded-[1.75rem] bg-background/85 p-1.5 shadow-[0_18px_40px_-14px_rgb(15_23_42/0.35)] ring-1 ring-foreground/8 backdrop-blur-xl backdrop-saturate-150">
        {itens.map(({ href, nome, icone: Icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "tocavel flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-[1.35rem] text-sm font-bold",
                  ativo ? "bg-oficina-clara text-oficina" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icone aria-hidden className="size-6" strokeWidth={ativo ? 2.5 : 2} />
                {nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
