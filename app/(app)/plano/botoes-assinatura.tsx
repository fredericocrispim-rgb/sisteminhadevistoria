"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Video, Wallet, XCircle } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, ConfirmacaoImportante, MensagemErroCampo } from "@/components/vf";
import { textos } from "@/lib/textos";
import { cancelarAssinatura } from "../assinar/acoes";
import { trocarPlano } from "./acoes";

/**
 * Pagar a cobrança em aberto: vai para a tela da cobrança, que mostra o QR Code do Pix ou o boleto
 * (ou pagar com outro cartão) e libera o sistema sozinha quando o pagamento cai.
 */
export function BotaoPagar({ faturaId, children }: { faturaId: string; children: React.ReactNode }) {
  return (
    <BotaoPrincipal href={`/pagamento/${faturaId}`} icone={<ArrowRight aria-hidden />}>
      {children}
    </BotaoPrincipal>
  );
}

/** Básico ⇄ Pro (vídeo de até 1 minuto). */
export function TrocarPlano({ pro, valorPro, diferenca }: { pro: boolean; valorPro: string; diferenca: string }) {
  const t = textos.planos;
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, iniciar] = useTransition();

  const trocar = () =>
    iniciar(async () => {
      setErro(null);
      const r = await trocarPlano(!pro);
      if (!r.ok) return setErro(r.erro);
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-superficie px-4 py-4">
      <div className="flex items-center gap-3 [&>svg]:size-8 [&>svg]:shrink-0 [&>svg]:text-oficina">
        <Video aria-hidden />
        <div>
          <p className="text-xl font-extrabold">
            {t.pro}
            {pro ? " · ativo" : ` · ${valorPro}/mês`}
          </p>
          <p className="text-base font-semibold text-muted-foreground">{t.proTexto}</p>
        </div>
      </div>
      {pro ? (
        <BotaoSecundario carregando={trabalhando} onClick={trocar}>
          {t.voltarBasico}
        </BotaoSecundario>
      ) : (
        <BotaoPrincipal carregando={trabalhando} icone={<Video aria-hidden />} onClick={trocar}>
          {t.mudarPro(diferenca)}
        </BotaoPrincipal>
      )}
      <p className="text-base text-muted-foreground">{t.proximaMensalidade}</p>
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
    </section>
  );
}

/** Trocar a forma de pagamento ou o cartão (tela própria) e cancelar (com confirmação). */
export function BotoesAssinatura({ forma }: { forma: "PIX" | "CREDIT_CARD" | "BOLETO" | null }) {
  const t = textos.assinatura;
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, iniciar] = useTransition();

  const cancelar = () =>
    iniciar(async () => {
      setErro(null);
      const r = await cancelarAssinatura();
      if (!r.ok) setErro(r.erro);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      {forma === "CREDIT_CARD" && (
        <BotaoSecundario href="/plano/forma?cartao=1" icone={<CreditCard aria-hidden />}>
          {t.trocarCartao}
        </BotaoSecundario>
      )}
      <BotaoSecundario href="/plano/forma" icone={<Wallet aria-hidden />}>
        {t.trocarForma}
      </BotaoSecundario>
      <BotaoSecundario className="text-perigo" icone={<XCircle aria-hidden />} onClick={() => setConfirmar(true)} disabled={trabalhando}>
        {t.cancelar}
      </BotaoSecundario>
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        perigo
        titulo={t.cancelarTitulo}
        texto={t.cancelarTexto}
        textoConfirmar={t.cancelarSim}
        onConfirmar={cancelar}
      />
    </div>
  );
}
