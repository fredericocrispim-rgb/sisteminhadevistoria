import { CabecalhoSite } from "@/components/site/cabecalho-site";
import { RodapeSite } from "@/components/site/rodape-site";

/** Páginas públicas de divulgação (para o Google): cabeçalho com menu e rodapé com todos os links. */
export default function LayoutSite({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <CabecalhoSite />
      {children}
      <RodapeSite />
    </div>
  );
}
