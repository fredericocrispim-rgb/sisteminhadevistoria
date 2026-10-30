import type { Metadata } from "next";
import { exigirLogin } from "@/lib/sessao";
import { FormNovaSenha } from "./form";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false, follow: false } };

/** Aberta pelo link de "Esqueci minha senha" (a pessoa já chega logada pelo link). */
export default async function NovaSenha() {
  const ctx = await exigirLogin();
  return <FormNovaSenha email={ctx.usuario.email} />;
}
