import { metadadosSegmento, PaginaSegmento } from "@/components/site/segmento";
import { LAVA_JATO } from "@/lib/conteudo/segmentos";

export const metadata = metadadosSegmento(LAVA_JATO);

export default function Pagina() {
  return <PaginaSegmento s={LAVA_JATO} />;
}

/** Preços vêm da tabela planos: confere de novo a cada hora. */
export const revalidate = 3600;
