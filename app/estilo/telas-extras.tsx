"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Eye, FileText, Hand, History, Home, Keyboard, Send } from "lucide-react";
import { ListaPatio } from "@/components/vf/lista-patio";
import type { CarroNoPatio } from "@/lib/patio";
import { AjudaRapida, BarraEtapas, BotaoPrincipal, BotaoSecundario, Campo, CampoPlaca, DesenhoCarro, SeletorGrande } from "@/components/vf";
import { CORES_CARRO } from "@/lib/vistoria";
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

/** Prévia: passo 1 – carro e cliente (já preenchido). */
export function TelaCarro({ entrega = false }: { entrega?: boolean }) {
  const marcas = ["Fiat", "Volkswagen", "Chevrolet", "Toyota", "Hyundai", "Outra"];
  const cores = CORES_CARRO.slice(0, 4);
  return (
    <>
      <BarraEtapas etapas={etapas} atual={1} onVoltar={() => {}} ajuda={<AjudaRapida titulo={etapas[0]} dica="Digite a placa." />} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-1 pb-32">
        <p className="-mt-1 text-base font-bold text-muted-foreground">{entrega ? "Entrega" : "Chegada"} · Carro</p>
        {entrega && (
          <div className="flex items-start gap-3 rounded-2xl bg-oficina-clara px-4 py-3 text-oficina">
            <History aria-hidden className="mt-0.5 size-7 shrink-0" />
            <p className="text-base font-bold">Chegou em 13/10/2026, 09:42 com 45.320 km e 1/2 de tanque.</p>
          </div>
        )}
        <CampoPlaca valor="ABC1D23" onValor={() => {}} />
        <SeletorGrande
          rotulo="Marca"
          valor="Chevrolet"
          onChange={() => {}}
          colunas={3}
          compacto
          opcoes={marcas.map((m) => ({ valor: m, rotulo: m }))}
        />
        <Campo rotulo="Modelo" valor="Onix" onValor={() => {}} />
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold">Cor</span>
          <div className="grid grid-cols-4 gap-2">
            {cores.map((cor) => (
              <span
                key={cor.nome}
                className={cn(
                  "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl text-sm font-bold",
                  cor.nome === "Prata" ? "bg-foreground text-background" : "bg-superficie",
                )}
              >
                <span aria-hidden className="size-7 rounded-full border-2 border-black/15" style={{ background: cor.hex }} />
                {cor.nome}
              </span>
            ))}
          </div>
        </div>
        <Campo rotulo="Nome do cliente" valor="João Pereira" onValor={() => {}} />
      </main>
      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </>
  );
}

/** Prévia: passo 6 – o cliente assina com o dedo. */
export function TelaAssina({ entrega = false }: { entrega?: boolean }) {
  return (
    <>
      <BarraEtapas etapas={etapas} atual={6} onVoltar={() => {}} ajuda={<AjudaRapida titulo="Assinatura" dica="O cliente assina com o dedo." />} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-2 pb-32">
        <p className="rounded-2xl bg-superficie px-4 py-3 text-lg">
          O cliente confirma que as fotos e as marcações mostram o estado do carro ao {entrega ? "retirar da" : "deixar na"} oficina.
        </p>
        <h2 className="text-xl font-extrabold">Assinatura do cliente</h2>
        <Campo rotulo="Nome de quem assina" valor="João Pereira" onValor={() => {}} />
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold">Cliente assina aqui</span>
          <div className="grid h-56 place-items-center rounded-2xl border-2 border-input bg-white">
            <svg viewBox="0 0 300 120" className="w-4/5" fill="none" stroke="#0b1220" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Assinatura">
              <path d="M18 78c10-30 22-52 30-50 9 2-6 52-2 56 5 5 18-40 28-38 8 2 0 30 6 31 7 1 12-22 20-21 7 1 2 19 9 19 9 0 14-26 25-25 9 1 1 22 10 22 12 0 20-30 32-28 10 2-4 26 6 26 14 0 24-24 38-22 12 2 20 8 34 4" />
              <path d="M40 98c60-6 140-8 230-12" strokeWidth="2.4" />
            </svg>
          </div>
        </div>
      </main>
      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </>
  );
}

const patio: CarroNoPatio[] = [
  { entradaId: "1", placa: "ABC1D23", descricao: "Chevrolet Onix", cliente: "João Pereira", chegouEm: "", dias: 0 },
  { entradaId: "2", placa: "QWE4R56", descricao: "Fiat Strada", cliente: "Marcos Lima", chegouEm: "", dias: 1 },
  { entradaId: "3", placa: "RTY7U89", descricao: "Volkswagen Gol", cliente: "Ana Souza", chegouEm: "", dias: 3 },
];

/** Prévia: ENTREGAR CARRO – escolher o carro do pátio. */
export function TelaSaida() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-4 pb-10">
      <span className="inline-flex min-h-toque items-center gap-1.5 self-start rounded-2xl px-2 text-lg font-bold">
        <ArrowLeft aria-hidden className="size-7" /> Voltar
      </span>
      <h1 className="text-[1.75rem] leading-tight font-extrabold">Qual carro vai sair?</h1>
      <ListaPatio carros={patio} />
      <BotaoSecundario icone={<Keyboard aria-hidden />}>O carro não está na lista</BotaoSecundario>
    </main>
  );
}
