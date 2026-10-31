"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { BotaoSecundario } from "@/components/vf";
import { textos } from "@/lib/textos";
import { faturaPaga, jaPaguei } from "../../assinar/acoes";

/**
 * Confere sozinha se o pagamento caiu: a cada 3 s olha o banco (o webhook do Asaas grava lá) e,
 * a cada 15 s, pergunta direto ao Asaas (no servidor), caso o aviso atrase. Também confere na hora
 * em que a pessoa volta da aba do Asaas. Pago: "Pagamento confirmado!" e abre o sistema.
 */
export function EsperarPagamento({ faturaId }: { faturaId: string }) {
  const t = textos.assinatura;
  const router = useRouter();
  const [paga, setPaga] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conferindo, iniciar] = useTransition();
  const voltas = useRef(0);

  const conferir = useCallback(
    async (perguntarAoAsaas: boolean) => {
      try {
        if (perguntarAoAsaas) {
          const r = await jaPaguei(faturaId);
          if (r.ok && r.paga) setPaga(true);
        } else if (await faturaPaga(faturaId)) {
          setPaga(true);
        }
      } catch {
        // sem internet: tenta de novo na próxima volta
      }
    },
    [faturaId],
  );

  useEffect(() => {
    if (paga) {
      const ir = setTimeout(() => {
        router.replace("/inicio");
        router.refresh();
      }, 2500);
      return () => clearTimeout(ir);
    }
    const timer = setInterval(() => {
      if (document.hidden) return;
      voltas.current += 1;
      conferir(voltas.current % 5 === 0);
    }, 3000);
    // Voltou da aba do Asaas: confere na hora, direto no Asaas
    const aoVoltar = () => {
      if (!document.hidden) conferir(true);
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [conferir, paga, router]);

  if (paga) {
    return (
      <div role="status" className="flex items-center gap-4 rounded-3xl bg-acao-clara px-5 py-5 text-acao [&_svg]:size-10 [&_svg]:shrink-0">
        <CheckCircle2 aria-hidden />
        <div>
          <p className="text-xl font-extrabold">{t.confirmado}</p>
          <p className="text-base font-semibold">{t.confirmadoTexto}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="status" aria-live="polite" className="flex items-center gap-4 rounded-3xl bg-oficina-clara px-5 py-5 text-oficina">
        <Loader2 aria-hidden className="size-9 shrink-0 animate-spin" />
        <div>
          <p className="text-xl font-extrabold">{t.esperando}</p>
          <p className="text-base font-semibold">{aviso ?? t.esperandoTexto}</p>
        </div>
      </div>
      <BotaoSecundario
        icone={<RefreshCw aria-hidden />}
        carregando={conferindo}
        onClick={() =>
          iniciar(async () => {
            const r = await jaPaguei(faturaId);
            if (!r.ok) return setAviso(r.erro);
            if (r.paga) setPaga(true);
            else setAviso(t.aindaNao);
          })
        }
      >
        {t.jaPaguei}
      </BotaoSecundario>
    </div>
  );
}
