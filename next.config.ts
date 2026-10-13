import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O gerador de PDF roda só no servidor, fora do empacotamento
  serverExternalPackages: ["@react-pdf/renderer"],
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
