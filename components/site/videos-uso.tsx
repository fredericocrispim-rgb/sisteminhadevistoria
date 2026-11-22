import { Apple, Smartphone } from "lucide-react";
import { enderecoCompleto } from "@/lib/site";
import { cn } from "@/lib/utils";
import { JsonLd } from "./blocos";

/**
 * Sequência de vídeos de uso (página /videos). Cada aula pode ter uma versão por celular.
 * Para incluir um vídeo novo: coloque o .mp4 (vertical, 720 x 1560) e a capa .jpg em public/videos
 * e acrescente a aula ou a opção abaixo. Opção sem vídeo mostra só os passos escritos.
 */
type Opcao = {
  /** Vazio quando o vídeo serve para qualquer celular. */
  celular?: "iPhone" | "Android";
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
        video: { arquivo: "/videos/instalar-android.mp4", capa: "/videos/instalar-android.jpg", duracao: "PT26S", publicado: "2026-11-22" },
        passos: [
          "Abra vistoriarapida.digital no Chrome",
          "Toque no botão verde Instalar, no alto da página",
          "Na janela que abrir, toque em Instalar",
          "Pronto: o ícone aparece na tela inicial",
        ],
      },
    ],
  },
  {
    titulo: "Como fazer a vistoria",
    resumo: "Do CHEGOU CARRO até o cliente receber no WhatsApp, em cerca de 3 minutos.",
    opcoes: [
      {
        video: { arquivo: "/videos/fazer-vistoria.mp4", capa: "/videos/fazer-vistoria.jpg", duracao: "PT38S", publicado: "2026-11-22" },
        passos: [
          "Toque em CHEGOU CARRO",
          "Digite a placa, o carro e o cliente",
          "Tire as 6 fotos que o app mostra",
          "Marque os riscos no desenho do carro",
          "Confira os pneus",
          "O cliente assina com o dedo",
          "Toque em Enviar para o cliente",
        ],
      },
    ],
  },
  {
    titulo: "Como entregar o carro",
    resumo: "A vistoria de saída, quando o cliente vem buscar o carro.",
    opcoes: [
      {
        video: { arquivo: "/videos/entregar-carro.mp4", capa: "/videos/entregar-carro.jpg", duracao: "PT42S", publicado: "2026-11-22" },
        passos: [
          "Toque em ENTREGAR CARRO",
          "Escolha o carro na lista do pátio",
          "Confira os dados, que já vêm prontos",
          "Tire as fotos de novo",
          "Confira os riscos e os pneus",
          "O cliente assina com o dedo",
          "Toque em Enviar para o cliente",
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
        name: o.celular ? `${a.titulo} (${o.celular})` : a.titulo,
        description: `${a.resumo} Passo a passo${o.celular ? ` no ${o.celular}` : ""}.`,
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
      <p>Vídeos curtos, passo a passo.</p>
      {AULAS.map((aula, i) => (
        <div key={aula.titulo}>
          <h3>
            {i + 1}. {aula.titulo}
          </h3>
          <p>{aula.resumo}</p>
          <div className={cn("mt-4 grid grid-cols-1 gap-4", aula.opcoes.length > 1 && "sm:grid-cols-2")}>
            {aula.opcoes.map((o) => (
              <figure
                key={o.celular ?? aula.titulo}
                className={cn("flex flex-col gap-3 rounded-3xl bg-superficie p-4", !o.celular && "sm:flex-row sm:items-start sm:gap-6")}
              >
                {o.celular && (
                  <figcaption className="flex items-center gap-2 text-xl font-extrabold">
                    {o.celular === "iPhone" ? <Apple aria-hidden className="size-6" /> : <Smartphone aria-hidden className="size-6" />}
                    No {o.celular}
                  </figcaption>
                )}
                {o.video ? (
                  <video
                    controls
                    playsInline
                    preload="none"
                    poster={o.video.capa}
                    className="mx-auto aspect-[6/13] w-full max-w-[300px] shrink-0 rounded-2xl bg-black"
                    aria-label={`Vídeo: ${aula.titulo}${o.celular ? ` no ${o.celular}` : ""}`}
                  >
                    <source src={o.video.arquivo} type="video/mp4" />
                  </video>
                ) : null}
                <ol className={cn("!mt-0 text-base", !o.celular && "sm:text-lg")}>
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
