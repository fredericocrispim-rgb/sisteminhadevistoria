import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O gerador de PDF roda só no servidor, fora do empacotamento
  serverExternalPackages: ["@react-pdf/renderer"],
  // Endereço novo (30/10/2026): o antigo leva para o novo com o mesmo caminho, para sempre.
  // Os QR Codes e links dos termos já entregues apontam para o endereço antigo.
  // ?novo=1 faz a tela Entrar avisar da troca (o login não passa de um endereço para o outro).
  async redirects() {
    return [
      {
        source: "/:caminho*",
        has: [{ type: "host", value: "sisteminhadevistoria.vercel.app" }],
        destination: "https://www.vistoriarapida.digital/:caminho*?novo=1",
        permanent: true,
      },
    ];
  },
  // Cache Components desligado de propósito: quase todas as telas dependem do login,
  // e o modo clássico (renderiza a cada acesso) é mais simples de manter.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
