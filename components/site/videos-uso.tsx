import { Apple, Smartphone } from "lucide-react";
import { enderecoCompleto } from "@/lib/site";
import { JsonLd } from "./blocos";

/**
 * Sequência de vídeos de uso (página Como funciona). Cada aula pode ter uma versão por celular.
 * Para incluir um vídeo novo: coloque o .mp4 (vertical, 720 x 1560) e a capa .jpg em public/videos
 * e acrescente a aula ou a opção abaixo. Opção sem vídeo mostra só os passos escritos.
 */
type Opcao = {
  celular: "iPhone" | "Android";
  video?: { arquivo: string; capa: string; duracao: string; publicado: string };
  passos: string[];
};
type Aula = { titulo: string; resumo: string; opcoes: Opcao[] };

export const AULAS: Aula[] = [
  {
    titulo: "Como instalar o app no celular",
    resumo: "Coloque o ícone da Vistoria Rápida na tela inicial. Não precisa de loja de aplicativos.",
    opcoes: [
      {
        celular: "iPhone",
        video: { arquivo: "/videos/instalar-iphone.mp4", capa: "/videos/instalar-iphone.jpg", duracao: "PT28S", publicado: "2026-11-22" },
        passos: [
          "Abra vistoriarapida.digital no Safari",
          "Toque nos 3 pontinhos ••• lá embaixo",
          "Toque em Compartilhar",
          "Toque em Adicionar à Tela de Início",
          "Toque em Adicionar, no canto de cima",
        ],
      },
      {
        celular: "Android",
        passos: [
          "Abra vistoriarapida.digital no Chrome",
          "Toque no botão verde Instalar, no alto da página",
          "Na janela que abrir, toque em Instalar",
          "Pronto: o ícone aparece na tela inicial",
        ],
      },
    ],
  },
];

export function VideosDeUso() {
  const videos = AULAS.flatMap((a) =>
    a.opcoes
      .filter((o) => o.video)
      .map((o) => ({
        "@type": "VideoObject",
        name: `${a.titulo} (${o.celular})`,
        description: `${a.resumo} Passo a passo no ${o.celular}.`,
        thumbnailUrl: `${enderecoCompleto(o.video!.capa)}`,
        contentUrl: `${enderecoCompleto(o.video!.arquivo)}`,
        uploadDate: o.video!.publicado,
        duration: o.video!.duracao,
        inLanguage: "pt-BR",
      })),
  );

  return (
    <section aria-labelledby="videos-de-uso">
      {videos.length > 0 && <JsonLd dados={{ "@context": "https://schema.org", "@graph": videos }} />}
      <h2 id="videos-de-uso">Vídeos de uso</h2>
      <p>Vídeos curtos, passo a passo. Escolha o seu celular.</p>
      {AULAS.map((aula, i) => (
        <div key={aula.titulo}>
          <h3>
            {i + 1}. {aula.titulo}
          </h3>
          <p>{aula.resumo}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {aula.opcoes.map((o) => (
              <figure key={o.celular} className="flex flex-col gap-3 rounded-3xl bg-superficie p-4">
                <figcaption className="flex items-center gap-2 text-xl font-extrabold">
                  {o.celular === "iPhone" ? <Apple aria-hidden className="size-6" /> : <Smartphone aria-hidden className="size-6" />}
                  No {o.celular}
                </figcaption>
                {o.video ? (
                  <video
                    controls
                    playsInline
                    preload="none"
                    poster={o.video.capa}
                    className="mx-auto aspect-[6/13] w-full max-w-[300px] rounded-2xl bg-black"
                    aria-label={`Vídeo: ${aula.titulo} no ${o.celular}`}
                  >
                    <source src={o.video.arquivo} type="video/mp4" />
                  </video>
                ) : null}
                <ol className="!mt-0 text-base">
                  {o.passos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
