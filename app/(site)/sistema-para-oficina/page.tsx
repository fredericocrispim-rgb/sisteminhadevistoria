import { metadadosSegmento, PaginaSegmento } from "@/components/site/segmento";
import { OFICINA } from "@/lib/conteudo/segmentos";

export const metadata = metadadosSegmento(OFICINA);

export default function Pagina() {
  return <PaginaSegmento s={OFICINA} />;
}

/** Preços vêm da tabela planos: confere de novo a cada hora. */
export const revalidate = 3600;
