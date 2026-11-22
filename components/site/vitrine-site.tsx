import Image from "next/image";
import Link from "next/link";
import { Check, Video } from "lucide-react";
import { BotaoCriarConta } from "./blocos";
import { centavos, type PlanoSite } from "@/lib/planos-site";

/** Fotos reais das telas do app (tiradas da vitrine /estilo, 1000 x 2080). */
export const TELAS = {
  inicio: { src: "/telas/inicio.png", alt: "Tela inicial do app com os botões CHEGOU CARRO e ENTREGAR CARRO" },
  fotos: { src: "/telas/fotos.png", alt: "Tela de fotos guiadas: frente, traseira, lados, painel e motor" },
  riscos: { src: "/telas/riscos.png", alt: "Tela para marcar riscos e amassados no desenho do carro" },
  pneus: { src: "/telas/pneus.png", alt: "Tela para conferir os pneus com um toque" },
  concluida: { src: "/telas/concluida.png", alt: "Vistoria concluída, pronta para enviar ao cliente pelo WhatsApp" },
} as const;

/** Moldura de celular com a foto de uma tela do app. */
export function Celular({
  tela,
  className = "",
  prioridade = false,
}: {
  tela: keyof typeof TELAS;
  className?: string;
  prioridade?: boolean;
}) {
  const t = TELAS[tela];
  return (
    <div className={`relative rounded-[2.2rem] bg-[#0f172a] p-2 shadow-2xl ring-1 ring-black/10 ${className}`}>
      <div className="overflow-hidden rounded-[1.8rem] bg-white">
        <Image src={t.src} alt={t.alt} width={1000} height={2080} priority={prioridade} sizes="(min-width: 1024px) 280px, 60vw" className="h-auto w-full" />
      </div>
    </div>
  );
}

const ITENS_BASICO = [
  "Vistorias sem limite, de chegada e de entrega",
  "Fotos guiadas com data e hora",
  "Riscos marcados no desenho do carro",
  "Cliente assina com o dedo",
  "PDF com a sua logo no WhatsApp",
];

/** Os dois planos lado a lado (no celular, um embaixo do outro). */
export function CartoesPlanos({ basico, pro }: { basico: PlanoSite; pro: PlanoSite }) {
  const pessoas = (p: PlanoSite) => `Você + ${p.inclusos - 1} pessoas da equipe`;
  const planos = [
    { p: basico, destaque: false, frase: "Tudo para fazer a vistoria", itens: [pessoas(basico), ...ITENS_BASICO] },
    {
      p: pro,
      destaque: true,
      frase: "Tudo do Básico e mais vídeo",
      itens: [`Vídeo de até ${Math.max(1, Math.round(pro.videoSegundos / 60))} minuto em volta do carro`, pessoas(pro), ...ITENS_BASICO],
    },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {planos.map(({ p, destaque, frase, itens }) => (
        <section
          key={p.nome}
          aria-label={`Plano ${p.nome}`}
          className={`relative flex flex-col gap-5 rounded-3xl p-6 ${destaque ? "bg-[#0f172a] text-white shadow-2xl" : "bg-background shadow-xl ring-1 ring-border"}`}
        >
          {destaque && (
            <span className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-marca-verde px-3 py-1 text-sm font-extrabold text-white">
              <Video aria-hidden className="size-4" /> Com vídeo
            </span>
          )}
          <div>
            <h3 className="m-0 text-2xl font-extrabold">{p.nome}</h3>
            <p className={`m-0 mt-1 text-lg ${destaque ? "text-white/75" : "text-muted-foreground"}`}>{frase}</p>
          </div>
          <p className="m-0 flex items-end gap-1">
            <span className="pb-2 text-xl font-bold">R$</span>
            <span className="text-6xl leading-none font-extrabold tracking-tight">{centavos(p.preco)}</span>
            <span className={`pb-1 text-lg ${destaque ? "text-white/75" : "text-muted-foreground"}`}>/mês</span>
          </p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {itens.map((i, n) => (
              <li key={i} className={`flex items-start gap-2 text-lg ${destaque && n === 0 ? "font-extrabold" : ""}`}>
                <Check aria-hidden className={`mt-1 size-5 shrink-0 ${destaque ? "text-marca-verde" : "text-acao"}`} strokeWidth={3} /> {i}
              </li>
            ))}
          </ul>
          <p className={`m-0 text-base ${destaque ? "text-white/75" : "text-muted-foreground"}`}>Mais gente na equipe? + R$ {centavos(p.extra)} por pessoa.</p>
          <div className="mt-auto">
            <BotaoCriarConta texto={`Começar no ${p.nome}`} />
          </div>
        </section>
      ))}
    </div>
  );
}

/** Faixa curta de preço para outras páginas: "A partir de R$ 49,90 por mês". */
export function FaixaPreco({ basico }: { basico: PlanoSite }) {
  return (
    <p className="text-lg">
      A partir de <strong>R$ {centavos(basico.preco)} por mês</strong>. Pague por Pix, cartão ou boleto.{" "}
      <Link href="/precos" className="font-bold">
        Ver os planos
      </Link>
    </p>
  );
}
