import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/site/blocos";
import { ARTIGOS, dataArtigo } from "@/lib/conteudo/blog";
import { metadadosPagina, schemaCaminho } from "@/lib/site";

export const metadata: Metadata = metadadosPagina({
  titulo: "Blog da Vistoria Rápida | Dicas de vistoria para oficinas",
  descricao: "Dicas práticas de vistoria de veículos para oficinas: checklist de entrada, fotos, termo assinado e rotina do pátio. Leia e aplique hoje.",
  caminho: "/blog",
});

export default function Blog() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <JsonLd dados={schemaCaminho([{ nome: "Blog", caminho: "/blog" }])} />
      <nav aria-label="Você está em" className="text-base text-muted-foreground">
        <Link href="/" className="font-bold hover:text-foreground">
          Início
        </Link>{" "}
        / Blog
      </nav>
      <h1 className="mt-4 text-[2.3rem] leading-[1.08] font-extrabold tracking-tight sm:text-5xl">Blog da Vistoria Rápida</h1>
      <p className="mt-4 text-xl text-muted-foreground">Dicas práticas para fazer vistoria de entrada e saída na oficina, sem papel e sem discussão no balcão.</p>

      <ul className="mt-8 flex flex-col gap-4">
        {ARTIGOS.map((a) => (
          <li key={a.slug}>
            <Link href={`/blog/${a.slug}`} className="tocavel flex items-center gap-4 rounded-3xl bg-superficie p-5 hover:bg-oficina-clara">
              <span className="flex-1">
                <span className="block text-sm font-bold text-muted-foreground">
                  <time dateTime={a.publicadoEm}>{dataArtigo(a.publicadoEm)}</time>
                </span>
                <span className="mt-1 block text-xl leading-tight font-extrabold">{a.titulo}</span>
                <span className="mt-2 block text-base text-muted-foreground">{a.resumo}</span>
              </span>
              <ChevronRight aria-hidden className="size-7 shrink-0 text-oficina" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
