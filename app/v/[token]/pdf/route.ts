import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { vistoriaPorToken } from "@/lib/vistoria-publica";

/** Abre o termo em PDF (link temporário de 2 minutos para o arquivo guardado). */
export async function GET(_: Request, { params }: RouteContext<"/v/[token]/pdf">) {
  const { token } = await params;
  const v = await vistoriaPorToken(token);
  if (!v?.pdf_url) return new NextResponse("Termo não encontrado", { status: 404 });
  const carro = v.veiculos as unknown as { placa: string };
  const { data } = await criarClienteAdmin()
    .storage.from("vistorias")
    .createSignedUrl(v.pdf_url, 120, { download: `termo-vistoria-${carro.placa}-${v.numero}.pdf` });
  if (!data) return new NextResponse("Termo não encontrado", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
