import type { Metadata } from "next";
import { FormCriarSenha } from "./form";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false, follow: false } };

/** Aberta pelo link de senha nova (e-mail ou WhatsApp). Não precisa estar logado. */
export default async function CriarSenha({ searchParams }: PageProps<"/criar-senha">) {
  const { token } = await searchParams;
  return <FormCriarSenha token={typeof token === "string" ? token : ""} />;
}
