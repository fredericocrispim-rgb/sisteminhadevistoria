/**
 * Páginas do site de divulgação (sem nada do servidor: pode ser usado também nas telas do navegador).
 */

/** Instagram da Vistoria Rápida (rodapé e dados estruturados "sameAs"). */
export const INSTAGRAM = { usuario: "@sisteminha.digital", link: "https://www.instagram.com/sisteminha.digital/" };

/** Menu do topo (na ordem em que aparece). */
export const MENU_SITE = [
  { caminho: "/", nome: "Início" },
  { caminho: "/videos", nome: "Vídeos" },
  { caminho: "/precos", nome: "Preços" },
  { caminho: "/blog", nome: "Dicas" },
  { caminho: "/verificar", nome: "Conferir uma vistoria" },
];

/** Páginas por tipo de negócio (rodapé e tela inicial). */
export const SEGMENTOS_SITE = [
  { caminho: "/sistema-para-oficina", nome: "Sistema para oficina" },
  { caminho: "/sistema-para-loja-de-carros", nome: "Sistema para loja de carros" },
  { caminho: "/sistema-para-lava-jato", nome: "Sistema para lava jato" },
  { caminho: "/sistema-para-frotista", nome: "Sistema para frotista" },
];

/** Rodapé: o menu + as outras páginas de conteúdo. */
export const RODAPE_SITE = [
  ...MENU_SITE,
  ...SEGMENTOS_SITE,
  { caminho: "/checklist-de-entrada-de-veiculo", nome: "Checklist de entrada" },
  { caminho: "/vistoria-de-carro-pelo-celular", nome: "Vistoria de carro pelo celular" },
  { caminho: "/laudo-de-vistoria-digital", nome: "Laudo de vistoria digital" },
  { caminho: "/termos", nome: "Termos de uso" },
  { caminho: "/privacidade", nome: "Privacidade" },
];

/** Páginas que têm o cabeçalho do site (a faixa da logo do app não aparece nelas). */
export const PAGINAS_COM_CABECALHO_SITE = [
  "/",
  "/videos",
  "/sistema-para-oficina",
  "/sistema-para-loja-de-carros",
  "/sistema-para-lava-jato",
  "/sistema-para-frotista",
  "/vistoria-de-carro-pelo-celular",
  "/laudo-de-vistoria-digital",
  "/checklist-de-entrada-de-veiculo",
  "/precos",
  "/blog",
  "/verificar",
];

/** A página tem o cabeçalho do site? (inclui os artigos do blog) */
export function temCabecalhoSite(caminho: string) {
  return PAGINAS_COM_CABECALHO_SITE.includes(caminho) || caminho.startsWith("/blog/");
}
