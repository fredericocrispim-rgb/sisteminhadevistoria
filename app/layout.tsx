import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { scriptModoSol } from "@/components/vf/modo-sol";
import { RegistrarApp } from "@/components/vf/instalar-app";
import { BarraMarca } from "@/components/vf/barra-marca";
import { textos } from "@/lib/textos";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: textos.produto.nome,
    template: `%s · ${textos.produto.nome}`,
  },
  description: textos.produto.slogan,
  // Prévia do link no WhatsApp: título, texto e a imagem fixa app/opengraph-image.jpg (1200 x 630)
  metadataBase: new URL("https://www.vistoriarapida.digital"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: `${textos.produto.nome}${textos.produto.sufixo}`,
    title: textos.produto.tituloLink,
    description: textos.produto.slogan,
  },
  twitter: { card: "summary_large_image", title: textos.produto.tituloLink, description: textos.produto.slogan },
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
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
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
