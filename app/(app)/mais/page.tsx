import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChevronRight,
  Gift,
  ImageIcon,
  Users,
  KeyRound,
  LogOut,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import {
  BotaoModoSol,
  IconeChip,
  InstalarApp,
  type TomIcone,
} from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { INDICACAO_ATIVA } from "@/lib/indicacao";
import { textos } from "@/lib/textos";
import { sair } from "./acoes";

export const metadata: Metadata = { title: "Mais" };

export default async function Mais() {
  const { usuario, empresa, papel, superadmin } = await exigirOficina();
  const gestor = papel === "dono" || papel === "gerente";
  const nomePapel = {
    dono: "Dono",
    gerente: "Gerente",
    vistoriador: "Vistoriador",
  }[papel];

  const nome = usuario.nome ?? usuario.email ?? "";
  const iniciais =
    nome
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <main className="entrar-tela mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pt-6">
      <h1 className="text-[1.75rem] font-extrabold">{textos.menu.mais}</h1>

      {/* Quem está usando: bolinha com as iniciais */}
      <div className="cartao flex items-center gap-3 rounded-3xl p-3">
        <span
          aria-hidden
          className="brilho grid size-14 shrink-0 place-items-center rounded-2xl bg-oficina text-xl font-extrabold text-oficina-texto shadow-[0_10px_20px_-10px_rgb(37_99_235/0.8)]"
        >
          {iniciais}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{nome}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-base text-muted-foreground">
            <span className="rounded-full bg-oficina-clara px-2 py-0.5 text-sm font-bold text-oficina">
              {nomePapel}
            </span>
            <span className="truncate">{empresa.nome_fantasia}</span>
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {usuario.email}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {gestor && (
          <>
            <Item href="/equipe" tom="oficina" icone={<Users />}>
              {textos.menu.equipe}
            </Item>
            {papel === "dono" && (
              <Item href="/plano" tom="acao" icone={<QrCode />}>
                {textos.menu.meuPlano}
              </Item>
            )}
            <Item href="/cadastro?passo=2" tom="oficina" icone={<ImageIcon />}>
              Logo da empresa
            </Item>
            {INDICACAO_ATIVA && (
              <Item href="/indicar" tom="atencao" icone={<Gift />}>
                {textos.indicar.menu}
              </Item>
            )}
          </>
        )}
        {superadmin && (
          <Item href="/admin" tom="neutro" icone={<ShieldCheck />}>
            Painel do administrador
          </Item>
        )}
        <Item href="/nova-senha" tom="neutro" icone={<KeyRound />}>
          Trocar minha senha
        </Item>
      </ul>

      <InstalarApp podeFechar={false} />

      <BotaoModoSol />

      <form action={sair} className="mt-4">
        <button
          type="submit"
          className="tocavel flex min-h-toque w-full items-center justify-center gap-2 rounded-2xl bg-perigo-clara px-4 text-lg font-bold text-perigo [&_svg]:size-6"
        >
          <LogOut aria-hidden strokeWidth={2.4} /> {textos.entrar.sair}
        </button>
      </form>
    </main>
  );
}

function Item({
  href,
  icone,
  tom,
  children,
}: {
  href: string;
  icone: ReactNode;
  tom: TomIcone;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="tocavel cartao flex min-h-toque-grande items-center gap-3 rounded-2xl px-3 py-2"
      >
        <IconeChip tom={tom}>{icone}</IconeChip>
        <span className="flex-1 text-lg font-bold">{children}</span>
        <ChevronRight aria-hidden className="size-6 text-muted-foreground" />
      </Link>
    </li>
  );
}
