import { NextResponse } from "next/server";
import { receberWebhook } from "@/lib/pagamentos/webhook";
import { depsWebhook } from "@/lib/pagamentos/servidor";

/**
 * Webhook do Asaas: https://www.vistoriarapida.digital/api/webhooks/asaas
 * O Asaas manda o token (cadastrado no painel) no cabeçalho asaas-access-token.
 */
export async function POST(request: Request) {
  try {
    const r = await receberWebhook(
      {
        token: request.headers.get("asaas-access-token"),
        tokenEsperado: process.env.ASAAS_WEBHOOK_TOKEN,
        corpo: await request.text(),
      },
      depsWebhook(),
    );
    return NextResponse.json(r.corpo, { status: r.status });
  } catch (erro) {
    console.error("Webhook Asaas: erro inesperado", erro);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
