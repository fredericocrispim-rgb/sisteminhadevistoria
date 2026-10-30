import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade", alternates: { canonical: "/privacidade" } };

export default function Privacidade() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 text-lg">
      <h1 className="text-[1.75rem] font-extrabold">Política de Privacidade</h1>
      <p>Guardamos os dados necessários para a vistoria: nome e contato do cliente, dados do veículo, fotos, assinatura e localização no momento da vistoria.</p>
      <p>A oficina é a dona (controladora) dos dados dos clientes dela. O Vistoria Rápida apenas guarda e processa esses dados para a oficina (operador).</p>
      <p>Os dados ficam em servidores no Brasil, protegidos: cada oficina só vê os próprios dados.</p>
      <p>Para pedir acesso, correção ou exclusão de dados, fale com a oficina ou com o suporte.</p>
    </main>
  );
}
