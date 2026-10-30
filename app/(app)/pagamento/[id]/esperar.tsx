"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { BotaoSecundario } from "@/components/vf";
import { textos } from "@/lib/textos";
import { faturaPaga, jaPaguei } from "../../assinar/acoes";

/** Confere a cada 3 s se o webhook já confirmou. Pago: "Pagamento confirmado!" e abre o sistema. */
export function EsperarPagamento({ faturaId }: { faturaId: string }) {
  const t = textos.assinatura;
  const router = useRouter();
  const [paga, setPaga] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conferindo, iniciar] = useTransition();

  useEffect(() => {
    if (paga) {
      const ir = setTimeout(() => router.replace("/inicio"), 2500);
      return () => clearTimeout(ir);
    }
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        if (await faturaPaga(faturaId)) setPaga(true);
      } catch {
        // sem internet: tenta de novo em 3 s
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [faturaId, paga, router]);

  if (paga) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl bg-acao-clara px-4 py-4 text-acao [&_svg]:size-9 [&_svg]:shrink-0">
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
      <p className="flex items-center justify-center gap-2 text-base text-muted-foreground" aria-live="polite">
        <Loader2 aria-hidden className="size-5 animate-spin" /> {aviso ?? t.esperando}
      </p>
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
