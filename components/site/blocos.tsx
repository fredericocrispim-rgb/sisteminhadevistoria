import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { schemaCaminho } from "@/lib/site";

/** Dados estruturados para o Google (JSON-LD). */
export function JsonLd({ dados }: { dados: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }} />;
}

/** Botão verde "Criar minha conta". */
export function BotaoCriarConta({ texto = "Criar minha conta" }: { texto?: string }) {
  return (
    <Link
      href="/entrar?criar=1"
      className="tocavel inline-flex min-h-toque-grande items-center justify-center gap-2 rounded-2xl bg-acao px-7 text-xl font-bold text-acao-texto no-underline shadow-lg shadow-acao/25 hover:bg-acao-escura"
    >
      {texto} <ArrowRight aria-hidden className="size-6" />
    </Link>
  );
}

/** Perguntas frequentes em "sanfona" (abre ao tocar, acessível e sem JavaScript). */
export function Perguntas({ itens }: { itens: { pergunta: string; resposta: string }[] }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {itens.map((p) => (
        <details key={p.pergunta} className="group rounded-2xl bg-superficie px-5">
          <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-3 py-3 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
            <h3 className="m-0 text-lg font-extrabold">{p.pergunta}</h3>
            <ChevronDown aria-hidden className="size-6 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-0 pb-4 text-muted-foreground">{p.resposta}</p>
        </details>
      ))}
    </div>
  );
}

/** Dados estruturados de perguntas frequentes (só as respondidas). */
export function schemaPerguntas(itens: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((p) => ({ "@type": "Question", name: p.pergunta, acceptedAnswer: { "@type": "Answer", text: p.resposta } })),
  };
}

/**
 * Molde das páginas de conteúdo: caminho (breadcrumb), um único H1, texto, chamada final e volta para o início.
 */
export function PaginaConteudo({
  caminho,
  titulo,
  resumo,
  children,
  chamada = "Faça a próxima vistoria da sua oficina pelo celular.",
}: {
  caminho: { nome: string; caminho: string }[];
  titulo: string;
  resumo: string;
  children: React.ReactNode;
  chamada?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <JsonLd dados={schemaCaminho(caminho)} />
      <nav aria-label="Você está em" className="text-base text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="font-bold hover:text-foreground">
              Início
            </Link>
          </li>
          {caminho.map((c) => (
            <li key={c.caminho} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <span aria-current={c === caminho[caminho.length - 1] ? "page" : undefined}>{c.nome}</span>
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="mt-4 text-[2.3rem] leading-[1.08] font-extrabold tracking-tight sm:text-5xl">{titulo}</h1>
      <p className="mt-4 text-xl text-muted-foreground">{resumo}</p>

      <article className="texto-site">{children}</article>

      <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-oficina-clara p-6">
        <h2 className="text-2xl font-extrabold">{chamada}</h2>
        <p className="text-lg">Fotos guiadas, riscos no desenho, assinatura do cliente e PDF no WhatsApp em cerca de 3 minutos.</p>
        <BotaoCriarConta />
        <Link href="/" className="inline-flex min-h-11 items-center text-lg font-bold text-oficina">
          Voltar para a página inicial
        </Link>
      </section>
    </main>
  );
}
