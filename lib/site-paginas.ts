/**
 * Páginas do site de divulgação (sem nada do servidor: pode ser usado também nas telas do navegador).
 */

/** Menu do topo (na ordem em que aparece). */
export const MENU_SITE = [
  { caminho: "/como-funciona", nome: "Como funciona" },
  { caminho: "/vistoria-digital-para-oficinas", nome: "Para oficinas" },
  { caminho: "/precos", nome: "Preços" },
  { caminho: "/checklist-de-entrada-de-veiculo", nome: "Checklist" },
  { caminho: "/blog", nome: "Blog" },
  { caminho: "/verificar", nome: "Conferir uma vistoria" },
];

/** Rodapé: o menu + as outras páginas de conteúdo. */
export const RODAPE_SITE = [
  ...MENU_SITE,
  { caminho: "/vistoria-de-carro-pelo-celular", nome: "Vistoria de carro pelo celular" },
  { caminho: "/laudo-de-vistoria-digital", nome: "Laudo de vistoria digital" },
  { caminho: "/termos", nome: "Termos de uso" },
  { caminho: "/privacidade", nome: "Privacidade" },
];

/** Páginas que têm o cabeçalho do site (a faixa da logo do app não aparece nelas). */
export const PAGINAS_COM_CABECALHO_SITE = [
  "/",
  "/como-funciona",
  "/vistoria-digital-para-oficinas",
  "/vistoria-de-carro-pelo-celular",
  "/laudo-de-vistoria-digital",
  "/checklist-de-entrada-de-veiculo",
  "/precos",
  "/blog",
];

/** A página tem o cabeçalho do site? (inclui os artigos do blog) */
export function temCabecalhoSite(caminho: string) {
  return PAGINAS_COM_CABECALHO_SITE.includes(caminho) || caminho.startsWith("/blog/");
}
