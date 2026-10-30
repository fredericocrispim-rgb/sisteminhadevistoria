import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { Assistente } from "./assistente";

export const metadata: Metadata = { title: "Cadastro" };

/**
 * Cadastro da oficina em 2 passos: (1) você e a oficina, (2) logo.
 * Pode parar e continuar: abre no passo que falta. ?passo=2 = trocar a logo (menu Mais).
 */
export default async function PaginaCadastro({ searchParams }: PageProps<"/cadastro">) {
  const ctx = await exigirLogin();
  if (ctx.empresa && ctx.papel === "vistoriador") redirect("/inicio");

  const { passo } = await searchParams;
  const inicial = !ctx.empresa || !ctx.usuario.nome ? 1 : 2;
  const somenteEdicao = Boolean(ctx.empresa) && passo === "2";

  const supabase = await criarClienteServidor();
  const { data: plat } = await supabase.from("plataforma").select("dias_teste").single();

  return (
    <Assistente
      passoInicial={somenteEdicao ? 2 : inicial}
      usuario={{ nome: ctx.usuario.nome ?? "", whatsapp: ctx.usuario.whatsapp ?? "", email: ctx.usuario.email }}
      empresaInicial={ctx.empresa ? { id: ctx.empresa.id, nome: ctx.empresa.nome_fantasia, logo: ctx.empresa.logo_app_url } : null}
      diasTeste={plat?.dias_teste ?? 1}
      somenteEdicao={somenteEdicao}
    />
  );
}
