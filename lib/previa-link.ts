import type { Metadata } from "next";
import { textos } from "@/lib/textos";

/** Endereço oficial (os links e a prévia do WhatsApp usam este). */
export const ENDERECO_SITE = "https://www.vistoriarapida.digital";

/**
 * Prévia do link no WhatsApp (Open Graph). A imagem é fixa, em public/og.jpg (1200 x 630, JPG leve),
 * com endereço simples e completo: o WhatsApp não mostra a prévia quando o endereço da imagem é estranho.
 */
export const previaLink = {
  type: "website",
  locale: "pt_BR",
  siteName: `${textos.produto.nome}${textos.produto.sufixo}`,
  title: textos.produto.tituloLink,
  description: textos.produto.slogan,
  images: [{ url: `${ENDERECO_SITE}/og.jpg`, width: 1200, height: 630, type: "image/jpeg", alt: textos.produto.tituloLink }],
} satisfies Metadata["openGraph"];
