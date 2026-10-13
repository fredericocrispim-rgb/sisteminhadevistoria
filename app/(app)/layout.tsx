import type { CSSProperties } from "react";
import { exigirOficina } from "@/lib/sessao";
import { MenuInferior } from "./menu-inferior";

/** Área interna (com login e oficina): aplica a cor da oficina e mostra o menu de baixo. */
export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const { empresa } = await exigirOficina();
  return (
    <div className="flex flex-1 flex-col" style={{ "--cor-oficina": empresa.cor_primaria } as CSSProperties}>
      <div className="flex flex-1 flex-col pb-24">{children}</div>
      <MenuInferior />
    </div>
  );
}
