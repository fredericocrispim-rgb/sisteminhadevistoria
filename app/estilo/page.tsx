import type { Metadata } from "next";
import { VitrineEstilo } from "./vitrine";

export const metadata: Metadata = {
  title: "Padrão visual",
  robots: { index: false },
};

/** Página interna para aprovar o visual no celular (Prompt 02). */
export default function PaginaEstilo() {
  return <VitrineEstilo />;
}
