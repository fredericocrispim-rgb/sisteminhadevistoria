import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Gift } from "lucide-react";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { textos } from "@/lib/textos";
import { CompartilharIndicacao } from "./compartilhar";

export const metadata: Metadata = { title: textos.indicar.titulo };

/** Indique e ganhe: código da oficina, link para mandar no WhatsApp e oficinas já indicadas. */
export default async function Indicar() {
  const { empresa } = await exigirOficina();
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const link = `${base}/?ref=${empresa.codigo_indicacao}`;

  // Só o servidor lê as oficinas indicadas (nome e se já pagou), filtrando pela oficina de quem está logado
  const { data: indicadas } = await criarClienteAdmin()
    .from("empresas")
    .select("id, nome_fantasia, assinaturas (status)")
    .eq("indicada_por_empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6 pb-8">
      <Link href="/mais" className="inline-flex min-h-toque items-center gap-1.5 self-start text-lg font-bold">
        <ArrowLeft aria-hidden className="size-6" /> {textos.geral.voltar}
      </Link>

      <div className="flex flex-col items-center gap-3 rounded-3xl bg-acao-clara p-6 text-center">
        <Gift aria-hidden className="size-14 text-acao" />
        <h1 className="text-[1.75rem] leading-tight font-extrabold">{textos.indicar.titulo}</h1>
        <p className="text-lg font-semibold">{textos.indicar.regra}</p>
      </div>

      <div className="rounded-2xl bg-superficie px-4 py-3 text-center">
        <p className="text-base font-bold text-muted-foreground">{textos.indicar.seuCodigo}</p>
        <p className="font-mono text-4xl font-extrabold tracking-widest">{empresa.codigo_indicacao}</p>
      </div>

      <CompartilharIndicacao link={link} mensagem={textos.indicar.mensagem(link)} />

      <section className="mt-2 flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">{textos.indicar.indicadas}</h2>
        {indicadas?.length ? (
          indicadas.map((o) => {
            const bruto = o.assinaturas as unknown as { status: string }[] | { status: string } | null;
            const status = (Array.isArray(bruto) ? bruto[0] : bruto)?.status;
            const pagou = status === "ativa";
            return (
              <div key={o.id} className="flex items-center gap-3 rounded-2xl bg-superficie px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-lg font-bold">{o.nome_fantasia}</span>
                <span
                  className={`rounded-full px-3 py-1 text-base font-bold ${pagou ? "bg-acao-clara text-acao" : "bg-atencao-clara"}`}
                >
                  {pagou ? "Já pagou" : "Testando"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-lg text-muted-foreground">{textos.indicar.nenhuma}</p>
        )}
      </section>
    </main>
  );
}
