"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Camera, Car, CircleDot, Lock, Pencil, ShieldAlert } from "lucide-react";
import {
  AssinaturaDedo,
  BotaoPrincipal,
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
import type { DadosVistoria } from "./tipos";

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

export function PassoAssinar({ dados, irPara }: { dados: DadosVistoria; irPara: (passo: number) => void }) {
  const router = useRouter();
  const cliente = useRef<AssinaturaRef>(null);
  const responsavel = useRef<AssinaturaRef>(null);
  const [nome, setNome] = useState(dados.carro.clienteNome);
  const [ausente, setAusente] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [assinouCliente, setAssinouCliente] = useState(false);
  const [assinouResp, setAssinouResp] = useState(false);
  const [conferir, setConferir] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();

  const chegada = dados.tipo === "ENTRADA";
  const c = dados.carro;
  const ruins = PNEUS.filter((p) => dados.pneus[p.posicao] === "ruim").length;
  const faltamFotos = FOTOS_OBRIGATORIAS.filter((f) => !dados.fotos.some((x) => x.categoria === f.categoria)).length;

  const erroCliente = conferir && !ausente && (!assinouCliente || nome.trim().length < 2);
  const erroMotivo = conferir && ausente && motivo.trim().length < 3;
  const erroResp = conferir && !assinouResp;

  function pedirConclusao() {
    setConferir(true);
    setErro(undefined);
    if (faltamFotos > 0) return setErro(`Faltam ${faltamFotos} fotos. Toque em Corrigir nas fotos.`);
    if (Object.keys(dados.pneus).length < 5) return setErro("Falta marcar os pneus. Toque em Corrigir nos pneus.");
    if ((!ausente && (!assinouCliente || nome.trim().length < 2)) || (ausente && motivo.trim().length < 3) || !assinouResp) {
      requestAnimationFrame(() => document.querySelector("[data-erro=true]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setConfirmar(true);
  }

  async function concluir() {
    setCarregando(true);
    const local = await pegarLocalizacao();
    const r = await concluirVistoria({
      vistoriaId: dados.id,
      nomeAssinante: ausente ? "" : nome,
      assinaturaCliente: ausente ? null : cliente.current?.imagem(),
      clienteAusente: ausente ? motivo : null,
      assinaturaResponsavel: responsavel.current?.imagem() ?? "",
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
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Confira</h2>
        <Resumo
          icone={<Car aria-hidden />}
          titulo="Carro e cliente"
          texto={`${c.placa} · ${[c.marca, c.modelo].filter(Boolean).join(" ")} · ${c.km} km · ${c.combustivel ? NOMES_COMBUSTIVEL[c.combustivel] : ""}`}
          onCorrigir={() => irPara(1)}
        />
        <Resumo icone={<Camera aria-hidden />} titulo="Fotos" texto={faltamFotos ? `Faltam ${faltamFotos}` : `${FOTOS_OBRIGATORIAS.length} fotos prontas`} onCorrigir={() => irPara(2)} />
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

      <section className="flex flex-col gap-4" data-erro={erroCliente || erroMotivo || undefined}>
        <h2 className="text-xl font-extrabold">Cliente</h2>
        {!ausente && (
          <>
            <Campo rotulo="Nome de quem assina" autoCapitalize="words" valor={nome} onValor={setNome} erro={conferir && nome.trim().length < 2 ? "Coloque o nome" : undefined} />
            <AssinaturaDedo ref={cliente} rotulo="Assinatura do cliente" erro={erroCliente} onMudou={setAssinouCliente} />
            {erroCliente && assinouCliente === false && <MensagemErroCampo>Falta a assinatura do cliente</MensagemErroCampo>}
          </>
        )}
        <CaixaMarcar
          marcado={ausente}
          onChange={(v) => {
            setAusente(v);
            setAssinouCliente(false); // o quadro de assinatura some/volta vazio
          }}
        >
          Cliente não está presente
        </CaixaMarcar>
        {ausente && <Campo rotulo="Por quê?" placeholder="Ex.: carro chegou de guincho" valor={motivo} onValor={setMotivo} erro={erroMotivo ? "Explique o motivo" : undefined} />}
      </section>

      <section className="flex flex-col gap-2" data-erro={erroResp || undefined}>
        <h2 className="text-xl font-extrabold">{chegada ? "Recebido por" : "Entregue por"}</h2>
        <p className="text-lg font-semibold">{dados.responsavel}</p>
        <AssinaturaDedo ref={responsavel} rotulo="Sua assinatura" erro={erroResp} onMudou={setAssinouResp} />
        {erroResp && <MensagemErroCampo>Falta a sua assinatura</MensagemErroCampo>}
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
