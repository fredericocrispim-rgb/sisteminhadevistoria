"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Camera,
  CarFront,
  ChevronRight,
  ClipboardList,
  House,
  LayoutGrid,
  LogIn,
  LogOut,
  PencilLine,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import {
  AjudaRapida,
  AvisoSemInternet,
  BarraEtapas,
  BotaoGigante,
  BotaoModoSol,
  BotaoPrincipal,
  BotaoSecundario,
  CampoKm,
  CampoPlaca,
  CampoTelefone,
  Carregando,
  CartaoFoto,
  ConfirmacaoImportante,
  EstadoVazio,
  IconeChip,
  MedidorCombustivel,
  PagarPix,
  SeletorGrande,
  SilhuetaCarro,
  avisarComDesfazer,
  type EstadoFoto,
  type NivelCombustivel,
  type VistaFoto,
} from "@/components/vf";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { placaValida, telefoneValido } from "@/lib/formatos";
import { gerarPixCopiaECola } from "@/lib/pix";
import { TelaConcluida, TelaRiscos } from "./telas-extras";

const etapas = Object.values(textos.vistoria.etapas);

const telas = [
  { id: "inicio", nome: "Início" },
  { id: "fotos", nome: "Fotos" },
  { id: "riscos", nome: "Riscos" },
  { id: "pneus", nome: "Pneus" },
  { id: "concluida", nome: "Concluída" },
  { id: "pix", nome: "Pix" },
  { id: "pecas", nome: "Peças" },
] as const;
type IdTela = (typeof telas)[number]["id"];

/** Página interna: prévia das telas para aprovar o visual no celular. */
export function VitrineEstilo() {
  const [tela, setTela] = useState<IdTela>("inicio");
  // ?tela=fotos abre direto numa tela; ?foto=1 esconde a barra (para tirar os prints do site)
  const [semBarra, setSemBarra] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = telas.find((x) => x.id === q.get("tela"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê a URL só uma vez, depois de montar
    if (t) setTela(t.id);
    setSemBarra(q.get("foto") === "1");
  }, []);
  return (
    // Nesta vitrine os botões são só desenho: em vez de não fazer nada, avisam isso.
    <div
      className="contents"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest('a[href="#"]')) {
          e.preventDefault();
          toast("Isto é só uma prévia. O botão de verdade fica no Início, depois de entrar.");
        }
      }}
    >
      <nav aria-label="Prévia das telas" hidden={semBarra} className="sticky top-0 z-30 border-b border-foreground/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl gap-1 overflow-x-auto p-2">
          {telas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTela(t.id);
                window.scrollTo(0, 0);
              }}
              aria-pressed={tela === t.id}
              className={cn(
                "tocavel min-h-11 shrink-0 rounded-full px-4 text-base font-bold",
                tela === t.id ? "bg-oficina text-oficina-texto shadow-[0_8px_18px_-10px_rgb(37_99_235/0.9)]" : "text-muted-foreground hover:bg-superficie",
              )}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </nav>
      {tela === "inicio" && <TelaInicio />}
      {tela === "fotos" && <TelaFotos />}
      {tela === "pneus" && <TelaPneus />}
      {tela === "pix" && <TelaPix />}
      {tela === "riscos" && <TelaRiscos />}
      {tela === "concluida" && <TelaConcluida />}
      {tela === "pecas" && <TelaPecas />}
    </div>
  );
}

/* ---------- Tela inicial ---------- */

function TelaInicio() {
  return (
    <>
      <main className="entrar-tela mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 px-4 pt-4 pb-32">
        <header className="flex items-center gap-3 py-1">
          <div className="brilho grid size-12 place-items-center rounded-2xl bg-oficina text-xl font-extrabold text-oficina-texto">AS</div>
          <p className="text-xl leading-tight font-extrabold">Auto Center Silva</p>
        </header>

        <BotaoGigante href="#" cor="oficina" icone={<LogIn aria-hidden />}>
          {textos.vistoria.chegadaBotao}
        </BotaoGigante>
        <BotaoGigante href="#" cor="acao" icone={<LogOut aria-hidden />}>
          {textos.vistoria.entregaBotao}
        </BotaoGigante>

        <a href="#" className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-atencao-clara px-3 py-3 ring-1 ring-atencao/30">
          <IconeChip tom="atencao" className="bg-atencao">
            <PencilLine />
          </IconeChip>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-atencao-texto">{textos.vistoria.continuar}</span>
            <span className="block font-mono text-2xl font-extrabold tracking-wider">ABC1D23</span>
          </span>
          <ChevronRight aria-hidden className="size-7 shrink-0 text-atencao-texto" />
        </a>

        <a href="#" className="tocavel cartao flex min-h-toque-grande items-center gap-3 rounded-2xl px-3 py-3">
          <IconeChip tom="oficina">
            <CarFront />
          </IconeChip>
          <span className="flex-1 text-xl font-bold">{textos.menu.veiculosNoPatio}</span>
          <span className="grid min-w-10 place-items-center rounded-full bg-oficina px-3 py-1 text-lg font-extrabold text-oficina-texto tabular-nums">3</span>
          <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
        </a>
      </main>
      <MenuInferior />
    </>
  );
}

function MenuInferior() {
  const itens = [
    { nome: textos.menu.inicio, icone: House, ativo: true },
    { nome: textos.menu.vistorias, icone: ClipboardList },
    { nome: textos.menu.patio, icone: CarFront },
    { nome: textos.menu.mais, icone: LayoutGrid },
  ];
  return (
    <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <ul className="mx-auto grid max-w-xl grid-cols-4 gap-1 rounded-[1.75rem] bg-background/85 p-1.5 shadow-[0_18px_40px_-14px_rgb(15_23_42/0.35)] ring-1 ring-foreground/8 backdrop-blur-xl backdrop-saturate-150">
        {itens.map(({ nome, icone: Icone, ativo }) => (
          <li key={nome}>
            <a
              href="#"
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "tocavel flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-[1.35rem] text-sm font-bold",
                ativo ? "bg-oficina-clara text-oficina" : "text-muted-foreground",
              )}
            >
              <Icone aria-hidden className="size-6" strokeWidth={ativo ? 2.5 : 2} />
              {nome}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Fotos ---------- */

const fotos: { titulo: string; vista: VistaFoto; dica: string }[] = [
  { titulo: "Frente", vista: "frente", dica: "Fique 3 passos na frente do carro" },
  { titulo: "Traseira", vista: "traseira", dica: "Fique 3 passos atrás do carro" },
  { titulo: "Lado esquerdo", vista: "lateral-esquerda", dica: "Pegue o carro inteiro, de lado" },
  { titulo: "Lado direito", vista: "lateral-direita", dica: "Pegue o carro inteiro, de lado" },
  { titulo: "Painel", vista: "painel", dica: "Carro ligado. Mostre o km e o combustível" },
  { titulo: "Motor (capô aberto)", vista: "motor", dica: "Abra o capô. Mostre o motor todo" },
];

function TelaFotos() {
  const [estados, setEstados] = useState<EstadoFoto[]>(["ok", "ok", "enviando", "vazio", "vazio", "vazio"]);
  const atual = estados.findIndex((e) => e === "vazio");
  const foto = fotos[atual === -1 ? 0 : atual];
  const faltam = estados.filter((e) => e === "vazio").length;

  function tirar() {
    if (atual === -1) return;
    setEstados((s) => s.map((e, i) => (i === atual ? "ok" : e === "enviando" ? "ok" : e)));
  }

  return (
    <>
      <BarraEtapas
        etapas={etapas}
        atual={2}
        onVoltar={() => {}}
        ajuda={<AjudaRapida titulo={textos.vistoria.etapas.fotos} dica="Tire uma foto de cada vez. Siga o desenho." />}
      />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-2">
        {atual === -1 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-acao-clara p-6 text-center">
            <ThumbsUp aria-hidden className="size-14 text-acao" />
            <p className="text-2xl font-extrabold">Todas as fotos prontas</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-oficina-clara px-4 pt-6 pb-5 text-center">
            <SilhuetaCarro vista={foto.vista} className="w-4/5 text-oficina" />
            <p className="text-[1.75rem] leading-tight font-extrabold">{foto.titulo}</p>
            <p className="text-lg font-semibold text-muted-foreground">{foto.dica}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f, i) => (
            <CartaoFoto key={f.titulo} titulo={f.titulo} vista={f.vista} estado={estados[i]} atual={i === atual} />
          ))}
        </div>
        {faltam > 0 && <p className="text-center text-lg font-bold text-muted-foreground">{textos.fotos.faltam(faltam)}</p>}
      </main>
      {atual === -1 ? (
        <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />}>
          {textos.geral.proximo}
        </BotaoPrincipal>
      ) : (
        <BotaoPrincipal fixo icone={<Camera aria-hidden />} onClick={tirar}>
          {textos.fotos.tirarFoto}
        </BotaoPrincipal>
      )}
    </>
  );
}

/* ---------- Pneus ---------- */

type EstadoPneu = "bom" | "ruim" | "nao_tem";
const pneus = [
  textos.pneus.dianteiroEsquerdo,
  textos.pneus.dianteiroDireito,
  textos.pneus.traseiroEsquerdo,
  textos.pneus.traseiroDireito,
  textos.pneus.estepe,
];

function TelaPneus() {
  const [valores, setValores] = useState<(EstadoPneu | null)[]>([null, null, null, null, null]);
  const opcoes = [
    { valor: "bom" as const, rotulo: textos.estadoItem.bom, tom: "bom" as const, icone: <ThumbsUp aria-hidden /> },
    { valor: "ruim" as const, rotulo: textos.estadoItem.ruim, tom: "ruim" as const, icone: <ThumbsDown aria-hidden /> },
  ];
  return (
    <>
      <BarraEtapas etapas={etapas} atual={4} onVoltar={() => {}} ajuda={<AjudaRapida titulo="Pneus" dica="Toque em BOM ou RUIM para cada pneu." />} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-2">
        <BotaoSecundario icone={<ThumbsUp aria-hidden />} onClick={() => setValores((v) => v.map((x, i) => (i === 4 && x === "nao_tem" ? x : "bom")))}>
          {textos.pneus.todosBons}
        </BotaoSecundario>
        {pneus.map((nome, i) => (
          <SeletorGrande
            key={nome}
            rotulo={nome}
            valor={valores[i]}
            onChange={(v) => setValores((s) => s.map((x, j) => (j === i ? v : x)))}
            opcoes={i === 4 ? [...opcoes, { valor: "nao_tem" as const, rotulo: textos.estadoItem.ausente, tom: "neutro" as const }] : opcoes}
            colunas={i === 4 ? 3 : 2}
            compacto
          />
        ))}
      </main>
      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </>
  );
}

/* ---------- Pix ---------- */

function TelaPix() {
  const codigo = gerarPixCopiaECola({
    chave: "36365410000183",
    nome: "TUKA SOLUCOES",
    cidade: "GOIANIA",
    valor: 49.9,
    descricao: textos.produto.nome,
  });
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-5">
      <h1 className="text-[1.75rem] font-extrabold">{textos.menu.meuPlano}</h1>
      <PagarPix codigo={codigo} valor={49.9} descricao="Mensalidade" />
    </main>
  );
}

/* ---------- Peças soltas ---------- */

function TelaPecas() {
  const [placa, setPlaca] = useState("");
  const [telefone, setTelefone] = useState("");
  const [km, setKm] = useState("45.320");
  const [mostrarErros, setMostrarErros] = useState(false);
  const [combustivel, setCombustivel] = useState<NivelCombustivel | null>("1/2");
  const [itens, setItens] = useState(["Risco na porta", "Amassado no para-choque"]);
  const [confirmar, setConfirmar] = useState(false);

  const erroPlaca = mostrarErros ? (!placa ? textos.erros.placaFalta : !placaValida(placa) ? textos.erros.placaInvalida : undefined) : undefined;
  const erroTelefone = mostrarErros
    ? !telefone
      ? textos.erros.telefoneFalta
      : !telefoneValido(telefone)
        ? textos.erros.telefoneInvalido
        : undefined
    : undefined;

  function apagar(i: number) {
    const antes = itens;
    setItens(antes.filter((_, j) => j !== i));
    avisarComDesfazer(textos.desfazer.apagado, () => setItens(antes));
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-5">
      <BotaoModoSol />
      <CampoPlaca valor={placa} onValor={setPlaca} erro={erroPlaca} />
      <CampoTelefone valor={telefone} onValor={setTelefone} erro={erroTelefone} />
      <CampoKm valor={km} onValor={setKm} />
      <BotaoSecundario onClick={() => setMostrarErros(true)}>Testar erros</BotaoSecundario>
      <MedidorCombustivel valor={combustivel} onChange={setCombustivel} />

      <ul className="flex flex-col gap-2">
        {itens.map((o, i) => (
          <li key={o} className="cartao flex items-center gap-2 rounded-2xl py-1 pr-1 pl-4 text-lg font-semibold">
            <span className="flex-1">{o}</span>
            <button
              type="button"
              onClick={() => apagar(i)}
              className="tocavel inline-flex min-h-12 items-center gap-1.5 rounded-xl bg-perigo-clara px-3 font-bold text-perigo [&_svg]:size-5"
            >
              <Trash2 aria-hidden />
              Apagar
            </button>
          </li>
        ))}
      </ul>

      <BotaoSecundario onClick={() => setConfirmar(true)}>Testar: concluir</BotaoSecundario>
      <AvisoSemInternet forcar pendentes={3} />
      <EstadoVazio titulo={textos.vazio.nenhumaVistoria} texto={textos.vazio.nenhumaVistoriaAcao} />
      <Carregando linhas={1} />

      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        titulo={textos.confirmacao.concluirTitulo}
        texto={textos.confirmacao.concluirTexto}
        textoConfirmar={textos.confirmacao.concluirSim}
        onConfirmar={() => {}}
      />
    </main>
  );
}
