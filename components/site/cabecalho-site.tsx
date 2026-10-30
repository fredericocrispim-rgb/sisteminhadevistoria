import Link from "next/link";
import { Menu } from "lucide-react";
import { LogoProduto } from "@/components/vf";
import { MENU_SITE } from "@/lib/site-paginas";
import { textos } from "@/lib/textos";

/** Cabeçalho das páginas públicas: logo, menu (no celular, abre ao tocar, sem JavaScript) e Entrar. */
export function CabecalhoSite() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 pt-5 sm:px-5">
      <Link href="/" aria-label={`${textos.produto.nome}: página inicial`} className="tocavel rounded-2xl">
        <span className="sm:hidden">
          <LogoProduto comNome pequeno />
        </span>
        <span className="hidden sm:block">
          <LogoProduto comNome className="size-11" />
        </span>
      </Link>

      <nav aria-label="Menu do site" className="hidden items-center gap-1 xl:flex">
        {MENU_SITE.map((item) => (
          <Link key={item.caminho} href={item.caminho} className="tocavel inline-flex min-h-11 items-center rounded-xl px-3 text-base font-bold text-muted-foreground hover:text-foreground">
            {item.nome}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        <Link href="/entrar" className="tocavel hidden min-h-toque items-center rounded-2xl px-3 text-lg font-bold text-oficina sm:inline-flex">
          Entrar
        </Link>
        <details className="group relative xl:hidden">
          <summary className="tocavel flex min-h-toque cursor-pointer list-none items-center gap-2 rounded-2xl bg-background/80 px-3 text-lg font-bold ring-1 ring-border [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden className="size-6" /> Menu
          </summary>
          <nav aria-label="Menu do site" className="absolute right-0 z-50 mt-2 flex w-72 flex-col rounded-2xl bg-background p-2 shadow-xl ring-1 ring-border">
            {MENU_SITE.map((item) => (
              <Link key={item.caminho} href={item.caminho} className="tocavel flex min-h-toque items-center rounded-xl px-4 text-lg font-bold hover:bg-superficie">
                {item.nome}
              </Link>
            ))}
            <Link href="/entrar" className="tocavel flex min-h-toque items-center rounded-xl px-4 text-lg font-bold text-oficina hover:bg-superficie">
              Entrar
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
