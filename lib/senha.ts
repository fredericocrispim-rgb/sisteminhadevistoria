import "server-only";
import { headers } from "next/headers";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Link de senha nova (uso único, vale 1 hora). Abre /criar-senha, que só usa o link quando a pessoa
 * toca em "Salvar nova senha". Assim a prévia do WhatsApp e o antivírus do e-mail (que abrem o link
 * sozinhos) não gastam o link antes da pessoa.
 */

/** Endereço do site de onde veio o pedido (www.vistoriarapida.digital ou localhost). */
export async function enderecoDoSite() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

export function linkCriarSenha(base: string, tokenHash: string) {
  return `${base}/criar-senha?token=${encodeURIComponent(tokenHash)}`;
}

/** Gera o link. Sem conta com esse e-mail, devolve null. */
export async function gerarLinkCriarSenha(email: string) {
  const { data, error } = await criarClienteAdmin().auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties?.hashed_token) return null;
  return { link: linkCriarSenha(await enderecoDoSite(), data.properties.hashed_token), usuario: data.user };
}

/** Manda e-mail pelo Resend (RESEND_API_KEY e EMAIL_REMETENTE na Vercel). Sem a chave, devolve false. */
export async function mandarEmail(d: { para: string; assunto: string; html: string; texto: string }) {
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_REMETENTE;
  if (!chave || !de) return false;
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: de, to: [d.para], subject: d.assunto, html: d.html, text: d.texto }),
    cache: "no-store",
  });
  if (!resposta.ok) {
    console.error("Resend: falha ao mandar e-mail", resposta.status, await resposta.text());
    return false;
  }
  return true;
}

export const emailConfigurado = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE);
