import { Apple, ClipboardCheck, KeyRound, Smartphone } from "lucide-react";
import { enderecoCompleto } from "@/lib/site";
import { JsonLd } from "./blocos";

/**
 * Vídeos de uso (página /videos), em ordem. Para incluir um novo: coloque o .mp4 (vertical, 720 x 1560)
 * e a capa .jpg em public/videos e acrescente na lista abaixo.
 */
type Video = {
  titulo: string;
  resumo: string;
  icone: "iphone" | "android" | "vistoria" | "entrega";
  arquivo: string;
  capa: string;
  /** Duração no formato do Google (PT28S) e em segundos para mostrar. */
  duracao: string;
  segundos: number;
  publicado: string;
  passos: string[];
};

export const VIDEOS: Video[] = [
  {
    titulo: "Instalar no iPhone",
    resumo: "Coloque o ícone da Vistoria Rápida na tela do iPhone.",
    icone: "iphone",
    arquivo: "/videos/instalar-iphone.mp4",
    capa: "/videos/instalar-iphone.jpg",
    duracao: "PT28S",
    segundos: 28,
    publicado: "2026-11-22",
    passos: [
      "Abra vistoriarapida.digital no Safari",
      "Toque nos 3 pontinhos ••• lá embaixo",
      "Toque em Compartilhar",
      "Toque em Adicionar à Tela de Início",
      "Toque em Adicionar, no canto de cima",
    ],
  },
  {
    titulo: "Instalar no Android",
    resumo: "Coloque o ícone da Vistoria Rápida na tela do Android.",
    icone: "android",
    arquivo: "/videos/instalar-android.mp4",
    capa: "/videos/instalar-android.jpg",
    duracao: "PT26S",
    segundos: 26,
    publicado: "2026-11-22",
    passos: [
      "Abra vistoriarapida.digital no Chrome",
      "Toque no botão verde Instalar, no alto da página",
      "Na janela que abrir, toque em Instalar",
      "Pronto: o ícone aparece na tela inicial",
    ],
  },
  {
    titulo: "Fazer a vistoria",
    resumo: "Do CHEGOU CARRO até o cliente receber no WhatsApp.",
    icone: "vistoria",
    arquivo: "/videos/fazer-vistoria.mp4",
    capa: "/videos/fazer-vistoria.jpg",
    duracao: "PT38S",
    segundos: 37,
    publicado: "2026-11-22",
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
  {
    titulo: "Entregar o carro",
    resumo: "A vistoria de saída, quando o cliente vem buscar.",
    icone: "entrega",
    arquivo: "/videos/entregar-carro.mp4",
    capa: "/videos/entregar-carro.jpg",
    duracao: "PT42S",
    segundos: 41,
    publicado: "2026-11-22",
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
];

const ICONES = { iphone: Apple, android: Smartphone, vistoria: ClipboardCheck, entrega: KeyRound };

/** Grade de vídeos: capa, número, título e duração. Os passos ficam escondidos em "Ver os passos". */
export function GradeVideos() {
  const dados = VIDEOS.map((v) => ({
    "@type": "VideoObject",
    name: `Vistoria Rápida: ${v.titulo}`,
    description: `${v.resumo} Passo a passo: ${v.passos.join("; ")}.`,
    thumbnailUrl: enderecoCompleto(v.capa),
    contentUrl: enderecoCompleto(v.arquivo),
    uploadDate: v.publicado,
    duration: v.duracao,
    inLanguage: "pt-BR",
  }));

  return (
    <>
      <JsonLd dados={{ "@context": "https://schema.org", "@graph": dados }} />
      <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {VIDEOS.map((v, i) => {
          const Icone = ICONES[v.icone];
          return (
            <li key={v.arquivo} className="flex flex-col gap-3">
              <video
                controls
                playsInline
                preload="none"
                poster={v.capa}
                className="mx-auto aspect-[6/13] w-full max-w-[280px] rounded-[1.75rem] bg-black shadow-xl ring-1 ring-black/10"
                aria-label={`Vídeo: ${v.titulo}`}
              >
                <source src={v.arquivo} type="video/mp4" />
              </video>
              <div className="mx-auto flex w-full max-w-[280px] flex-col gap-1">
                <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <span className="grid size-6 place-items-center rounded-full bg-oficina text-xs text-oficina-texto">{i + 1}</span>
                  <Icone aria-hidden className="size-4" /> {v.segundos} segundos
                </p>
                <h2 className="text-xl leading-tight font-extrabold">{v.titulo}</h2>
                <p className="text-base text-muted-foreground">{v.resumo}</p>
                <details className="group mt-1">
                  <summary className="tocavel inline-flex min-h-11 cursor-pointer list-none items-center text-base font-bold text-oficina [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Ver os passos</span>
                    <span className="hidden group-open:inline">Esconder os passos</span>
                  </summary>
                  <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5 text-base">
                    {v.passos.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
