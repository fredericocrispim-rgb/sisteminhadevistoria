import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirLogin } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { valorMensalidade } from "@/lib/cobranca";
import { planosAVenda } from "@/lib/pagamentos/config";
import { Assistente } from "./assistente";

export const metadata: Metadata = { title: "Cadastro", robots: { index: false, follow: false } };

/**
 * Cadastro da oficina, uma pergunta por tela (veja o Assistente): você, a oficina, a logo e o plano.
 * Pode parar e continuar: abre no passo que falta. ?passo=2 = trocar a logo (menu Mais).
 */
export default async function PaginaCadastro({ searchParams }: PageProps<"/cadastro">) {
  const ctx = await exigirLogin();
  if (ctx.empresa && ctx.papel === "vistoriador") redirect("/inicio");

  const { passo } = await searchParams;
  const inicial = !ctx.empresa || !ctx.usuario.nome ? 1 : 2;
  const somenteEdicao = Boolean(ctx.empresa) && passo === "2";

  const supabase = await criarClienteServidor();
  const admin = criarClienteAdmin();
  const [{ data: plat }, { data: config }, { data: planos }] = await Promise.all([
    supabase.from("plataforma").select("dias_teste").single(),
    admin.from("plataforma").select("*").single(), // "*": video_ligado só existe depois da migração do vídeo
    admin.from("planos").select("*").eq("ativo", true).order("ordem"),
  ]);
  // Escolha do plano no fim do cadastro: Básico e, com o vídeo ligado, o Pro (preço para 1 pessoa: o dono)
  const opcoesPlano = planosAVenda(planos ?? [], Boolean(config?.video_ligado)).map((p) => ({
    id: p.id as string,
    nome: p.nome as string,
    valor: valorMensalidade({ base: Number(p.preco_mensal), inclusos: p.limite_usuarios, extra: Number(p.preco_usuario_extra ?? 0) }, 1),
    inclusos: p.limite_usuarios as number | null,
    video: (p.video_segundos ?? 0) > 0,
  }));

  return (
    <Assistente
      passoInicial={somenteEdicao ? 2 : inicial}
      usuario={{ nome: ctx.usuario.nome ?? "", whatsapp: ctx.usuario.whatsapp ?? "", email: ctx.usuario.email }}
      empresaInicial={ctx.empresa ? { id: ctx.empresa.id, nome: ctx.empresa.nome_fantasia, logo: ctx.empresa.logo_app_url } : null}
      diasTeste={plat?.dias_teste ?? 1}
      planos={opcoesPlano}
      somenteEdicao={somenteEdicao}
    />
  );
}
