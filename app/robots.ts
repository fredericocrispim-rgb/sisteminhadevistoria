import type { MetadataRoute } from "next";
import { ENDERECO_SITE } from "@/lib/previa-link";

/**
 * robots.txt: libera o site de divulgação e bloqueia login, telas internas e vistorias individuais
 * (dados de clientes e placas não podem ir para o Google). A busca /verificar continua liberada.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/entrar",
        "/cadastro",
        "/nova-senha",
        "/convite/",
        "/v/",
        "/verificar/",
        "/inicio",
        "/vistorias",
        "/patio",
        "/mais",
        "/plano",
        "/assinar",
        "/pagamento/",
        "/equipe",
        "/indicar",
        "/admin",
        "/estilo",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${ENDERECO_SITE}/sitemap.xml`,
    host: ENDERECO_SITE,
  };
}
