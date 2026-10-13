"use client";

import { useRouter } from "next/navigation";
import { AjudaRapida, BarraEtapas } from "@/components/vf";
import { textos } from "@/lib/textos";
import { PassoCarro } from "../_passos/passo-carro";
import type { DadosCarro, InfoEntrada } from "../_passos/tipos";

const etapas = Object.values(textos.vistoria.etapas);

/** Passo 1 de uma vistoria nova. Ao salvar, a vistoria é criada e segue para as fotos. */
export function NovaVistoria({ tipo, inicial, entrada }: { tipo: "ENTRADA" | "SAIDA"; inicial: DadosCarro; entrada: InfoEntrada }) {
  const router = useRouter();
  return (
    <>
      <BarraEtapas
        etapas={etapas}
        atual={1}
        onVoltar={() => router.push("/inicio")}
        ajuda={<AjudaRapida titulo={etapas[0]} dica="Digite a placa. Se o carro já veio antes, o resto aparece sozinho." />}
      />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-1">
        <p className="-mt-1 text-base font-bold text-muted-foreground">{tipo === "ENTRADA" ? "Chegada do carro" : "Entrega do carro"}</p>
        <PassoCarro
          vistoriaId={null}
          tipo={tipo}
          inicial={inicial}
          entrada={entrada}
          aoSalvar={(id) => router.replace(`/vistorias/${id}?passo=2`)}
        />
      </main>
    </>
  );
}
