import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Camera, Check, FileText, MessageCircle, PenLine, ShieldCheck } from "lucide-react";
import { LogoProduto, SilhuetaCarro } from "@/components/vf";
import { FOTOS_OBRIGATORIAS } from "@/lib/vistoria";
import { obterContexto } from "@/lib/sessao";
import { textos } from "@/lib/textos";

/** Página de entrada (quem já está logado vai direto para o início do app). */
export default async function Inicio() {
  if (await obterContexto()) redirect("/inicio");

  const vantagens = [
    { icone: <Camera aria-hidden />, titulo: "Fotos guiadas", texto: "O app mostra o ângulo certo" },
    { icone: <PenLine aria-hidden />, titulo: "Assinatura no dedo", texto: "O cliente assina na hora" },
    { icone: <MessageCircle aria-hidden />, titulo: "Direto no WhatsApp", texto: "PDF com a sua logo" },
  ];

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Fundo: brilho suave nas cores da marca */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[34rem] opacity-70"
        style={{
          background:
            "radial-gradient(40rem 22rem at 20% 30%, color-mix(in oklch, var(--cor-marca-azul) 18%, transparent), transparent), radial-gradient(30rem 18rem at 85% 20%, color-mix(in oklch, var(--cor-marca-verde) 16%, transparent), transparent)",
        }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5">
        <LogoProduto comNome className="size-11" />
        <Link href="/entrar" className="tocavel inline-flex min-h-toque items-center rounded-2xl px-2 text-lg font-bold text-oficina">
          Entrar
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        {/* Texto */}
        <section className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm font-bold text-acao ring-1 ring-border">
            <span className="size-2 rounded-full bg-marca-verde" /> Pagamento por Pix · sem cartão
          </span>
          <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            Chega de <span className="text-marca-azul">ficha de papel</span>.
          </h1>
          <p className="max-w-lg text-xl text-muted-foreground">{textos.produto.slogan}</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/entrar?criar=1"
              className="tocavel inline-flex min-h-toque-grande items-center justify-center gap-2 rounded-2xl bg-acao px-7 text-xl font-bold text-acao-texto shadow-lg shadow-acao/25 hover:bg-acao-escura"
            >
              Criar conta <ArrowRight aria-hidden className="size-6" />
            </Link>
            <Link
              href="/entrar"
              className="tocavel inline-flex min-h-toque-grande items-center justify-center rounded-2xl bg-background px-7 text-xl font-bold ring-1 ring-border hover:bg-superficie"
            >
              Já tenho conta
            </Link>
          </div>

          <ul className="mt-4 grid gap-5 sm:grid-cols-3">
            {vantagens.map((v) => (
              <li key={v.titulo} className="flex items-start gap-3 sm:flex-col">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-oficina-clara text-oficina [&_svg]:size-6">{v.icone}</span>
                <span>
                  <span className="block text-lg font-extrabold">{v.titulo}</span>
                  <span className="block text-base text-muted-foreground">{v.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* "Foto" do produto: uma vistoria pronta */}
        <section aria-label="Exemplo de vistoria pronta" className="relative mx-auto w-full max-w-sm">
          <div className="rotate-[-2deg] rounded-[2rem] bg-background p-5 shadow-2xl ring-1 ring-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">Vistoria de chegada</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-acao-clara px-2.5 py-1 text-xs font-bold text-acao">
                <Check aria-hidden className="size-3.5" strokeWidth={3} /> Concluída
              </span>
            </div>
            <p className="mt-3 font-mono text-4xl font-extrabold tracking-wider">ABC1D23</p>
            <p className="text-base text-muted-foreground">Chevrolet Onix · Prata · 45.320 km</p>

            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {FOTOS_OBRIGATORIAS.map((f, i) => (
                <div
                  key={f.categoria}
                  aria-hidden
                  className="grid aspect-square place-items-center rounded-lg text-marca-azul/70"
                  style={{
                    background: `linear-gradient(160deg, color-mix(in oklch, var(--cor-marca-azul) ${10 + (i % 4) * 5}%, white), color-mix(in oklch, var(--cor-marca-verde) ${8 + (i % 3) * 5}%, white))`,
                  }}
                >
                  <SilhuetaCarro vista={f.vista} className="w-[85%]" />
                </div>
              ))}
            </div>

            <ul className="mt-4 flex flex-col gap-2 text-base">
              <li className="flex items-center gap-2">
                <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> 6 fotos com data e hora
              </li>
              <li className="flex items-center gap-2">
                <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> 2 riscos marcados no desenho
              </li>
              <li className="flex items-center gap-2">
                <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> Assinado pelo cliente
              </li>
            </ul>

            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#1f8f4e] px-4 py-3 text-base font-bold text-white">
              <MessageCircle aria-hidden className="size-5" /> Enviado ao cliente
            </div>
          </div>

          <div className="absolute -right-2 -bottom-5 flex rotate-[3deg] items-center gap-2 rounded-2xl bg-background px-4 py-3 shadow-xl ring-1 ring-border">
            <FileText aria-hidden className="size-6 text-perigo" />
            <span className="text-sm font-bold">termo-vistoria.pdf</span>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-6 text-sm text-muted-foreground">
        <span>© {textos.produto.nome}</span>
        <Link href="/verificar" className="inline-flex min-h-11 items-center gap-1.5 font-bold hover:text-foreground">
          <ShieldCheck aria-hidden className="size-4" /> Conferir uma vistoria
        </Link>
      </footer>
    </div>
  );
}
