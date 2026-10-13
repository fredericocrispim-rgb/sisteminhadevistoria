import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoOficina } from "@/components/vf";
import { exigirSuperadmin } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Administrador", robots: { index: false } };

const nomeStatus: Record<string, string> = {
  teste: "Teste",
  ativa: "Pagando",
  em_atraso: "Atrasado",
  inadimplente: "Bloqueado",
  cancelada: "Cancelado",
};

/** Painel do administrador da plataforma (Frederico). Versão inicial: lista de oficinas. */
export default async function Admin() {
  await exigirSuperadmin();
  const admin = criarClienteAdmin();
  const { data: empresas } = await admin
    .from("empresas")
    .select("id, nome_fantasia, cidade, uf, logo_app_url, cor_primaria, criado_em, assinaturas (status, fim_teste)")
    .order("criado_em", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <Link href="/mais" className="inline-flex min-h-toque items-center gap-1.5 self-start text-lg font-bold">
        <ArrowLeft aria-hidden className="size-6" /> Voltar
      </Link>
      <h1 className="text-[1.75rem] font-extrabold">Oficinas ({empresas?.length ?? 0})</h1>
      <ul className="flex flex-col gap-2">
        {empresas?.map((e) => {
          const a = (e.assinaturas as unknown as { status: string; fim_teste: string | null }[] | { status: string; fim_teste: string | null } | null);
          const assinatura = Array.isArray(a) ? a[0] : a;
          return (
            <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-superficie p-3">
              <LogoOficina nome={e.nome_fantasia} url={e.logo_app_url} cor={e.cor_primaria} tamanho="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{e.nome_fantasia}</p>
                <p className="text-base text-muted-foreground">
                  {[e.cidade, e.uf].filter(Boolean).join("/") || "Sem cidade"} · desde {new Date(e.criado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-background px-3 py-1 text-sm font-bold">
                {nomeStatus[assinatura?.status ?? ""] ?? "—"}
                {assinatura?.status === "teste" && assinatura.fim_teste
                  ? ` até ${new Date(`${assinatura.fim_teste}T12:00:00`).toLocaleDateString("pt-BR")}`
                  : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
