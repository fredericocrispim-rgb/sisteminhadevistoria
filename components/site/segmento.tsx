import type { Metadata } from "next";
import Link from "next/link";
import { Check, PlayCircle, X } from "lucide-react";
import { JsonLd, PaginaConteudo, Perguntas, schemaPerguntas } from "./blocos";
import { Celular, FaixaPreco } from "./vitrine-site";
import { planosDoSite } from "@/lib/planos-site";
import { metadadosPagina } from "@/lib/site";
import type { Pergunta } from "@/lib/conteudo/perguntas";

/**
 * Molde das páginas por tipo de negócio (/sistema-para-oficina, /sistema-para-lava-jato...).
 * Texto curto e direto: o problema, como o app resolve, as telas e o preço.
 */
export type Segmento = {
  caminho: string;
  nome: string;
  titulo: string;
  descricao: string;
  h1: string;
  resumo: string;
  /** "Antes": os problemas do dia a dia. */
  problemas: string[];
  /** "Com a Vistoria Rápida". */
  solucoes: string[];
  /** Um parágrafo simples com as palavras que as pessoas procuram no Google. */
  texto: React.ReactNode;
  perguntas: Pergunta[];
};

export function metadadosSegmento(s: Segmento): Metadata {
  return metadadosPagina({ titulo: s.titulo, descricao: s.descricao, caminho: s.caminho });
}

export async function PaginaSegmento({ s }: { s: Segmento }) {
  const { basico } = await planosDoSite();
  return (
    <PaginaConteudo caminho={[{ nome: s.nome, caminho: s.caminho }]} titulo={s.h1} resumo={s.resumo}>
      <JsonLd dados={schemaPerguntas(s.perguntas)} />

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-superficie p-5">
          <p className="m-0 text-xl font-extrabold">Sem vistoria</p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {s.problemas.map((t) => (
              <li key={t} className="flex items-start gap-2 text-lg">
                <X aria-hidden className="mt-1 size-5 shrink-0 text-perigo" strokeWidth={3} /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-oficina-clara p-5">
          <p className="m-0 text-xl font-extrabold">Com a Vistoria Rápida</p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {s.solucoes.map((t) => (
              <li key={t} className="flex items-start gap-2 text-lg">
                <Check aria-hidden className="mt-1 size-5 shrink-0 text-acao" strokeWidth={3} /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h2>Como funciona</h2>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
        <Celular tela="fotos" />
        <Celular tela="riscos" />
        <Celular tela="concluida" />
      </div>
      <p>Tire as fotos, marque os riscos, o cliente assina e recebe o PDF no WhatsApp. Leva cerca de 3 minutos.</p>
      <p>
        <Link href="/videos" className="inline-flex items-center gap-2 font-bold">
          <PlayCircle aria-hidden className="size-5" /> Ver os vídeos de como usar
        </Link>
      </p>

      {s.texto}

      <h2>Quanto custa</h2>
      <FaixaPreco basico={basico} />

      <h2>Perguntas frequentes</h2>
      <Perguntas itens={s.perguntas} />
    </PaginaConteudo>
  );
}
