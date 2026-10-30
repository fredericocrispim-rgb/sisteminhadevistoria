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
  // Durante a vistoria o menu some: o botão principal fica sozinho embaixo
  if (/^\/vistorias\/(nova|[0-9a-f-]{36})/.test(caminho)) return null;
  return (
    <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {itens.map(({ href, nome, icone: Icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 text-sm font-bold",
                  ativo ? "text-oficina" : "text-muted-foreground",
                )}
              >
                <Icone aria-hidden className="size-7" />
                {nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
