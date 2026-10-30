import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MENU_SITE } from "@/lib/site-paginas";

export const metadata: Metadata = { title: "Página não encontrada", robots: { index: false } };

/** Página 404: explica e leva para as páginas principais. */
export default function NaoEncontrada() {
  const links = [{ caminho: "/", nome: "Página inicial" }, ...MENU_SITE, { caminho: "/entrar", nome: "Entrar" }];
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
      <h1 className="text-[2.2rem] leading-tight font-extrabold">Página não encontrada</h1>
      <p className="mt-3 text-xl text-muted-foreground">Este endereço não existe ou mudou. Escolha para onde ir:</p>
      <ul className="mt-6 flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.caminho}>
            <Link href={l.caminho} className="tocavel flex min-h-toque items-center justify-between rounded-2xl bg-superficie px-5 text-lg font-bold hover:bg-oficina-clara">
              {l.nome} <ChevronRight aria-hidden className="size-6 text-oficina" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
