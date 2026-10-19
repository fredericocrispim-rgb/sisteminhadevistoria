"use client";
/* eslint-disable @next/next/no-img-element -- assinatura já feita (imagem local) */

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Car, CheckCircle2, CircleDot, Lock, Pencil, ShieldAlert } from "lucide-react";
import {
  AssinaturaDedo,
  BotaoPrincipal,
  BotaoSecundario,
  CaixaMarcar,
  Campo,
  ConfirmacaoImportante,
  MensagemErroCampo,
  type AssinaturaRef,
} from "@/components/vf";
import { pegarLocalizacao } from "@/lib/foto";
import { FOTOS_OBRIGATORIAS, NOMES_COMBUSTIVEL, PNEUS } from "@/lib/vistoria";
import { textos } from "@/lib/textos";
import { concluirVistoria } from "../acoes";
import type { AssinaturaCliente, DadosVistoria } from "./tipos";

function Resumo({ icone, titulo, texto, onCorrigir }: { icone: ReactNode; titulo: string; texto: string; onCorrigir: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-superficie px-4 py-3 [&>svg]:size-7 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icone}
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-muted-foreground">{titulo}</p>
        <p className="text-lg leading-snug font-extrabold">{texto}</p>
      </div>
      <button type="button" onClick={onCorrigir} className="tocavel inline-flex min-h-toque items-center gap-1 rounded-xl px-2 text-base font-bold text-oficina">
        <Pencil aria-hidden className="size-5" /> Corrigir
      </button>
    </div>
  );
}

/** O que falta antes de assinar (fotos obrigatórias e pneus). */
function faltaAntes(dados: DadosVistoria) {
  const faltamFotos = FOTOS_OBRIGATORIAS.filter((f) => !dados.fotos.some((x) => x.categoria === f.categoria)).length;
  if (faltamFotos > 0) return `Faltam ${faltamFotos} fotos. Toque em Corrigir nas fotos.`;
  if (Object.keys(dados.pneus).length < 5) return "Falta marcar os pneus. Toque em Corrigir nos pneus.";
  return null;
}

/** Passo 5: o cliente confere o resumo e assina (ou marca que não está presente). */
export function PassoCliente({
  dados,
  assinatura,
  aoAssinar,
  irPara,
}: {
  dados: DadosVistoria;
  assinatura: AssinaturaCliente;
  aoAssinar: (a: AssinaturaCliente) => void;
  irPara: (passo: number) => void;
}) {
  const quadro = useRef<AssinaturaRef>(null);
  const [nome, setNome] = useState(assinatura.nome || dados.carro.clienteNome);
  const [ausente, setAusente] = useState(assinatura.ausente);
  const [motivo, setMotivo] = useState(assinatura.motivo);
  const [imagemAntiga, setImagemAntiga] = useState(assinatura.imagem); // assinatura feita antes de voltar
  const [assinou, setAssinou] = useState(false);
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();

  const chegada = dados.tipo === "ENTRADA";
  const c = dados.carro;
  const ruins = PNEUS.filter((p) => dados.pneus[p.posicao] === "ruim").length;
  const faltamFotos = FOTOS_OBRIGATORIAS.filter((f) => !dados.fotos.some((x) => x.categoria === f.categoria)).length;
  const extras = dados.fotos.length - (FOTOS_OBRIGATORIAS.length - faltamFotos);

  const temAssinatura = assinou || Boolean(imagemAntiga);
  const erroNome = conferir && !ausente && nome.trim().length < 2;
  const erroAssinatura = conferir && !ausente && !temAssinatura;
  const erroMotivo = conferir && ausente && motivo.trim().length < 3;

  function proximo() {
    setConferir(true);
    setErro(undefined);
    const falta = faltaAntes(dados);
    if (falta) return setErro(falta);
    if ((!ausente && (nome.trim().length < 2 || !temAssinatura)) || (ausente && motivo.trim().length < 3)) {
      requestAnimationFrame(() => document.querySelector("[data-erro=true]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    aoAssinar({
      nome: ausente ? "" : nome.trim(),
      imagem: ausente ? null : (quadro.current?.imagem() ?? imagemAntiga),
      ausente,
      motivo: ausente ? motivo.trim() : "",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Confira</h2>
        <Resumo
          icone={<Car aria-hidden />}
          titulo="Carro e cliente"
          texto={`${c.placa} · ${[c.marca, c.modelo].filter(Boolean).join(" ")} · ${c.km} km · ${c.combustivel ? NOMES_COMBUSTIVEL[c.combustivel] : ""}`}
          onCorrigir={() => irPara(1)}
        />
        <Resumo
          icone={<Camera aria-hidden />}
          titulo="Fotos"
          texto={faltamFotos ? `Faltam ${faltamFotos}` : `${FOTOS_OBRIGATORIAS.length} fotos prontas${extras > 0 ? ` + ${extras} extra` : ""}`}
          onCorrigir={() => irPara(2)}
        />
        <Resumo
          icone={<ShieldAlert aria-hidden />}
          titulo="Riscos e amassados"
          texto={dados.avarias.length ? `${dados.avarias.length} ${dados.avarias.length === 1 ? "marcação" : "marcações"}` : "Nenhum"}
          onCorrigir={() => irPara(3)}
        />
        <Resumo icone={<CircleDot aria-hidden />} titulo="Pneus" texto={ruins ? `${ruins} RUIM` : "Todos BONS"} onCorrigir={() => irPara(4)} />
      </section>

      <p className="rounded-2xl bg-superficie px-4 py-3 text-lg">
        {chegada
          ? "O cliente confirma que as fotos e as marcações mostram o estado do carro ao deixar na oficina."
          : "O cliente confirma que as fotos e as marcações mostram o estado do carro ao retirar da oficina."}
      </p>

      <section className="flex flex-col gap-4" data-erro={erroNome || erroAssinatura || erroMotivo || undefined}>
        <h2 className="text-xl font-extrabold">Assinatura do cliente</h2>
        {!ausente && (
          <>
            <Campo rotulo="Nome de quem assina" autoCapitalize="words" valor={nome} onValor={setNome} erro={erroNome ? "Coloque o nome" : undefined} />
            {imagemAntiga ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-lg font-bold text-acao">
                  <CheckCircle2 aria-hidden className="size-6" /> Cliente já assinou
                </div>
                <img src={imagemAntiga} alt="Assinatura do cliente" className="h-48 w-full rounded-2xl border-2 border-input bg-white object-contain" />
                <BotaoSecundario icone={<Pencil aria-hidden />} onClick={() => setImagemAntiga(null)}>
                  Assinar de novo
                </BotaoSecundario>
              </div>
            ) : (
              <>
                <AssinaturaDedo ref={quadro} rotulo="Cliente assina aqui" erro={erroAssinatura} onMudou={setAssinou} />
                {erroAssinatura && <MensagemErroCampo>Falta a assinatura do cliente</MensagemErroCampo>}
              </>
            )}
          </>
        )}
        <CaixaMarcar
          marcado={ausente}
          onChange={(v) => {
            setAusente(v);
            setAssinou(false); // o quadro de assinatura some/volta vazio
          }}
        >
          Cliente não está presente
        </CaixaMarcar>
        {ausente && <Campo rotulo="Por quê?" placeholder="Ex.: carro chegou de guincho" valor={motivo} onValor={setMotivo} erro={erroMotivo ? "Explique o motivo" : undefined} />}
      </section>

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}

      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />} onClick={proximo}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </div>
  );
}

/** Passo 6: quem é da oficina assina e conclui a vistoria. */
export function PassoOficina({
  dados,
  assinatura,
  irPara,
}: {
  dados: DadosVistoria;
  assinatura: AssinaturaCliente;
  irPara: (passo: number) => void;
}) {
  const router = useRouter();
  const quadro = useRef<AssinaturaRef>(null);
  const [assinou, setAssinou] = useState(false);
  const [conferir, setConferir] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();

  const chegada = dados.tipo === "ENTRADA";
  const clientePronto = assinatura.ausente ? assinatura.motivo.length >= 3 : Boolean(assinatura.imagem && assinatura.nome);
  const erroAssinatura = conferir && !assinou;

  function pedirConclusao() {
    setConferir(true);
    setErro(undefined);
    const falta = faltaAntes(dados);
    if (falta) return setErro(falta);
    if (!clientePronto) return setErro("Falta a assinatura do cliente. Toque em Voltar.");
    if (!assinou) return;
    setConfirmar(true);
  }

  async function concluir() {
    setCarregando(true);
    const local = await pegarLocalizacao();
    const r = await concluirVistoria({
      vistoriaId: dados.id,
      nomeAssinante: assinatura.ausente ? "" : assinatura.nome,
      assinaturaCliente: assinatura.ausente ? null : assinatura.imagem,
      clienteAusente: assinatura.ausente ? assinatura.motivo : null,
      assinaturaResponsavel: quadro.current?.imagem() ?? "",
      latitude: local?.latitude ?? null,
      longitude: local?.longitude ?? null,
    });
    if (!r.ok) {
      setCarregando(false);
      return setErro(r.erro);
    }
    router.replace(`/vistorias/${dados.id}/pronto`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => irPara(5)}
        className="tocavel flex min-h-toque items-center gap-3 rounded-2xl bg-superficie px-4 py-3 text-left"
      >
        <CheckCircle2 aria-hidden className={clientePronto ? "size-7 shrink-0 text-acao" : "size-7 shrink-0 text-perigo"} />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-muted-foreground">Cliente</span>
          <span className="block truncate text-lg font-extrabold">
            {!clientePronto ? "Falta assinar" : assinatura.ausente ? "Não está presente" : `${assinatura.nome} assinou`}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-base font-bold text-oficina">
          <Pencil aria-hidden className="size-5" /> Corrigir
        </span>
      </button>

      <section className="flex flex-col gap-2" data-erro={erroAssinatura || undefined}>
        <h2 className="text-xl font-extrabold">{chegada ? "Recebido por" : "Entregue por"}</h2>
        <p className="text-lg font-semibold">{dados.responsavel}</p>
        <AssinaturaDedo ref={quadro} rotulo="Sua assinatura" erro={erroAssinatura} onMudou={setAssinou} />
        {erroAssinatura && <MensagemErroCampo>Falta a sua assinatura</MensagemErroCampo>}
      </section>

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}

      <BotaoPrincipal fixo carregando={carregando} icone={<Lock aria-hidden />} onClick={pedirConclusao}>
        {textos.vistoria.concluir}
      </BotaoPrincipal>

      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        titulo="Concluir a vistoria?"
        texto="Depois de concluir, não dá para mudar. O termo em PDF será criado."
        textoConfirmar="Sim, concluir"
        onConfirmar={concluir}
      />
    </div>
  );
}
