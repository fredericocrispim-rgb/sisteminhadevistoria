"use client";

import { useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import { BotaoPrincipal, MensagemErroCampo } from "@/components/vf";
import { formatarReais } from "@/lib/pix";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { trocarPlano } from "@/app/(app)/plano/acoes";

const t = textos.cadastro.plano;

export type OpcaoPlano = { id: string; nome: string; valor: number; inclusos: number | null; video: boolean };

/**
 * Escolha do plano no fim do cadastro (antes da senha provisória e do Pix).
 * Cartões grandes com nome, preço e o que tem. Pode mudar depois em Mais > Meu plano.
 */
export function PassoPlano({ planos, aoTerminar }: { planos: OpcaoPlano[]; aoTerminar: () => void }) {
  const [escolhido, setEscolhido] = useState(planos.find((p) => !p.video)?.id ?? planos[0]?.id);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function continuar() {
    const plano = planos.find((p) => p.id === escolhido);
    if (!plano) return aoTerminar();
    setCarregando(true);
    setErro(undefined);
    const r = await trocarPlano(plano.video);
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    aoTerminar();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label={t.titulo} className="flex flex-col gap-3">
        {planos.map((p) => {
          const marcado = p.id === escolhido;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={marcado}
              onClick={() => setEscolhido(p.id)}
              className={cn(
                "tocavel flex items-start gap-3 rounded-3xl p-4 text-left ring-2",
                marcado ? "bg-oficina-clara ring-oficina" : "cartao ring-transparent",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1 grid size-8 shrink-0 place-items-center rounded-full border-2",
                  marcado ? "border-oficina bg-oficina text-oficina-texto" : "border-input",
                )}
              >
                {marcado && <Check className="size-5" strokeWidth={3} />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-2xl font-extrabold">{p.nome}</span>
                <span className="text-3xl font-extrabold">
                  {formatarReais(p.valor)}
                  <span className="text-lg font-bold text-muted-foreground"> {t.porMes}</span>
                </span>
                <span className="text-base font-semibold text-muted-foreground">{t.basicoTexto}</span>
                {p.inclusos != null && <span className="text-base font-semibold text-muted-foreground">{t.pessoas(p.inclusos)}</span>}
                {p.video && <span className="text-base font-bold text-oficina">{textos.planos.proTexto}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-acao-clara px-4 py-3 text-lg font-bold text-acao">
        <Info aria-hidden className="mt-0.5 size-6 shrink-0" /> {t.mudarQuandoQuiser}
      </p>

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal carregando={carregando} icone={<ArrowRight aria-hidden />} onClick={continuar}>
        {textos.cadastro.proximo}
      </BotaoPrincipal>
    </div>
  );
}
