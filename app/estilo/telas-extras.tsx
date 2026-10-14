"use client";

import { ArrowRight, CheckCircle2, Eye, FileText, Hand, Home, Send } from "lucide-react";
import { AjudaRapida, BarraEtapas, BotaoPrincipal, BotaoSecundario, DesenhoCarro } from "@/components/vf";
import { VISTAS, corDoTipo, nomeDaVista, nomeDoTipo } from "@/lib/desenhos-carro";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

const etapas = Object.values(textos.vistoria.etapas);

const exemplo = [
  { id: "1", numero: 1, vista: "lateral_esquerda" as const, x: 38, y: 58, tipo: "risco", descricao: "Porta do motorista" },
  { id: "2", numero: 2, vista: "lateral_esquerda" as const, x: 82, y: 62, tipo: "amassado", descricao: "Para-lama traseiro" },
];

/** Prévia: passo 3 – riscos e amassados (tocar no desenho). */
export function TelaRiscos() {
  return (
    <>
      <BarraEtapas etapas={etapas} atual={3} onVoltar={() => {}} ajuda={<AjudaRapida titulo="Riscos" dica="Toque no desenho onde tem risco ou amassado." />} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {VISTAS.map((v, i) => (
            <span
              key={v.id}
              className={cn(
                "flex min-h-toque shrink-0 items-center gap-2 rounded-2xl px-4 text-base font-bold",
                i === 0 ? "bg-foreground text-background" : "bg-superficie",
              )}
            >
              {v.nome}
              {i === 0 && <span className="grid size-6 place-items-center rounded-full bg-perigo text-sm text-white">2</span>}
            </span>
          ))}
        </div>
        <div className="rounded-3xl bg-superficie p-3">
          <DesenhoCarro vista="lateral_esquerda" marcas={exemplo} />
        </div>
        <p className="flex items-center justify-center gap-2 text-center text-lg font-bold text-muted-foreground">
          <Hand aria-hidden className="size-6" /> Toque onde tem risco ou amassado
        </p>
        <ul className="flex flex-col gap-2">
          {exemplo.map((a) => (
            <li key={a.id} className="flex min-h-toque items-center gap-3 rounded-2xl bg-superficie px-3 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ backgroundColor: corDoTipo(a.tipo) }}>
                {a.numero}
              </span>
              <span className="flex-1 text-base">
                <strong>{nomeDoTipo(a.tipo)}</strong> · {nomeDaVista(a.vista)} · {a.descricao}
              </span>
            </li>
          ))}
        </ul>
      </main>
      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </>
  );
}

/** Prévia: vistoria concluída, pronta para mandar ao cliente. */
export function TelaConcluida() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-4 px-4 pt-10 text-center">
      <CheckCircle2 aria-hidden className="size-24 text-acao" />
      <h1 className="text-[2rem] leading-tight font-extrabold">Vistoria concluída</h1>
      <p className="font-mono text-3xl font-extrabold tracking-wider">ABC1D23</p>
      <p className="text-lg text-muted-foreground">
        Nº 128 · 13/10/2026, 09:42
        <br />
        Código SV-7K3P-9Q2X
      </p>
      <div className="mt-4 flex w-full flex-col gap-3">
        <BotaoSecundario icone={<FileText aria-hidden />}>Ver termo (PDF)</BotaoSecundario>
        <BotaoSecundario icone={<Eye aria-hidden />}>Ver como o cliente vê</BotaoSecundario>
        <BotaoSecundario icone={<Home aria-hidden />} className="bg-transparent">
          Voltar ao início
        </BotaoSecundario>
      </div>
      <BotaoPrincipal fixo icone={<Send aria-hidden />}>
        Enviar para o cliente
      </BotaoPrincipal>
    </main>
  );
}
