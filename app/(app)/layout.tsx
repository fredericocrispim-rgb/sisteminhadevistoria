import type { Metadata } from "next";
import { exigirOficina } from "@/lib/sessao";
import { MenuInferior } from "./menu-inferior";

// Telas internas (com login): fora do Google
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Área interna (com login e oficina). Cores: sempre as do Vistoria Rápida. */
export default async function LayoutApp({ children }: LayoutProps<"/">) {
  // Aqui não bloqueia (a tela de pagamento também usa este layout); cada página decide.
  const { bloqueado } = await exigirOficina({ permitirBloqueado: true });
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col pb-24">{children}</div>
      {!bloqueado && <MenuInferior />}
    </div>
  );
}
