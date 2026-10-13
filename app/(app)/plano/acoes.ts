"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hojeBR } from "@/lib/cadastro";

/** "Continuar para o sistema": não mostra o Pix de novo hoje e segue para o início. */
export async function continuarSemPagar() {
  const c = await cookies();
  c.set("vf_aviso_pix", hojeBR(), { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/inicio");
}
