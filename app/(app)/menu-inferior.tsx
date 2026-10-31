"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, ClipboardList, Home, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

const itens = [
  { href: "/inicio", nome: textos.menu.inicio, icone: Home },
  { href: "/vistorias", nome: textos.menu.vistorias, icone: ClipboardList },
  { href: "/patio", nome: textos.menu.patio, icone: CarFront },
  { href: "/mais", nome: textos.menu.mais, icone: Menu },
];

export function MenuInferior() {
  const caminho = usePathname();
  // Durante a vistoria e no pagamento o menu some: o botão principal fica sozinho embaixo
  if (/^\/(vistorias\/(nova|[0-9a-f-]{36})|assinar|pagamento)/.test(caminho)) return null;
  return (
    <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 shadow-[0_-8px_24px_-16px_rgb(15_23_42/0.25)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {itens.map(({ href, nome, icone: Icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "tocavel flex min-h-[4.5rem] flex-col items-center justify-center gap-1 text-sm font-bold",
                  ativo ? "text-oficina" : "text-muted-foreground",
                )}
              >
                {/* Item da tela atual: ícone dentro de uma "pílula" azul clara */}
                <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", ativo && "bg-oficina-clara")}>
                  <Icone aria-hidden className="size-6" strokeWidth={ativo ? 2.4 : 2} />
                </span>
                {nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
