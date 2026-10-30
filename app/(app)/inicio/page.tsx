import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AlertTriangle, CarFront, ChevronRight, Clock, LogIn, LogOut, QrCode } from "lucide-react";
import { InstalarApp, LogoOficina } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { hojeBR } from "@/lib/cadastro";
import { listarPatio } from "@/lib/patio";
import { placaParaMostrar } from "@/lib/vistoria";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const { empresa, papel, usuario, plano } = await exigirOficina();
  const gestor = papel === "dono" || papel === "gerente";

  // Régua de cobrança: perto de vencer ou em atraso, o Pix aparece ao entrar (uma vez por dia)
  const dono = papel === "dono"; // aviso do Pix e do teste grátis: só para o dono
  const avisar = dono && (plano.fase === "vence_logo" || plano.fase === "atrasado");
  if (avisar && (await cookies()).get("vf_aviso_pix")?.value !== hojeBR()) redirect("/plano?aviso=1");

  const supabaseInicio = await criarClienteServidor();
  const [{ data: rascunho }, patio] = await Promise.all([
    supabaseInicio
      .from("vistorias")
      .select("id, tipo, veiculos (placa)")
      .eq("empresa_id", empresa.id)
      .eq("status", "rascunho")
      .eq("criado_por", usuario.id)
      .order("iniciada_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
    listarPatio(),
  ]);
  const placaRascunho = (rascunho?.veiculos as unknown as { placa: string } | null)?.placa;

  // A situação do plano já veio junto com o login (sem consulta a mais)
  const diasTeste = dono && plano.status === "teste" && plano.fase === "em_dia" ? plano.diasParaVencer + 1 : null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 px-4 pt-4">
      <header className="flex items-center gap-3 py-1">
        <LogoOficina nome={empresa.nome_fantasia} url={empresa.logo_app_url} />
        <p className="min-w-0 truncate text-xl leading-tight font-extrabold">{empresa.nome_fantasia}</p>
      </header>

      <BotaoGigante href="/vistorias/nova?tipo=ENTRADA" cor="bg-oficina text-oficina-texto" icone={<LogIn aria-hidden />}>
        {textos.vistoria.chegadaBotao}
      </BotaoGigante>
      <BotaoGigante href="/vistorias/nova?tipo=SAIDA" cor="bg-acao text-acao-texto" icone={<LogOut aria-hidden />}>
        {textos.vistoria.entregaBotao}
      </BotaoGigante>

      <InstalarApp />

      {rascunho && (
        <Link href={`/vistorias/${rascunho.id}`} className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-atencao-clara px-4 py-3">
          <span className="flex-1">
            <span className="block text-base font-bold text-atencao-texto">Continuar {rascunho.tipo === "ENTRADA" ? "chegada" : "entrega"}</span>
            <span className="block font-mono text-2xl font-extrabold tracking-wider">{placaRascunho ? placaParaMostrar(placaRascunho) : "Sem placa"}</span>
          </span>
          <ChevronRight aria-hidden className="size-8 text-atencao-texto" />
        </Link>
      )}

      {patio.length > 0 && (
        <Link href="/patio" className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-superficie px-4">
          <CarFront aria-hidden className="size-8 text-muted-foreground" />
          <span className="flex-1 text-xl font-bold">{textos.menu.veiculosNoPatio}</span>
          <span className="grid min-w-10 place-items-center rounded-full bg-foreground px-3 py-1 text-lg font-extrabold text-background">{patio.length}</span>
        </Link>
      )}

      {gestor && empresa.cadastro_completo_pct < 100 && (
        <Link href="/cadastro?passo=2" className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-atencao-clara px-4 py-3">
          <span className="flex-1">
            <span className="block text-lg font-extrabold text-atencao-texto">Cadastro {empresa.cadastro_completo_pct}% pronto</span>
            <span className="block text-base font-semibold text-atencao-texto">
              {empresa.logo_app_url ? "Complete os dados da oficina" : "Falta a logo da oficina"}
            </span>
          </span>
          <ChevronRight aria-hidden className="size-8 text-atencao-texto" />
        </Link>
      )}

      {avisar && (
        <Link
          href="/plano"
          className={cn(
            "tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl px-4 py-3",
            plano.fase === "atrasado" ? "bg-atencao-clara text-atencao-texto" : "bg-oficina-clara text-oficina",
          )}
        >
          {plano.status === "teste" ? <QrCode aria-hidden className="size-7 shrink-0" /> : <AlertTriangle aria-hidden className="size-7 shrink-0" />}
          <span className="flex-1 text-lg font-extrabold">
            {plano.status === "teste" // cadastro novo: o QR Code do Pix fica sempre a um toque
              ? plano.diasParaVencer === 0
                ? "Último dia. Pagar pelo Pix"
                : plano.diasParaVencer === 1
                  ? "Pagar pelo Pix até amanhã"
                  : `Pagar pelo Pix em ${plano.diasParaVencer} dias`
              : plano.fase === "atrasado"
              ? `Mensalidade em atraso. Bloqueia em ${Math.max(0, plano.carencia - plano.diasAtraso + 1)} ${plano.carencia - plano.diasAtraso + 1 === 1 ? "dia" : "dias"}`
              : plano.diasParaVencer === 0
                ? "Vence hoje. Pague pelo Pix"
                : `Vence em ${plano.diasParaVencer} ${plano.diasParaVencer === 1 ? "dia" : "dias"}. Pague pelo Pix`}
          </span>
          <ChevronRight aria-hidden className="size-7 shrink-0" />
        </Link>
      )}

      {diasTeste !== null && (
        <Link href="/plano" className="tocavel flex min-h-toque items-center gap-3 rounded-2xl bg-superficie px-4 py-3">
          <Clock aria-hidden className="size-7 text-muted-foreground" />
          <span className="flex-1 text-lg font-bold">
            {diasTeste === 0 ? "Teste grátis acaba hoje" : `${diasTeste} ${diasTeste === 1 ? "dia" : "dias"} de teste grátis`}
          </span>
        </Link>
      )}
    </main>
  );
}

function BotaoGigante({ href, cor, icone, children }: { href: string; cor: string; icone: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn("tocavel flex min-h-[28svh] flex-col items-center justify-center gap-3 rounded-3xl px-4 [&_svg]:size-16", cor)}
    >
      {icone}
      <span className="text-[1.75rem] font-extrabold tracking-wide">{children}</span>
    </Link>
  );
}
