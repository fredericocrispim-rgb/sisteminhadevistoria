import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { exigirSuperadmin } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { hojeBR } from "@/lib/cadastro";
import { valorMensalidade } from "@/lib/cobranca";
import { gerarPixCopiaECola } from "@/lib/pix";
import { situacaoOficina } from "@/lib/admin-painel";
import { textos } from "@/lib/textos";
import { LinkSenha } from "./link-senha";
import { mudarVideo } from "./acoes";
import { PainelOficinas, type OficinaPainel, type PessoaPainel } from "./painel";
import { RelatorioComissoes, type Vendedor } from "./comissoes";
import type { Comissao } from "@/lib/comissao";

export const metadata: Metadata = { title: "Administrador", robots: { index: false, follow: false } };

type Assinatura = {
  status: string;
  fim_teste: string | null;
  proximo_vencimento: string | null;
  plano_id: string | null;
  provedor: string | null;
  forma_pagamento: string | null;
  acesso_ate: string | null;
};
type Vinculo = { id: string; user_id: string; nome: string | null; papel: string; ativo: boolean; cupom: string | null; criado_em: string };

const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const maisRecente = (...datas: (string | null | undefined)[]) =>
  datas.filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;

/**
 * Painel do administrador (Frederico): todas as oficinas, quem é o responsável, último uso,
 * situação do pagamento, gerenciar o acesso e mandar cobrança pelo WhatsApp.
 * Aba "Comissões" (?aba=comissoes): vendedores e relatório das comissões de venda (50% do recebido).
 */
export default async function Admin({ searchParams }: PageProps<"/admin">) {
  await exigirSuperadmin();
  const { aba } = await searchParams;
  const admin = criarClienteAdmin();
  // Comissões em consultas separadas: se o banco ainda não foi preparado, o resto do painel funciona igual
  const [vend, vendaPorOficina, coms, gratis] = await Promise.all([
    admin.from("vendedores").select("id, nome, whatsapp, pix_chave, ativo").order("nome"),
    admin.from("empresas").select("id, vendedor_id").not("vendedor_id", "is", null),
    admin
      .from("comissoes")
      .select("id, vendedor_id, empresa_id, valor_recebido, recebido_em, percentual, valor, status, paga_em")
      .order("recebido_em", { ascending: false })
      .limit(5000),
    // Separado: antes da migração da coluna "gratuita", o painel funciona igual (ninguém gratuito)
    admin.from("empresas").select("id").eq("gratuita", true),
  ]);
  const gratuitas = new Set((gratis.data ?? []).map((e) => e.id));
  const bancoComissoesPronto = !vend.error && !vendaPorOficina.error && !coms.error;
  const vendedores: Vendedor[] = (vend.data ?? []).map((v) => ({ id: v.id, nome: v.nome, whatsapp: v.whatsapp, pixChave: v.pix_chave, ativo: v.ativo }));
  const vendedorDaOficina = new Map((vendaPorOficina.data ?? []).map((e) => [e.id, e.vendedor_id as string]));

  const [{ data: plat }, { data: planos }, { data: empresas }, { data: vistorias }, { data: faturas }, { data: mensagens }, usuariosAuth] =
    await Promise.all([
      admin.from("plataforma").select("*").single(), // "*": video_ligado só existe depois da migração do vídeo
      admin.from("planos").select("id, nome, preco_mensal, limite_usuarios, preco_usuario_extra").eq("ativo", true).order("ordem"),
      admin
        .from("empresas")
        .select(
          "id, nome_fantasia, cidade, uf, whatsapp, email, responsavel_nome, logo_app_url, criado_em, codigo_indicacao, indicada_por_empresa_id, ativa, inativada_em, assinaturas (status, fim_teste, proximo_vencimento, acesso_ate, plano_id, provedor, forma_pagamento), usuarios_empresa (id, user_id, nome, papel, ativo, cupom, criado_em)",
        )
        .order("criado_em", { ascending: false })
        .limit(500),
      admin.from("vistorias").select("empresa_id, iniciada_em, status").order("iniciada_em", { ascending: false }).limit(10000),
      admin.from("faturas").select("empresa_id, valor, pago_em, descricao").eq("status", "paga").order("pago_em", { ascending: false }).limit(2000),
      admin
        .from("auditoria")
        .select("empresa_id, data_hora")
        .eq("acao", "mensagem_whatsapp")
        .order("data_hora", { ascending: false })
        .limit(2000),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const carencia = plat?.dias_carencia ?? 5;
  const hoje = hojeBR();
  const h = await headers();
  const site = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const nomePorId = new Map((empresas ?? []).map((e) => [e.id, e.nome_fantasia]));
  const contas = new Map((usuariosAuth.data?.users ?? []).map((u) => [u.id, u]));

  // Vistorias por oficina: total, últimos 30 dias e a mais recente
  const limite30 = diasAtras(30);
  const usoVistorias = new Map<string, { total: number; mes: number; ultima: string | null }>();
  for (const v of vistorias ?? []) {
    const u = usoVistorias.get(v.empresa_id) ?? { total: 0, mes: 0, ultima: null };
    if (v.status !== "cancelada") {
      u.total++;
      if (v.iniciada_em >= limite30) u.mes++;
    }
    u.ultima = maisRecente(u.ultima, v.iniciada_em);
    usoVistorias.set(v.empresa_id, u);
  }
  const pagamentos = new Map<string, { valor: number; pagoEm: string; descricao: string | null }[]>();
  for (const f of faturas ?? []) {
    if (!f.pago_em) continue;
    const lista = pagamentos.get(f.empresa_id) ?? [];
    lista.push({ valor: Number(f.valor), pagoEm: f.pago_em, descricao: f.descricao });
    pagamentos.set(f.empresa_id, lista);
  }
  const ultimaMensagem = new Map<string, string>();
  for (const m of mensagens ?? []) if (m.empresa_id && !ultimaMensagem.has(m.empresa_id)) ultimaMensagem.set(m.empresa_id, m.data_hora);

  const oficinas: OficinaPainel[] = (empresas ?? []).map((e) => {
    const bruto = e.assinaturas as unknown as Assinatura[] | Assinatura | null;
    const a = (Array.isArray(bruto) ? bruto[0] : bruto) ?? null;
    const situacao = situacaoOficina(a, hoje, carencia);

    const equipe: PessoaPainel[] = (e.usuarios_empresa as unknown as Vinculo[])
      .map((v) => {
        const conta = contas.get(v.user_id);
        const meta = (conta?.user_metadata ?? {}) as Record<string, unknown>;
        const appMeta = (conta?.app_metadata ?? {}) as Record<string, unknown>;
        return {
          vinculoId: v.id,
          nome: v.nome ?? (typeof meta.nome === "string" ? meta.nome : null),
          email: conta?.email ?? null,
          whatsapp: typeof meta.whatsapp === "string" ? meta.whatsapp : null,
          papel: v.papel,
          ativo: v.ativo,
          cortesia: Boolean(v.cupom),
          ultimoUso: maisRecente(typeof appMeta.ultimo_acesso === "string" ? appMeta.ultimo_acesso : null, conta?.last_sign_in_at),
        };
      })
      .sort((x, y) => (x.papel === "dono" ? -1 : y.papel === "dono" ? 1 : (y.ultimoUso ?? "").localeCompare(x.ultimoUso ?? "")));

    const ativos = equipe.filter((p) => p.ativo);
    const cortesias = ativos.filter((p) => p.cortesia).length;
    const usuarios = Math.max(1, ativos.length - cortesias); // quem tem cupom não é cobrado
    const pl = planos?.find((x) => x.id === a?.plano_id) ?? planos?.[0];
    const valor = pl
      ? valorMensalidade({ base: Number(pl.preco_mensal), inclusos: pl.limite_usuarios, extra: Number(pl.preco_usuario_extra ?? 0) }, usuarios)
      : 0;
    const pix =
      plat?.pix_chave && plat.pix_nome_recebedor && plat.pix_cidade && valor > 0
        ? gerarPixCopiaECola({
            chave: plat.pix_chave,
            nome: plat.pix_nome_recebedor,
            cidade: plat.pix_cidade,
            valor,
            descricao: plat.nome_produto ?? textos.produto.nome,
          })
        : null;

    const dono = equipe.find((p) => p.papel === "dono");
    const uso = usoVistorias.get(e.id) ?? { total: 0, mes: 0, ultima: null };
    return {
      id: e.id,
      nome: e.nome_fantasia,
      logo: e.logo_app_url,
      cidade: [e.cidade, e.uf].filter(Boolean).join("/"),
      criadoEm: e.criado_em,
      codigo: e.codigo_indicacao,
      indicadaPor: e.indicada_por_empresa_id ? (nomePorId.get(e.indicada_por_empresa_id) ?? "outra oficina") : null,
      responsavel: {
        nome: dono?.nome ?? e.responsavel_nome ?? null,
        whatsapp: dono?.whatsapp ?? e.whatsapp ?? null,
        email: dono?.email ?? e.email ?? null,
      },
      whatsappOficina: e.whatsapp,
      situacao,
      teste: !a || a.status === "teste",
      planoNome: pl?.nome ?? "",
      usuarios,
      cortesias,
      valor,
      pix,
      ultimoUso: maisRecente(uso.ultima, ...equipe.map((p) => p.ultimoUso)),
      vistoriasTotal: uso.total,
      vistoriasMes: uso.mes,
      ultimaVistoria: uso.ultima,
      equipe,
      pagamentos: (pagamentos.get(e.id) ?? []).slice(0, 6),
      ultimaMensagem: ultimaMensagem.get(e.id) ?? null,
      vendedorId: vendedorDaOficina.get(e.id) ?? null,
      ativa: e.ativa !== false,
      gratuita: gratuitas.has(e.id),
      inativadaEm: e.inativada_em ?? null,
      pagamento: a?.provedor === "asaas" ? (a.forma_pagamento === "CREDIT_CARD" ? "asaas_cartao" : "asaas_pix") : "pix_manual",
    };
  });

  const comissoes: Comissao[] = (coms.data ?? []).map((c) => ({
    id: c.id,
    vendedorId: c.vendedor_id,
    empresaId: c.empresa_id,
    oficina: nomePorId.get(c.empresa_id) ?? "Oficina",
    valorRecebido: Number(c.valor_recebido),
    recebidoEm: c.recebido_em,
    percentual: Number(c.percentual),
    valor: Number(c.valor),
    status: c.status as Comissao["status"],
    pagaEm: c.paga_em,
  }));
  const produto = plat?.nome_produto ?? textos.produto.nome;
  const naComissoes = aba === "comissoes";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <Link href="/mais" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft aria-hidden className="size-4" /> Voltar
          </Link>
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight">Painel do administrador</h1>
        </div>
        <nav aria-label="Partes do painel" className="grid grid-cols-2 gap-1 rounded-xl bg-superficie p-1 sm:w-72">
          {[
            { href: "/admin", nome: "Oficinas", ativo: !naComissoes },
            { href: "/admin?aba=comissoes", nome: "Comissões", ativo: naComissoes },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              aria-current={a.ativo ? "page" : undefined}
              className={`flex min-h-10 items-center justify-center rounded-lg text-sm font-bold ${a.ativo ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {a.nome}
            </Link>
          ))}
        </nav>
      </header>
      {naComissoes ? (
        <RelatorioComissoes
          comissoes={comissoes}
          vendedores={vendedores}
          oficinasPorVendedor={Object.fromEntries(vendedores.map((v) => [v.id, oficinas.filter((o) => o.vendedorId === v.id).length]))}
          produto={produto}
          bancoPronto={bancoComissoesPronto}
        />
      ) : (
        <>
          <PainelOficinas
            oficinas={oficinas}
            produto={produto}
            linkPlano={`${site}/plano`}
            vendedores={vendedores}
            comissaoAtiva={bancoComissoesPronto}
          />
          <LinkSenha />
          {plat && "video_ligado" in plat && (
            <form action={mudarVideo} className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 sm:flex-row sm:items-center sm:justify-between">
              <input type="hidden" name="ligar" value={plat.video_ligado ? "nao" : "sim"} />
              <div>
                <p className="text-lg font-extrabold">
                  Vídeo do plano Pro: <span className={plat.video_ligado ? "text-acao" : "text-muted-foreground"}>{plat.video_ligado ? "Ligado" : "Desligado"}</span>
                </p>
                <p className="text-sm text-muted-foreground">Ligue só depois de contratar o Supabase Pro. No plano grátis (1 GB) não cabem vídeos.</p>
              </div>
              <button type="submit" className="tocavel min-h-toque rounded-xl bg-background px-4 text-base font-bold">
                {plat.video_ligado ? "Desligar vídeo" : "Ligar vídeo"}
              </button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
