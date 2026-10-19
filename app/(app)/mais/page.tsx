import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Gift, ImageIcon, KeyRound, LogOut, QrCode, ShieldCheck } from "lucide-react";
import { BotaoModoSol, InstalarApp } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { textos } from "@/lib/textos";
import { sair } from "./acoes";

export const metadata: Metadata = { title: "Mais" };

export default async function Mais() {
  const { usuario, empresa, papel, superadmin } = await exigirOficina();
  const gestor = papel === "dono" || papel === "gerente";
  const nomePapel = { dono: "Dono", gerente: "Gerente", vistoriador: "Vistoriador" }[papel];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pt-6">
      <h1 className="text-[1.75rem] font-extrabold">{textos.menu.mais}</h1>

      <div className="rounded-2xl bg-superficie px-4 py-3">
        <p className="text-lg font-extrabold">{usuario.nome ?? usuario.email}</p>
        <p className="text-base text-muted-foreground">
          {nomePapel} · {empresa.nome_fantasia}
        </p>
        <p className="text-base break-all text-muted-foreground">{usuario.email}</p>
      </div>

      {gestor && (
        <>
          <Item href="/plano" icone={<QrCode aria-hidden />}>
            {textos.menu.meuPlano}
          </Item>
          <Item href="/cadastro?passo=2" icone={<ImageIcon aria-hidden />}>
            Logo da empresa
          </Item>
          <Item href="/indicar" icone={<Gift aria-hidden />}>
            {textos.indicar.menu}
          </Item>
        </>
      )}
      {superadmin && (
        <Item href="/admin" icone={<ShieldCheck aria-hidden />}>
          Painel do administrador
        </Item>
      )}

      <Item href="/nova-senha" icone={<KeyRound aria-hidden />}>
        Trocar minha senha
      </Item>

      <InstalarApp podeFechar={false} />

      <BotaoModoSol />

      <form action={sair} className="mt-4">
        <button
          type="submit"
          className="tocavel flex min-h-toque w-full items-center justify-center gap-2 rounded-2xl px-4 text-lg font-bold text-perigo [&_svg]:size-6"
        >
          <LogOut aria-hidden /> {textos.entrar.sair}
        </button>
      </form>
    </main>
  );
}

function Item({ href, icone, children }: { href: string; icone: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-superficie px-4 [&_svg]:size-7">
      {icone}
      <span className="flex-1 text-lg font-bold">{children}</span>
      <ChevronRight aria-hidden className="text-muted-foreground" />
    </Link>
  );
}
