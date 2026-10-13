import type { Metadata } from "next";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const { voltar } = await searchParams;
  const destino = typeof voltar === "string" && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/inicio";
  return <FormularioEntrar destino={destino} />;
}
