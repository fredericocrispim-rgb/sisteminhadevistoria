"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AjudaRapida, BarraEtapas, SilhuetaCarro } from "@/components/vf";
import { TIPOS_VEICULO, nomeVeiculo, type TipoVeiculo } from "@/lib/vistoria";
import { textos } from "@/lib/textos";
import { PassoCarro } from "../_passos/passo-carro";
import type { DadosCarro, InfoEntrada } from "../_passos/tipos";

const etapas = Object.values(textos.vistoria.etapas);

/**
 * Começo de uma vistoria nova: primeiro escolhe o veículo (carro, moto ou caminhão),
 * depois o passo 1. Ao salvar, a vistoria é criada e segue para as fotos.
 * Na ENTREGA ligada a uma chegada, o veículo já vem da chegada.
 */
export function NovaVistoria({
  tipo,
  inicial,
  entrada,
  veiculoInicial,
}: {
  tipo: "ENTRADA" | "SAIDA";
  inicial: DadosCarro;
  entrada: InfoEntrada;
  veiculoInicial: TipoVeiculo | null;
}) {
  const router = useRouter();
  const [veiculo, setVeiculo] = useState<TipoVeiculo | null>(veiculoInicial);

  if (!veiculo) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-4 pb-10">
        <button
          type="button"
          onClick={() => router.push("/inicio")}
          className="tocavel inline-flex min-h-toque items-center gap-1.5 self-start rounded-2xl px-2 text-lg font-bold"
        >
          <ArrowLeft aria-hidden className="size-7" /> {textos.geral.voltar}
        </button>
        <h1 className="text-[1.75rem] leading-tight font-extrabold">{textos.veiculo.pergunta}</h1>
        <div className="flex flex-col gap-3">
          {TIPOS_VEICULO.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setVeiculo(t.id);
                window.scrollTo(0, 0);
              }}
              className="tocavel flex min-h-28 items-center gap-4 rounded-3xl bg-superficie px-4 py-3 text-left active:bg-oficina-clara"
            >
              <SilhuetaCarro vista="lateral-esquerda" veiculo={t.id} className="w-28 shrink-0 text-oficina" />
              <span className="min-w-0 text-[1.375rem] leading-tight font-extrabold break-words">{t.nome}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
      <BarraEtapas
        etapas={etapas}
        atual={1}
        onVoltar={() => (veiculoInicial ? router.push("/inicio") : setVeiculo(null))}
        ajuda={<AjudaRapida titulo={etapas[0]} dica="Digite a placa. Se o veículo já veio antes, o resto aparece sozinho." />}
      />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-1">
        <p className="-mt-1 text-base font-bold text-muted-foreground">
          {tipo === "ENTRADA" ? "Chegada" : "Entrega"} · {nomeVeiculo(veiculo)}
        </p>
        <PassoCarro
          key={veiculo}
          vistoriaId={null}
          tipo={tipo}
          tipoVeiculo={veiculo}
          inicial={inicial}
          entrada={entrada}
          aoSalvar={(id) => router.replace(`/vistorias/${id}?passo=2`)}
        />
      </main>
    </>
  );
}
