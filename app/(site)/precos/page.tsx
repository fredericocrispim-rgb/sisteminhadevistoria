import type { Metadata } from "next";
import Link from "next/link";
import { Barcode, CreditCard, QrCode } from "lucide-react";
import { JsonLd, Perguntas, schemaPerguntas } from "@/components/site/blocos";
import { CartoesPlanos } from "@/components/site/vitrine-site";
import { PERGUNTAS_PRECOS } from "@/lib/conteudo/perguntas";
import { centavos, planosDoSite } from "@/lib/planos-site";
import { contatoSuporte, ENDERECO_SITE, metadadosPagina, schemaCaminho } from "@/lib/site";

const caminho = "/precos";

export async function generateMetadata(): Promise<Metadata> {
  const { basico } = await planosDoSite();
  return metadadosPagina({
    titulo: `Preços da Vistoria Rápida | A partir de R$ ${centavos(basico.preco)} por mês`,
    descricao: `Dois planos simples: Básico e Pro (com vídeo). A partir de R$ ${centavos(basico.preco)} por mês, sem fidelidade. Pague por Pix, cartão ou boleto.`,
    caminho,
  });
}

const FORMAS = [
  { icone: QrCode, nome: "Pix", texto: "Na hora, pelo app do banco" },
  { icone: CreditCard, nome: "Cartão", texto: "Paga sozinho todo mês" },
  { icone: Barcode, nome: "Boleto", texto: "Chega um novo todo mês" },
];

export default async function Pagina() {
  const [{ basico, pro }, contato] = await Promise.all([planosDoSite(), contatoSuporte()]);
  const produto = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Vistoria Rápida",
    description: "Sistema de vistoria de veículos digital pelo celular.",
    brand: { "@type": "Brand", name: "Vistoria Rápida" },
    offers: [basico, pro].map((p) => ({
      "@type": "Offer",
      name: `Plano ${p.nome}`,
      price: p.preco.toFixed(2),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${ENDERECO_SITE}${caminho}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      <JsonLd dados={schemaCaminho([{ nome: "Preços", caminho }])} />
      <JsonLd dados={produto} />
      <JsonLd dados={schemaPerguntas(PERGUNTAS_PRECOS)} />

      <div className="text-center">
        <h1 className="text-[2.3rem] leading-[1.08] font-extrabold tracking-tight sm:text-5xl">Escolha o seu plano</h1>
        <p className="mt-3 text-xl text-muted-foreground">Mensal e sem fidelidade. Sem surpresa na cobrança.</p>
      </div>

      <div className="mt-10">
        <CartoesPlanos basico={basico} pro={pro} />
      </div>

      <section aria-labelledby="pagar" className="mt-14">
        <h2 id="pagar" className="text-center text-2xl font-extrabold sm:text-3xl">
          Pague como preferir
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {FORMAS.map(({ icone: Icone, nome, texto }) => (
            <li key={nome} className="flex items-center gap-4 rounded-3xl bg-superficie p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background text-oficina">
                <Icone aria-hidden className="size-6" />
              </span>
              <span>
                <span className="block text-xl font-extrabold">{nome}</span>
                <span className="block text-base text-muted-foreground">{texto}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-lg text-muted-foreground">Depois de criar a conta, você tem 1 dia para fazer o primeiro pagamento.</p>
      </section>

      <section className="texto-site mx-auto mt-6 max-w-3xl">
        <h2>Perguntas sobre o pagamento</h2>
        <Perguntas itens={PERGUNTAS_PRECOS} />
        <p>
          Ficou com dúvida? {contato ? <a href={contato.link}>Chame a gente no WhatsApp</a> : null}
          {contato ? " ou veja " : "Veja "}
          <Link href="/videos">os vídeos de como usar</Link>.
        </p>
      </section>
    </main>
  );
}

/** Preços vêm da tabela planos: confere de novo a cada hora. */
export const revalidate = 3600;
