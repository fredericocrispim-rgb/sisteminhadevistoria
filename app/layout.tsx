import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { scriptModoSol } from "@/components/vf/modo-sol";
import { textos } from "@/lib/textos";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: textos.produto.nome,
    template: `%s · ${textos.produto.nome}`,
  },
  description: textos.produto.slogan,
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
