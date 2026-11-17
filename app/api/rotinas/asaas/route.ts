import { NextResponse } from "next/server";
import { reprocessarPendentes } from "@/lib/pagamentos/servidor";

/**
 * Rotina diária do Asaas (Vercel Cron, ver vercel.json): tenta de novo os avisos do webhook que falharam.
 * O bloqueio por atraso não depende desta rotina: a regra de acesso confere a data a cada página aberta.
 * A Vercel manda "Authorization: Bearer CRON_SECRET".
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const eventos = await reprocessarPendentes();
  console.log(`Rotina Asaas: ${eventos.processados} de ${eventos.pendentes} avisos pendentes processados`);
  return NextResponse.json({ ok: true, eventos });
}
