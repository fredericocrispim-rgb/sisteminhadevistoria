import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MessageCircle } from "lucide-react";
import { LogoOficina } from "@/components/vf";
import { exigirSuperadmin } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diasAte } from "@/lib/cadastro";
import { telefoneParaWhatsapp } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import { marcarComoPago } from "./acoes";
import { LinkSenha } from "./link-senha";

export const metadata: Metadata = { title: "Administrador", robots: { index: false } };

type Assinatura = { status: string; fim_teste: string | null; proximo_vencimento: string | null };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

function situacao(a: Assinatura | undefined) {
  if (!a) return { texto: "—", classe: "bg-background" };
  if (a.status === "ativa") {
    return { texto: a.proximo_vencimento ? `Pago até ${dataBR(a.proximo_vencimento)}` : "Pago", classe: "bg-acao-clara text-acao" };
  }
  if (a.status === "teste") {
    const dias = a.fim_teste ? diasAte(a.fim_teste) : 0;
    return dias > 0
      ? { texto: `Teste: ${dias} ${dias === 1 ? "dia" : "dias"}`, classe: "bg-oficina-clara text-oficina" }
      : { texto: "Teste acabou", classe: "bg-atencao-clara text-atencao-texto" };
  }
  return { texto: "Pagamento pendente", classe: "bg-atencao-clara text-atencao-texto" };
}

/** Painel do administrador (Frederico): oficinas, contato no WhatsApp e confirmação manual do Pix. */
export default async function Admin() {
  await exigirSuperadmin();
  const admin = criarClienteAdmin();
  const { data: empresas } = await admin
    .from("empresas")
    .select(
      "id, nome_fantasia, cidade, uf, whatsapp, responsavel_nome, logo_app_url, criado_em, assinaturas (status, fim_teste, proximo_vencimento)",
    )
    .order("criado_em", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <Link href="/mais" className="inline-flex min-h-toque items-center gap-1.5 self-start text-lg font-bold">
        <ArrowLeft aria-hidden className="size-6" /> Voltar
      </Link>
      <LinkSenha />
      <h1 className="text-[1.75rem] font-extrabold">Oficinas ({empresas?.length ?? 0})</h1>
      <p className="text-base text-muted-foreground">
        Quando o Pix cair na conta, toque em <strong>Marcar como pago</strong>: libera mais 30 dias.
      </p>
      <ul className="flex flex-col gap-3">
        {empresas?.map((e) => {
          const bruto = e.assinaturas as unknown as Assinatura[] | Assinatura | null;
          const a = (Array.isArray(bruto) ? bruto[0] : bruto) ?? undefined;
          const s = situacao(a);
          const primeiroNome = e.responsavel_nome?.split(" ")[0] ?? "";
          const mensagem = `Olá${primeiroNome ? `, ${primeiroNome}` : ""}! Aqui é o Frederico, do ${textos.produto.nome}. Tudo certo com o teste da ${e.nome_fantasia}?`;
          return (
            <li key={e.id} className="flex flex-col gap-3 rounded-2xl bg-superficie p-4">
              <div className="flex items-center gap-3">
                <LogoOficina nome={e.nome_fantasia} url={e.logo_app_url} tamanho="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{e.nome_fantasia}</p>
                  <p className="text-base text-muted-foreground">
                    {[e.responsavel_nome, [e.cidade, e.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-sm text-muted-foreground">Desde {new Date(e.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <span className={`self-start rounded-full px-3 py-1 text-base font-bold ${s.classe}`}>{s.texto}</span>
              <div className="grid grid-cols-2 gap-2">
                {e.whatsapp ? (
                  <a
                    href={`https://wa.me/${telefoneParaWhatsapp(e.whatsapp)}?text=${encodeURIComponent(mensagem)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-3 text-base font-bold text-white"
                  >
                    <MessageCircle aria-hidden className="size-6" /> WhatsApp
                  </a>
                ) : (
                  <span />
                )}
                <form action={marcarComoPago}>
                  <input type="hidden" name="empresa_id" value={e.id} />
                  <button
                    type="submit"
                    className="tocavel inline-flex min-h-toque w-full items-center justify-center gap-2 rounded-2xl bg-acao px-3 text-base font-bold text-acao-texto"
                  >
                    <BadgeCheck aria-hidden className="size-6" /> Marcar como pago
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
