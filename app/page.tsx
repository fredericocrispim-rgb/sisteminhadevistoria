import { redirect } from "next/navigation";
import { Camera, LogIn, PenLine, Send } from "lucide-react";
import { BotaoPrincipal, LogoProduto } from "@/components/vf";
import { obterContexto } from "@/lib/sessao";
import { textos } from "@/lib/textos";

/** Página de entrada. Quem já está logado vai direto para o início do app. */
export default async function Inicio() {
  if (await obterContexto()) redirect("/inicio");

  const passos = [
    { icone: <Camera aria-hidden />, texto: "Fotos guiadas do carro" },
    { icone: <PenLine aria-hidden />, texto: "Cliente assina no celular" },
    { icone: <Send aria-hidden />, texto: "Envia no WhatsApp com PDF" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 pt-10">
      <LogoProduto comNome className="size-14" />
      <h1 className="text-[2.25rem] leading-tight font-extrabold">Chega de ficha de papel.</h1>
      <p className="text-xl text-muted-foreground">{textos.produto.slogan}</p>
      <ul className="flex flex-col gap-3">
        {passos.map((p) => (
          <li key={p.texto} className="flex items-center gap-4 rounded-2xl bg-superficie px-4 py-4 text-lg font-bold [&_svg]:size-8 [&_svg]:text-oficina">
            {p.icone}
            {p.texto}
          </li>
        ))}
      </ul>
      <BotaoPrincipal fixo href="/entrar" icone={<LogIn aria-hidden />}>
        Entrar ou criar conta grátis
      </BotaoPrincipal>
    </main>
  );
}
