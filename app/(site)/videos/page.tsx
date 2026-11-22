import type { Metadata } from "next";
import { BotaoCriarConta, JsonLd } from "@/components/site/blocos";
import { GradeVideos } from "@/components/site/videos-uso";
import { metadadosPagina, schemaCaminho } from "@/lib/site";

const caminho = "/videos";

export const metadata: Metadata = metadadosPagina({
  titulo: "Vídeos: como usar a Vistoria Rápida | Vistoria online pelo celular",
  descricao:
    "Vídeos curtos, passo a passo: instalar no iPhone e no Android, fazer a vistoria online do veículo e entregar o carro. Menos de 1 minuto cada.",
  caminho,
});

/** Vídeos de uso (antiga página "Como funciona": /como-funciona redireciona para cá). */
export default function Pagina() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <JsonLd dados={schemaCaminho([{ nome: "Vídeos", caminho }])} />

      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-[2.4rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl">Aprenda em 1 minuto</h1>
        <p className="mt-3 text-xl text-muted-foreground">Vídeos curtos, um passo de cada vez.</p>
      </header>

      <div className="mt-10">
        <GradeVideos />
      </div>

      <section className="mx-auto mt-14 flex max-w-2xl flex-col items-center gap-4 rounded-3xl bg-oficina-clara p-8 text-center">
        <h2 className="text-2xl font-extrabold">Pronto para começar?</h2>
        <p className="text-lg">Crie a conta e faça a primeira vistoria hoje.</p>
        <BotaoCriarConta />
      </section>
    </main>
  );
}
