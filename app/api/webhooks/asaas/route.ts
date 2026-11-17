import { after, NextResponse } from "next/server";
import { receberWebhook } from "@/lib/pagamentos/webhook";
import { depsWebhook } from "@/lib/pagamentos/servidor";

/**
 * Webhook do Asaas: https://www.vistoriarapida.digital/api/webhooks/asaas
 * O Asaas manda o token (cadastrado no painel) no cabeçalho asaas-access-token.
 * Responde 200 na hora (o evento já ficou gravado) e processa logo depois, com `after`.
 * Se o processamento falhar, o evento fica pendente e a rotina diária tenta de novo.
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
    if (r.processar) after(r.processar);
    return NextResponse.json(r.corpo, { status: r.status });
  } catch (erro) {
    // Não conseguiu nem gravar o evento: 500 para o Asaas mandar de novo
    console.error("Webhook Asaas: erro inesperado", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
