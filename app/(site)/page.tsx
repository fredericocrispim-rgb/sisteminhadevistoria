import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Car, Check, Droplets, FileText, PenLine, PlayCircle, ShieldCheck, Store, Truck, Wrench } from "lucide-react";
import { BotaoCriarConta, JsonLd, Perguntas, schemaPerguntas } from "@/components/site/blocos";
import { CartoesPlanos, Celular } from "@/components/site/vitrine-site";
import { obterContexto } from "@/lib/sessao";
import { contatoSuporte, ENDERECO_SITE, metadadosPagina } from "@/lib/site";
import { PERGUNTAS_INICIO } from "@/lib/conteudo/perguntas";
import { planosDoSite } from "@/lib/planos-site";
import { INSTAGRAM, SEGMENTOS_SITE } from "@/lib/site-paginas";
import { textos } from "@/lib/textos";

export const metadata: Metadata = metadadosPagina({
  titulo: "Vistoria Rápida | Vistoria online de veículos pelo celular",
  descricao:
    "Vistoria digital de veículos pelo celular em 3 minutos: fotos, riscos, assinatura do cliente e PDF no WhatsApp. Para oficina, lava jato, loja de carros e frota.",
  caminho: "/",
});

const PASSOS = [
  { tela: "fotos", titulo: "Tire as fotos", texto: "O app mostra o ângulo certo." },
  { tela: "riscos", titulo: "Marque os riscos", texto: "Toque no desenho do carro." },
  { tela: "pneus", titulo: "Confira os pneus", texto: "Um toque em cada um." },
  { tela: "concluida", titulo: "Mande no WhatsApp", texto: "O cliente assina e recebe o PDF." },
] as const;

const ICONES_SEGMENTO = [Wrench, Store, Droplets, Truck];

/** Página inicial (quem já está logado vai direto para o início do app). */
export default async function Inicio() {
  if (await obterContexto()) redirect("/inicio");
  const [contato, { basico, pro }] = await Promise.all([contatoSuporte(), planosDoSite()]);

  const descricao =
    "Vistoria online de veículos pelo celular: fotos guiadas, riscos marcados no desenho, assinatura do cliente e termo em PDF no WhatsApp. Para oficinas, lava jatos, lojas de carros e frotas.";
  const organizacao = {
    "@type": "Organization",
    "@id": `${ENDERECO_SITE}/#organizacao`,
    name: textos.produto.nome,
    alternateName: ["Vistoria Rápida Digital", "Vistoria Rapida"],
    url: ENDERECO_SITE,
    logo: `${ENDERECO_SITE}/app-512.png`,
    description: descricao,
    areaServed: { "@type": "Country", name: "Brasil" },
    ...(contato && {
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", telephone: contato.telefoneSchema, availableLanguage: "Portuguese", areaServed: "BR" },
    }),
    sameAs: [INSTAGRAM.link],
  };
  const app = {
    "@type": "SoftwareApplication",
    name: textos.produto.nome,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, iOS, navegador",
    description: descricao,
    url: ENDERECO_SITE,
    publisher: { "@id": `${ENDERECO_SITE}/#organizacao` },
    offers: [basico, pro].map((p) => ({ "@type": "Offer", name: `Plano ${p.nome}`, price: p.preco.toFixed(2), priceCurrency: "BRL", url: `${ENDERECO_SITE}/precos` })),
  };

  return (
    <>
      <JsonLd dados={{ "@context": "https://schema.org", "@graph": [organizacao, app] }} />
      <JsonLd dados={schemaPerguntas(PERGUNTAS_INICIO)} />

      <main className="flex-1 overflow-x-clip">
        {/* Abertura: frase curta, botão e o app de verdade */}
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-[1.05fr_1fr] lg:py-14">
          <section className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm font-bold text-acao ring-1 ring-border">
              <span className="size-2 rounded-full bg-marca-verde" /> Feito para quem não tem tempo a perder
            </span>
            <h1 className="text-[2.5rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Vistoria do carro <span className="text-marca-azul">pelo celular</span> em 3 minutos
            </h1>
            <p className="max-w-xl text-xl text-muted-foreground">
              Fotos, riscos e a assinatura do cliente. O PDF vai direto para o WhatsApp. Se o cliente reclamar depois, você tem a prova.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BotaoCriarConta />
              <Link
                href="/videos"
                className="tocavel inline-flex min-h-toque-grande items-center justify-center gap-2 rounded-2xl bg-background px-7 text-xl font-bold no-underline ring-1 ring-border hover:bg-superficie"
              >
                <PlayCircle aria-hidden className="size-6" /> Ver o vídeo
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-base font-bold text-muted-foreground">
              {["Não precisa baixar nada", "Android e iPhone", `A partir de R$ ${basico.preco.toFixed(2).replace(".", ",")}/mês`].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> {t}
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Telas do app Vistoria Rápida" className="relative mx-auto h-[470px] w-full max-w-[420px] sm:h-[560px]">
            <Celular tela="inicio" prioridade className="absolute top-0 left-0 w-[58%] -rotate-[5deg]" />
            <Celular tela="concluida" prioridade className="absolute top-10 right-0 w-[58%] rotate-[4deg]" />
            <div className="absolute bottom-10 left-[-4px] flex items-center gap-2 rounded-2xl bg-background px-4 py-3 shadow-xl ring-1 ring-border sm:bottom-16">
              <PenLine aria-hidden className="size-6 text-oficina" />
              <span className="text-sm font-bold">Assinado pelo cliente</span>
            </div>
            <div className="absolute right-2 bottom-0 flex items-center gap-2 rounded-2xl bg-[#1f8f4e] px-4 py-3 text-white shadow-xl sm:bottom-4">
              <FileText aria-hidden className="size-6" />
              <span className="text-sm font-bold">PDF enviado no WhatsApp</span>
            </div>
          </section>
        </div>

        {/* O problema que o produto resolve */}
        <section className="bg-[#0f172a] text-white">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="text-3xl leading-tight font-extrabold sm:text-4xl">&quot;Esse risco não estava aqui.&quot;</p>
              <p className="mt-3 text-xl text-white/80">
                Toda oficina já ouviu isso. Sem foto e sem assinatura, é palavra contra palavra, e quem paga o conserto é você.
              </p>
            </div>
            <ul className="flex flex-col gap-3 text-lg">
              {["Foto com data e hora de cada lado do carro", "Riscos marcados antes do serviço", "Cliente assina na hora, com o dedo"].map((t) => (
                <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-marca-verde" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Como funciona: as telas de verdade, passo a passo */}
        <section aria-labelledby="como" className="mx-auto w-full max-w-6xl px-5 py-14">
          <h2 id="como" className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simples assim
          </h2>
          <p className="mt-2 text-center text-xl text-muted-foreground">4 telas. Qualquer pessoa da equipe consegue.</p>
          <ol className="-mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {PASSOS.map((p, i) => (
              <li key={p.tela} className="flex w-[70%] shrink-0 snap-center flex-col items-center gap-4 sm:w-[44%] lg:w-auto">
                <Celular tela={p.tela} className="w-full max-w-[250px]" />
                <div className="text-center">
                  <p className="flex items-center justify-center gap-2 text-xl font-extrabold">
                    <span className="grid size-8 place-items-center rounded-full bg-oficina text-base text-oficina-texto">{i + 1}</span>
                    {p.titulo}
                  </p>
                  <p className="text-lg text-muted-foreground">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-center">
            <Link href="/videos" className="inline-flex min-h-11 items-center gap-2 text-lg font-bold text-oficina">
              <PlayCircle aria-hidden className="size-5" /> Ver os vídeos de como usar
            </Link>
          </p>
        </section>

        {/* Para quem é */}
        <section aria-labelledby="para-quem" className="bg-superficie">
          <div className="mx-auto w-full max-w-6xl px-5 py-14">
            <h2 id="para-quem" className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Para quem recebe carro de cliente
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SEGMENTOS_SITE.map((s, i) => {
                const Icone = ICONES_SEGMENTO[i] ?? Car;
                return (
                  <li key={s.caminho}>
                    <Link
                      href={s.caminho}
                      className="tocavel flex h-full items-center gap-4 rounded-3xl bg-background p-5 text-xl font-extrabold no-underline shadow-sm ring-1 ring-border hover:ring-oficina"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-oficina-clara text-oficina">
                        <Icone aria-hidden className="size-6" />
                      </span>
                      {s.nome.replace("Sistema para ", "")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Preços */}
        <section aria-labelledby="planos" className="mx-auto w-full max-w-4xl px-5 py-14">
          <h2 id="planos" className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Quanto custa
          </h2>
          <p className="mt-2 mb-8 text-center text-xl text-muted-foreground">Sem fidelidade. Pix, cartão ou boleto.</p>
          <CartoesPlanos basico={basico} pro={pro} />
        </section>

        <div className="texto-site mx-auto w-full max-w-3xl px-5">
          <h2>Vistoria online, rápida e digital</h2>
          <p>
            A Vistoria Rápida é uma vistoria de veículos digital feita no celular. Você registra como o carro chegou, o cliente assina e recebe tudo no
            WhatsApp. É o jeito mais simples de evitar prejuízo na oficina com riscos e amassados que não foram você que fez.
          </p>
          <p>
            Serve como <Link href="/sistema-para-oficina">sistema para oficina</Link>, <Link href="/sistema-para-loja-de-carros">sistema para loja de carros</Link>,{" "}
            <Link href="/sistema-para-lava-jato">sistema para lava jato</Link> e <Link href="/sistema-para-frotista">sistema para frotista</Link>. Veja também o{" "}
            <Link href="/checklist-de-entrada-de-veiculo">checklist de entrada de veículo</Link> e o que vem no{" "}
            <Link href="/laudo-de-vistoria-digital">laudo de vistoria digital</Link>.
          </p>

          <h2>Perguntas frequentes</h2>
          <Perguntas itens={PERGUNTAS_INICIO} />

          <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-oficina-clara p-6">
            <h2 className="mt-0">Faça a primeira vistoria hoje</h2>
            <p className="mt-0">Crie a conta, coloque a sua logo e comece. Leva poucos minutos.</p>
            <BotaoCriarConta />
          </section>
        </div>
      </main>
    </>
  );
}
