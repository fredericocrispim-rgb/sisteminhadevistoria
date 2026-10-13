import type { Metadata } from "next";
import { LogIn, XCircle } from "lucide-react";
import { BotaoPrincipal, EstadoVazio, LogoOficina } from "@/components/vf";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterContexto } from "@/lib/sessao";
import { textos } from "@/lib/textos";
import { BotaoAceitar } from "./botao-aceitar";

export const metadata: Metadata = { title: "Convite", robots: { index: false } };

const t = textos.convite;

export default async function PaginaConvite({ params }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const admin = criarClienteAdmin();
  const { data: convite } = /^[a-f0-9]{36}$/.test(token)
    ? await admin
        .from("convites")
        .select("nome, papel, cancelado, aceito_em, expira_em, empresas (nome_fantasia, logo_app_url)")
        .eq("token", token)
        .maybeSingle()
    : { data: null };

  const empresa = convite?.empresas as unknown as { nome_fantasia: string; logo_app_url: string | null } | null;
  const valido = convite && empresa && !convite.cancelado && !convite.aceito_em && new Date(convite.expira_em) > new Date();

  if (!valido) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4">
        <EstadoVazio icone={<XCircle aria-hidden />} titulo={t.invalido} texto={t.invalidoTexto} />
      </main>
    );
  }

  const ctx = await obterContexto();
  const papel = convite.papel === "gerente" ? "gerente" : "vistoriador";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <LogoOficina nome={empresa.nome_fantasia} url={empresa.logo_app_url} tamanho="lg" />
      <h1 className="text-[2rem] leading-tight font-extrabold">
        {t.titulo}, {convite.nome.split(" ")[0]}!
      </h1>
      <p className="text-xl text-muted-foreground">{t.texto(empresa.nome_fantasia, papel)}</p>
      {ctx ? (
        <BotaoAceitar token={token} />
      ) : (
        <BotaoPrincipal fixo href={`/entrar?criar=1&voltar=/convite/${token}`} icone={<LogIn aria-hidden />}>
          {t.aceitar}
        </BotaoPrincipal>
      )}
    </main>
  );
}
