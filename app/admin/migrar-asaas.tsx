"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmacaoImportante } from "@/components/vf";
import { migrarClientesAsaas } from "./acoes";

/**
 * Passar os clientes do Pix manual para a assinatura mensal do Asaas (Pix).
 * Nada é cobrado antes: a 1ª cobrança automática vence no fim do período já pago.
 */
export function MigrarAsaas({ prontas, semDocumento }: { prontas: number; semDocumento: number }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [trabalhando, iniciar] = useTransition();

  const migrar = () =>
    iniciar(async () => {
      const r = await migrarClientesAsaas();
      if (!r.ok) return setResultado(r.erro);
      setResultado(
        `${r.migradas} passada(s) para a assinatura automática.` +
          (r.restantes ? ` Faltam ${r.restantes}: toque de novo.` : "") +
          (r.erros.length ? ` Problemas: ${r.erros.join("; ")}` : ""),
      );
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-4">
      <p className="text-lg font-extrabold">Clientes do Pix manual → assinatura automática (Asaas)</p>
      <p className="text-sm text-muted-foreground">
        {prontas} prontas para passar (Pix, 1ª cobrança no fim do período já pago). {semDocumento} sem CPF/CNPJ: elas veem em Meu plano o
        aviso para escolher como pagar.
      </p>
      {prontas > 0 && (
        <button
          type="button"
          disabled={trabalhando}
          onClick={() => setConfirmar(true)}
          className="tocavel min-h-toque self-start rounded-xl bg-background px-4 text-base font-bold disabled:opacity-60"
        >
          {trabalhando ? "Passando..." : `Passar ${Math.min(prontas, 20)} agora`}
        </button>
      )}
      {resultado && <p className="text-base font-bold">{resultado}</p>}
      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        titulo="Criar as assinaturas no Asaas?"
        texto="Cada oficina vira cliente no Asaas com assinatura mensal no Pix. O Asaas avisa o cliente por e-mail/WhatsApp antes de cada cobrança. Nada é cobrado antes do vencimento que já foi pago."
        textoConfirmar="Sim, criar"
        onConfirmar={migrar}
      />
    </section>
  );
}
