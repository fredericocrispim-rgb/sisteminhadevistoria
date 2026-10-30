import type { MetadataRoute } from "next";
import { textos } from "@/lib/textos";

/** Deixa o sistema ser instalado na tela do celular, como um app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/inicio",
    name: textos.produto.nome,
    short_name: "Vistoria Rápida",
    description: textos.produto.slogan,
    lang: "pt-BR",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      { src: "/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
