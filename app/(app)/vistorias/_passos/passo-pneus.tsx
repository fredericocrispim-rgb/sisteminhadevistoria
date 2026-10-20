"use client";

import { useState } from "react";
import { ArrowRight, Check, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { pneusDoVeiculo, type EstadoPneu } from "@/lib/vistoria";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { salvarPneusItens } from "../acoes";

export function PassoPneus({
  vistoriaId,
  veiculo,
  checklist,
  iniciaisPneus,
  iniciaisItens,
  observacoesIniciais,
  aoSalvar,
}: {
  vistoriaId: string;
  veiculo: string;
  checklist: string[];
  iniciaisPneus: Record<string, EstadoPneu>;
  iniciaisItens: Record<string, boolean>;
  observacoesIniciais: string;
  aoSalvar: (d: { pneus: Record<string, EstadoPneu>; itens: Record<string, boolean>; observacoes: string }) => void;
}) {
  const PNEUS = pneusDoVeiculo(veiculo);
  const [pneus, setPneus] = useState<Record<string, EstadoPneu>>(iniciaisPneus);
  const [itens, setItens] = useState<Record<string, boolean>>(iniciaisItens);
  const [observacoes, setObservacoes] = useState(observacoesIniciais);
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  const faltaPneu = PNEUS.find((p) => !pneus[p.posicao]);
  const faltaItem = checklist.find((i) => itens[i] === undefined);

  async function continuar() {
    setConferir(true);
    if (faltaPneu || faltaItem) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true], [data-erro=true]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setCarregando(true);
    setErro(undefined);
    const r = await salvarPneusItens({
      vistoriaId,
      pneus: PNEUS.map((p) => ({ posicao: p.posicao, estado: pneus[p.posicao] })),
      itens: checklist.map((nome) => ({ nome, tem: itens[nome] })),
      observacoes,
    });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    aoSalvar({ pneus, itens, observacoes });
  }

  const opcoesPneu = [
    { valor: "bom" as const, rotulo: textos.estadoItem.bom, tom: "bom" as const, icone: <ThumbsUp aria-hidden /> },
    { valor: "ruim" as const, rotulo: textos.estadoItem.ruim, tom: "ruim" as const, icone: <ThumbsDown aria-hidden /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold">Pneus</h2>
        <BotaoSecundario
          icone={<ThumbsUp aria-hidden />}
          onClick={() => setPneus(Object.fromEntries(PNEUS.map((p) => [p.posicao, p.posicao === "estepe" && pneus.estepe === "ausente" ? "ausente" : "bom"])))}
        >
          {textos.pneus.todosBons}
        </BotaoSecundario>
        {PNEUS.map((p) => (
          <SeletorGrande
            key={p.posicao}
            rotulo={p.nome}
            valor={pneus[p.posicao] ?? null}
            onChange={(v) => setPneus((s) => ({ ...s, [p.posicao]: v }))}
            colunas={p.posicao === "estepe" ? 3 : 2}
            compacto
            erro={conferir && !pneus[p.posicao]}
            opcoes={p.posicao === "estepe" ? [...opcoesPneu, { valor: "ausente" as const, rotulo: textos.estadoItem.ausente, tom: "neutro" as const }] : opcoesPneu}
          />
        ))}
      </section>

      {checklist.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">Itens do carro</h2>
          <BotaoSecundario icone={<Check aria-hidden />} onClick={() => setItens(Object.fromEntries(checklist.map((i) => [i, true])))}>
            Tem tudo
          </BotaoSecundario>
          <ul className="flex flex-col gap-2">
            {checklist.map((nome) => {
              const valor = itens[nome];
              const faltando = conferir && valor === undefined;
              return (
                <li key={nome} data-erro={faltando || undefined} className={cn("flex items-center gap-2 rounded-2xl bg-superficie py-1.5 pr-1.5 pl-4", faltando && "ring-2 ring-perigo")}>
                  <span className="flex-1 text-lg font-bold">{nome}</span>
                  <div role="radiogroup" aria-label={nome} className="flex gap-1.5">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={valor === true}
                      onClick={() => setItens((s) => ({ ...s, [nome]: true }))}
                      className={cn("tocavel inline-flex min-h-toque min-w-20 items-center justify-center gap-1 rounded-xl px-2 text-base font-extrabold", valor === true ? "bg-acao text-acao-texto" : "bg-background")}
                    >
                      <Check aria-hidden className="size-5" /> TEM
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={valor === false}
                      onClick={() => setItens((s) => ({ ...s, [nome]: false }))}
                      className={cn("tocavel inline-flex min-h-toque min-w-24 items-center justify-center gap-1 rounded-xl px-2 text-base font-extrabold", valor === false ? "bg-perigo text-white" : "bg-background")}
                    >
                      <X aria-hidden className="size-5" /> NÃO TEM
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <label htmlFor="observacoes" className="text-xl font-extrabold">
          Observações
        </label>
        <p className="text-base text-muted-foreground">Objetos deixados no carro, avisos, etc. Pode usar o microfone do teclado.</p>
        <textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={4}
          maxLength={4000}
          className="w-full rounded-2xl border-2 border-transparent bg-superficie px-4 py-3 text-lg outline-none focus:border-oficina focus:bg-background"
        />
      </section>

      {conferir && faltaPneu && <MensagemErroCampo>Falta marcar o pneu: {faltaPneu.nome}</MensagemErroCampo>}
      {conferir && !faltaPneu && faltaItem && <MensagemErroCampo>Falta marcar: {faltaItem}</MensagemErroCampo>}
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo carregando={carregando} icone={<ArrowRight aria-hidden />} onClick={continuar}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </div>
  );
}
