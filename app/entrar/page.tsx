import type { Metadata } from "next";
import { textos } from "@/lib/textos";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const { voltar, criar, confirmado, erro } = await searchParams;
  const destino = typeof voltar === "string" && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/inicio";
  const aviso = confirmado === "1" ? textos.conta.confirmado : erro === "link" ? textos.conta.linkVencido : undefined;
  return <FormularioEntrar destino={destino} modoInicial={criar === "1" ? "criar" : "entrar"} aviso={aviso} />;
}
