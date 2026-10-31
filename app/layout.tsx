import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { scriptModoSol } from "@/components/vf/modo-sol";
import { RegistrarApp } from "@/components/vf/instalar-app";
import { BarraMarca } from "@/components/vf/barra-marca";
import { textos } from "@/lib/textos";
import { ENDERECO_SITE, previaLink } from "@/lib/previa-link";
import "./globals.css";

// Fonte moderna e muito legível. Baixada no build e servida pelo próprio site (não depende do Google no celular).
const fonte = Inter({ subsets: ["latin"], display: "swap", variable: "--fonte-inter" });

export const metadata: Metadata = {
  title: {
    default: textos.produto.nome,
    template: `%s · ${textos.produto.nome}`,
  },
  description: textos.produto.slogan,
  // Prévia do link no WhatsApp (lib/previa-link.ts)
  metadataBase: new URL(ENDERECO_SITE),
  openGraph: previaLink,
  twitter: { card: "summary_large_image", title: previaLink.title, description: previaLink.description, images: previaLink.images },
  // iPhone: ao pôr na Tela de Início, abre sem a barra do Safari, como app, com o nome curto
  appleWebApp: { capable: true, title: "Vistoria", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`h-full ${fonte.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptModoSol }} />
      </head>
      <body className="flex min-h-full flex-col">
        <BarraMarca />
        {children}
        <Toaster />
        <RegistrarApp />
      </body>
    </html>
  );
}
