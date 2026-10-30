"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { temCabecalhoSite } from "@/lib/site-paginas";
import { LogoProduto } from "./logo-produto";

/** Telas que já mostram a logo grande no topo (não repete a faixa). */
const COM_LOGO_PROPRIA = ["/entrar", "/nova-senha", "/verificar"];

/** Faixa fina no alto de todas as telas: logo do Vistoria Rápida com a bandeira do Brasil. */
export function BarraMarca() {
  const caminho = usePathname();
  if (temCabecalhoSite(caminho) || COM_LOGO_PROPRIA.some((p) => caminho === p || caminho.startsWith(`${p}/`))) return null;
  return (
    <div className={cn("mx-auto w-full px-4 pt-3", caminho.startsWith("/admin") ? "max-w-5xl" : "max-w-xl")}>
      <LogoProduto comNome pequeno />
    </div>
  );
}
