import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Clock, LogIn, LogOut } from "lucide-react";
import { LogoOficina } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { diasAte } from "@/lib/cadastro";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const { empresa, papel } = await exigirOficina();
  const gestor = papel === "dono" || papel === "gerente";

  let diasTeste: number | null = null;
  if (gestor) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.from("assinaturas").select("status, fim_teste").eq("empresa_id", empresa.id).maybeSingle();
    if (data?.status === "teste" && data.fim_teste) {
      diasTeste = diasAte(data.fim_teste);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 px-4 pt-4">
      <header className="flex items-center gap-3 py-1">
        <LogoOficina nome={empresa.nome_fantasia} url={empresa.logo_app_url} cor={empresa.cor_primaria} />
        <p className="min-w-0 truncate text-xl leading-tight font-extrabold">{empresa.nome_fantasia}</p>
      </header>

      <BotaoGigante href="/vistorias/nova?tipo=ENTRADA" cor="bg-oficina text-oficina-texto" icone={<LogIn aria-hidden />}>
        {textos.vistoria.chegadaBotao}
      </BotaoGigante>
      <BotaoGigante href="/vistorias/nova?tipo=SAIDA" cor="bg-acao text-acao-texto" icone={<LogOut aria-hidden />}>
        {textos.vistoria.entregaBotao}
      </BotaoGigante>

      {gestor && empresa.cadastro_completo_pct < 100 && (
        <Link href="/cadastro?passo=3" className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-atencao-clara px-4 py-3">
          <span className="flex-1">
            <span className="block text-lg font-extrabold text-atencao-texto">Cadastro {empresa.cadastro_completo_pct}% pronto</span>
            <span className="block text-base font-semibold text-atencao-texto">
              {empresa.logo_app_url ? "Complete os dados da oficina" : "Falta a logo da oficina"}
            </span>
          </span>
          <ChevronRight aria-hidden className="size-8 text-atencao-texto" />
        </Link>
      )}

      {diasTeste !== null && (
        <Link href="/mais" className="tocavel flex min-h-toque items-center gap-3 rounded-2xl bg-superficie px-4 py-3">
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
