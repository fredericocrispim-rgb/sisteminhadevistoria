import { cache } from "react";
import type { Metadata } from "next";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { formatarTelefone, telefoneParaWhatsapp } from "@/lib/formatos";
import { ENDERECO_SITE, previaLink } from "@/lib/previa-link";
import { textos } from "@/lib/textos";

/**
 * Site de divulgação (páginas públicas para o Google): menu, rodapé, metadados e dados de contato.
 * Os textos longos dessas páginas ficam nas próprias páginas, em app/(site).
 */

export { ENDERECO_SITE };

export { MENU_SITE, RODAPE_SITE, PAGINAS_COM_CABECALHO_SITE, temCabecalhoSite } from "@/lib/site-paginas";

/** Título, descrição, endereço oficial (canonical) e prévia de link de uma página pública. */
export function metadadosPagina({ titulo, descricao, caminho }: { titulo: string; descricao: string; caminho: string }): Metadata {
  return {
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: { ...previaLink, title: titulo, description: descricao, url: caminho },
    twitter: { card: "summary_large_image", title: titulo, description: descricao, images: previaLink.images },
  };
}

/** WhatsApp do suporte (cadastrado no /admin, tabela plataforma). */
export const contatoSuporte = cache(async () => {
  try {
    const { data } = await criarClienteAdmin().from("plataforma").select("whatsapp_suporte, fornecedor_whatsapp").single();
    const numero = data?.whatsapp_suporte || data?.fornecedor_whatsapp;
    if (!numero) return null;
    const digitos = telefoneParaWhatsapp(numero);
    return {
      link: `https://wa.me/${digitos}?text=${encodeURIComponent(`Olá! Quero saber mais sobre o ${textos.produto.nome}.`)}`,
      telefoneSchema: `+${digitos}`,
      texto: formatarTelefone(numero),
    };
  } catch {
    return null;
  }
});

export type DadosFornecedor = {
  razaoSocial: string | null;
  cnpj: string | null;
  endereco: string | null;
  email: string | null;
  whatsapp: string | null;
  responsavel: string | null;
  diasTeste: number;
  diasCarencia: number;
  versaoTermos: string;
  versaoPrivacidade: string;
};

/** Dados da empresa fornecedora (tabela plataforma) para os Termos de Uso e a Política de Privacidade. */
export const dadosFornecedor = cache(async (): Promise<DadosFornecedor> => {
  // select("*"): a página continua abrindo mesmo antes da migração com as colunas empresa_*
  const { data } = await criarClienteAdmin()
    .from("plataforma")
    .select("*")
    .single()
    .then((r) => r, () => ({ data: null }));
  const p = (data ?? {}) as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const numero = texto(p.whatsapp_suporte) ?? texto(p.fornecedor_whatsapp);
  return {
    razaoSocial: texto(p.empresa_razao_social),
    cnpj: texto(p.empresa_cnpj),
    endereco: texto(p.empresa_endereco),
    email: texto(p.empresa_email) ?? texto(p.fornecedor_email),
    whatsapp: numero ? formatarTelefone(numero) : null,
    responsavel: texto(p.fornecedor_nome),
    diasTeste: typeof p.dias_teste === "number" ? p.dias_teste : 1,
    diasCarencia: typeof p.dias_carencia === "number" ? p.dias_carencia : 5,
    versaoTermos: texto(p.versao_termos_atual) ?? "1",
    versaoPrivacidade: texto(p.versao_privacidade_atual) ?? "1",
  };
});

/** Endereço completo de um caminho do site. */
export function enderecoCompleto(caminho: string) {
  return caminho === "/" ? ENDERECO_SITE : `${ENDERECO_SITE}${caminho}`;
}

/** Dados estruturados "caminho da página" (BreadcrumbList) para as páginas internas. */
export function schemaCaminho(itens: { nome: string; caminho: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ nome: "Início", caminho: "/" }, ...itens].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: enderecoCompleto(item.caminho),
    })),
  };
}
