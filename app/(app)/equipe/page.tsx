import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { mensalidadeDaOficina } from "@/lib/mensalidade";
import { valorMensalidade } from "@/lib/cobranca";
import { formatarReais } from "@/lib/pix";
import { textos } from "@/lib/textos";
import { AdicionarPessoa, ConvitePendente, Membro } from "./componentes";

export const metadata: Metadata = { title: textos.equipe.titulo };

const t = textos.equipe;

/** Equipe da oficina: quem usa o sistema, convites e quanto a equipe custa por mês. */
export default async function Equipe() {
  const { empresa, papel, usuario } = await exigirOficina();
  if (papel !== "dono" && papel !== "gerente") redirect("/inicio");

  const supabase = await criarClienteServidor();
  const [{ data: membros }, { data: convites }, m] = await Promise.all([
    supabase.from("usuarios_empresa").select("id, user_id, nome, papel").eq("empresa_id", empresa.id).eq("ativo", true).order("criado_em"),
    supabase
      .from("convites")
      .select("id, nome, papel, token")
      .eq("empresa_id", empresa.id)
      .eq("cancelado", false)
      .is("aceito_em", null)
      .gt("expira_em", new Date().toISOString())
      .order("criado_em", { ascending: false }),
    mensalidadeDaOficina(empresa.id),
  ]);

  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const pendentes = convites?.length ?? 0;
  // Quanto vai custar se mais uma pessoa entrar (contando os convites que ainda não foram aceitos)
  const valorComMaisUm = valorMensalidade(m.preco, m.usuarios + pendentes + 1);
  // Quantas pessoas ainda cabem no plano sem pagar a mais
  const restam = m.preco.inclusos == null ? 0 : Math.max(0, m.preco.inclusos - m.usuarios - pendentes);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link href="/mais" className="inline-flex min-h-toque items-center gap-1.5 self-start text-lg font-bold">
        <ArrowLeft aria-hidden className="size-6" /> {textos.geral.voltar}
      </Link>
      <h1 className="flex items-center gap-2 text-[1.75rem] font-extrabold">
        <Users aria-hidden className="size-8" /> {t.titulo}
      </h1>

      <div className="rounded-2xl bg-oficina-clara px-4 py-3">
        <p className="text-xl font-extrabold text-oficina">{t.hoje(m.usuarios, formatarReais(m.valor))}</p>
        {m.preco.inclusos != null && m.preco.extra > 0 && (
          <p className="text-base font-semibold">{t.precoRegra(m.preco.inclusos, formatarReais(m.preco.extra))}</p>
        )}
      </div>

      <AdicionarPessoa
        oficina={empresa.nome_fantasia}
        base={base}
        avisoPlano={restam > 0 ? t.dentroDoPlano(restam) : null}
        avisoPreco={valorComMaisUm > m.valor ? t.comEssaPessoa(formatarReais(valorComMaisUm)) : null}
      />

      <ul className="flex flex-col gap-2">
        {membros?.map((p) => (
          <Membro
            key={p.id}
            id={p.id}
            nome={p.nome ?? "Sem nome"}
            papel={t.papeis[p.papel as keyof typeof t.papeis] ?? p.papel}
            voce={p.user_id === usuario.id}
            podeTirar={p.papel !== "dono" && p.user_id !== usuario.id}
          />
        ))}
      </ul>

      {pendentes > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold">{t.pendentes}</h2>
          {convites!.map((c) => (
            <ConvitePendente
              key={c.id}
              id={c.id}
              nome={c.nome}
              papel={t.papeis[c.papel as keyof typeof t.papeis] ?? c.papel}
              mensagem={t.mensagem(c.nome.split(" ")[0], empresa.nome_fantasia, `${base}/convite/${c.token}`)}
            />
          ))}
        </section>
      )}

    </main>
  );
}
