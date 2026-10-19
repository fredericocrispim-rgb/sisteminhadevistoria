"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AjudaRapida, BarraEtapas } from "@/components/vf";
import { textos } from "@/lib/textos";
import { PassoCarro } from "./passo-carro";
import { PassoFotos } from "./passo-fotos";
import { PassoAvarias } from "./passo-avarias";
import { PassoPneus } from "./passo-pneus";
import { PassoCliente, PassoOficina } from "./passo-assinar";
import { ASSINATURA_VAZIA, type DadosVistoria } from "./tipos";

const etapas = Object.values(textos.vistoria.etapas);
const dicas = [
  "Digite a placa. Se o carro já veio antes, o resto aparece sozinho.",
  "Tire uma foto de cada vez. Siga o desenho.",
  "Toque no desenho onde tem risco ou amassado. Troque a vista nas abas.",
  "Toque em BOM ou RUIM em cada pneu. Use 'Tem tudo' e corrija só o que falta.",
  "Mostre o resumo ao cliente. Ele assina com o dedo.",
  "Agora é a sua vez: assine e conclua a vistoria.",
];

/** Vistoria em 6 passos (a partir do passo 2 a vistoria já existe no banco). */
export function AssistenteVistoria({ inicial, passoInicial }: { inicial: DadosVistoria; passoInicial: number }) {
  const router = useRouter();
  const [dados, setDados] = useState(inicial);
  const [passo, setPasso] = useState(passoInicial);
  const [assinatura, setAssinatura] = useState(ASSINATURA_VAZIA);

  function ir(p: number) {
    setPasso(p);
    window.history.replaceState(null, "", `?passo=${p}`);
    window.scrollTo(0, 0);
  }

  const titulo = `${dados.tipo === "ENTRADA" ? "Chegada" : "Entrega"} · ${dados.carro.placa}`;

  return (
    <>
      <BarraEtapas
        etapas={etapas}
        atual={passo}
        onVoltar={() => (passo === 1 ? router.push("/inicio") : ir(passo - 1))}
        ajuda={<AjudaRapida titulo={etapas[passo - 1]} dica={dicas[passo - 1]} />}
      />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-1">
        <p className="-mt-1 text-base font-bold text-muted-foreground">{titulo}</p>
        {passo === 1 && (
          <PassoCarro
            vistoriaId={dados.id}
            tipo={dados.tipo}
            inicial={dados.carro}
            entrada={dados.entrada}
            aoSalvar={(_, carro) => {
              setDados((d) => ({ ...d, carro }));
              ir(2);
            }}
          />
        )}
        {passo === 2 && (
          <PassoFotos
            vistoriaId={dados.id}
            empresaId={dados.empresaId}
            placa={dados.carro.placa}
            oficinaNome={dados.oficinaNome}
            iniciais={dados.fotos}
            aoMudar={(fotos) => setDados((d) => ({ ...d, fotos }))}
            aoTerminar={() => ir(3)}
          />
        )}
        {passo === 3 && (
          <PassoAvarias
            vistoriaId={dados.id}
            tipo={dados.tipo}
            iniciais={dados.avarias}
            daEntrada={dados.avariasEntrada}
            aoMudar={(avarias) => setDados((d) => ({ ...d, avarias }))}
            aoTerminar={() => ir(4)}
          />
        )}
        {passo === 4 && (
          <PassoPneus
            vistoriaId={dados.id}
            checklist={dados.checklist}
            iniciaisPneus={dados.pneus}
            iniciaisItens={dados.itens}
            observacoesIniciais={dados.observacoes}
            aoSalvar={(d) => {
              setDados((x) => ({ ...x, ...d }));
              ir(5);
            }}
          />
        )}
        {passo === 5 && (
          <PassoCliente
            dados={dados}
            assinatura={assinatura}
            aoAssinar={(a) => {
              setAssinatura(a);
              ir(6);
            }}
            irPara={ir}
          />
        )}
        {passo === 6 && <PassoOficina dados={dados} assinatura={assinatura} irPara={ir} />}
      </main>
    </>
  );
}
