import { metadadosSegmento, PaginaSegmento } from "@/components/site/segmento";
import { FROTA } from "@/lib/conteudo/segmentos";

export const metadata = metadadosSegmento(FROTA);

export default function Pagina() {
  return <PaginaSegmento s={FROTA} />;
}

/** Preços vêm da tabela planos: confere de novo a cada hora. */
export const revalidate = 3600;
