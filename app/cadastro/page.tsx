import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { Assistente } from "./assistente";

export const metadata: Metadata = { title: "Cadastro" };

/**
 * Cadastro da oficina em 4 passos. Pode parar e continuar depois:
 * a página abre no passo que falta.
 */
export default async function PaginaCadastro({ searchParams }: PageProps<"/cadastro">) {
  const ctx = await exigirLogin();
  if (ctx.empresa && ctx.papel === "vistoriador") redirect("/inicio");

  const { passo } = await searchParams;
  let inicial = !ctx.usuario.nome ? 1 : !ctx.empresa ? 2 : 3;
  const pedido = Number(passo);
  if (ctx.empresa && (pedido === 3 || pedido === 4)) inicial = pedido;

  const supabase = await criarClienteServidor();
  const { data: plat } = await supabase.from("plataforma").select("dias_teste").single();

  return (
    <Assistente
      passoInicial={inicial}
      usuario={{ nome: ctx.usuario.nome ?? "", whatsapp: ctx.usuario.whatsapp ?? "", email: ctx.usuario.email }}
      empresaInicial={
        ctx.empresa
          ? { id: ctx.empresa.id, nome: ctx.empresa.nome_fantasia, cor: ctx.empresa.cor_primaria, logo: ctx.empresa.logo_app_url }
          : null
      }
      diasTeste={plat?.dias_teste ?? 14}
      somenteEdicao={Boolean(ctx.empresa) && Boolean(passo)}
    />
  );
}
