import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoCriarConta, JsonLd } from "@/components/site/blocos";
import { ARTIGOS, artigoPorSlug, dataArtigo } from "@/lib/conteudo/blog";
import { ENDERECO_SITE, enderecoCompleto, metadadosPagina, schemaCaminho } from "@/lib/site";
import { textos } from "@/lib/textos";

/** Só os artigos da lista existem (endereço desconhecido → página 404). */
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const artigo = artigoPorSlug((await params).slug);
  if (!artigo) return {};
  const base = metadadosPagina({ titulo: artigo.titulo, descricao: artigo.descricao, caminho: `/blog/${artigo.slug}` });
  return {
    ...base,
    openGraph: { ...base.openGraph, type: "article", publishedTime: artigo.publicadoEm, modifiedTime: artigo.atualizadoEm },
  };
}

export default async function PaginaArtigo({ params }: PageProps<"/blog/[slug]">) {
  const artigo = artigoPorSlug((await params).slug);
  if (!artigo) notFound();
  const caminho = `/blog/${artigo.slug}`;
  const { Conteudo } = artigo;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <JsonLd
        dados={schemaCaminho([
          { nome: "Blog", caminho: "/blog" },
          { nome: artigo.titulo, caminho },
        ])}
      />
      <JsonLd
        dados={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: artigo.titulo,
          description: artigo.descricao,
          datePublished: artigo.publicadoEm,
          dateModified: artigo.atualizadoEm,
          inLanguage: "pt-BR",
          mainEntityOfPage: enderecoCompleto(caminho),
          image: `${ENDERECO_SITE}/og.jpg`,
          author: { "@type": "Organization", name: textos.produto.nome, url: ENDERECO_SITE },
          publisher: { "@type": "Organization", name: textos.produto.nome, logo: { "@type": "ImageObject", url: `${ENDERECO_SITE}/app-512.png` } },
        }}
      />

      <nav aria-label="Você está em" className="text-base text-muted-foreground">
        <Link href="/" className="font-bold hover:text-foreground">
          Início
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="font-bold hover:text-foreground">
          Blog
        </Link>
      </nav>

      <article>
        <h1 className="mt-4 text-[2.1rem] leading-[1.1] font-extrabold tracking-tight sm:text-5xl">{artigo.titulo}</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Publicado em <time dateTime={artigo.publicadoEm}>{dataArtigo(artigo.publicadoEm)}</time> · {textos.produto.nome}
        </p>
        <div className="texto-site mt-2">
          <Conteudo />
        </div>
      </article>

      <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-oficina-clara p-6">
        <h2 className="text-2xl font-extrabold">Faça o checklist no celular, com fotos e assinatura.</h2>
        <p className="text-lg">A vistoria leva cerca de 3 minutos e o termo em PDF vai direto para o WhatsApp do cliente.</p>
        <BotaoCriarConta />
        <Link href="/" className="inline-flex min-h-11 items-center text-lg font-bold text-oficina">
          Voltar para a página inicial
        </Link>
      </section>
    </main>
  );
}
