import type { MetadataRoute } from "next";
import { ARTIGOS } from "@/lib/conteudo/blog";
import { enderecoCompleto } from "@/lib/site";

/** Data da última mudança de texto das páginas públicas (atualize quando mexer no conteúdo). */
const ATUALIZADO = "2026-10-30";

const PAGINAS: { caminho: string; prioridade: number }[] = [
  { caminho: "/", prioridade: 1 },
  { caminho: "/vistoria-digital-para-oficinas", prioridade: 0.9 },
  { caminho: "/como-funciona", prioridade: 0.9 },
  { caminho: "/vistoria-de-carro-pelo-celular", prioridade: 0.8 },
  { caminho: "/laudo-de-vistoria-digital", prioridade: 0.8 },
  { caminho: "/checklist-de-entrada-de-veiculo", prioridade: 0.8 },
  { caminho: "/precos", prioridade: 0.8 },
  { caminho: "/blog", prioridade: 0.6 },
  { caminho: "/verificar", prioridade: 0.5 },
  { caminho: "/termos", prioridade: 0.2 },
  { caminho: "/privacidade", prioridade: 0.2 },
];

/** sitemap.xml com as páginas públicas e os artigos do blog. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGINAS.map((p) => ({ url: enderecoCompleto(p.caminho), lastModified: ATUALIZADO, priority: p.prioridade })),
    ...ARTIGOS.map((a) => ({ url: enderecoCompleto(`/blog/${a.slug}`), lastModified: a.atualizadoEm, priority: 0.7 })),
  ];
}
