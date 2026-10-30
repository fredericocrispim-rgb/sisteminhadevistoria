import type { Metadata } from "next";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { textos } from "@/lib/textos";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const { voltar, criar, confirmado, erro, novo } = await searchParams;
  const destino = typeof voltar === "string" && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/inicio";
  const aviso =
    confirmado === "1" ? textos.conta.confirmado
    : erro === "link" ? textos.conta.linkVencido
    : novo === "1" ? textos.conta.enderecoNovo
    : undefined;
  const { data: plat } = await criarClienteAdmin().from("plataforma").select("whatsapp_suporte, fornecedor_whatsapp").single();
  return (
    <FormularioEntrar
      destino={destino}
      modoInicial={criar === "1" ? "criar" : "entrar"}
      aviso={aviso}
      whatsappSuporte={plat?.whatsapp_suporte || plat?.fornecedor_whatsapp || null}
    />
  );
}
