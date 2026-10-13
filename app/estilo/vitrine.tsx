"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Camera, Check, Send, Trash2, X } from "lucide-react";
import {
  AjudaRapida,
  AvisoSemInternet,
  BarraEtapas,
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
  MedidorCombustivel,
  MensagemErroCampo,
  SeletorGrande,
  avisarComDesfazer,
  type NivelCombustivel,
} from "@/components/vf";
import { textos } from "@/lib/textos";
import { placaValida, telefoneValido } from "@/lib/formatos";

const etapas = Object.values(textos.vistoria.etapas);

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border-[length:var(--borda)] bg-card p-4">
      <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

export function VitrineEstilo() {
  const [etapa, setEtapa] = useState(2);
  const [placa, setPlaca] = useState("");
  const [telefone, setTelefone] = useState("");
  const [km, setKm] = useState("45.320");
  const [mostrarErros, setMostrarErros] = useState(false);
  const [combustivel, setCombustivel] = useState<NivelCombustivel | null>("1/2");
  const [pneu, setPneu] = useState<"bom" | "ruim" | "ausente" | null>(null);
  const [item, setItem] = useState<"tem" | "nao_tem" | null>("tem");
  const [observacoes, setObservacoes] = useState(["Risco na porta do motorista", "Amassado no para-choque"]);
  const [confirmar, setConfirmar] = useState(false);
  const [excluir, setExcluir] = useState(false);

  const erroPlaca = mostrarErros ? (!placa ? textos.erros.placaFalta : !placaValida(placa) ? textos.erros.placaInvalida : undefined) : undefined;
  const erroTelefone = mostrarErros
    ? !telefone
      ? textos.erros.telefoneFalta
      : !telefoneValido(telefone)
        ? textos.erros.telefoneInvalido
        : undefined
    : undefined;

  function apagar(i: number) {
    const antes = observacoes;
    setObservacoes(antes.filter((_, j) => j !== i));
    avisarComDesfazer(textos.desfazer.apagado, () => setObservacoes(antes));
  }

  return (
    <>
      <BarraEtapas
        etapas={etapas}
        atual={etapa}
        onVoltar={() => setEtapa((e) => Math.max(1, e - 1))}
        ajuda={<AjudaRapida titulo={etapas[etapa - 1]} dica="Fique a 3 passos do carro e enquadre o carro inteiro na tela." videoUrl="https://www.youtube.com" />}
      />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-5">
        <div>
          <h1 className="text-2xl font-bold">Padrão visual</h1>
          <p className="text-lg text-muted-foreground">
            Todos os componentes do app. Abra no celular e toque em tudo com o polegar.
          </p>
        </div>

        <BotaoModoSol />

        <Secao titulo="Cores">
          <div className="grid grid-cols-2 gap-2 text-base font-semibold">
            <div className="rounded-xl bg-oficina p-3 text-oficina-texto">Cor da oficina</div>
            <div className="rounded-xl bg-acao p-3 text-acao-texto">Ação principal</div>
            <div className="rounded-xl bg-perigo p-3 text-white">Erro / avaria</div>
            <div className="rounded-xl bg-atencao-fundo p-3 text-atencao-texto ring-2 ring-atencao">Atenção</div>
          </div>
        </Secao>

        <Secao titulo="Barra de etapas">
          <p className="text-base">A barra está no topo da página. Toque em Avançar e Voltar para ver mudar.</p>
          <BotaoSecundario icone={<ArrowRight aria-hidden />} onClick={() => setEtapa((e) => Math.min(etapas.length, e + 1))}>
            Avançar etapa
          </BotaoSecundario>
        </Secao>

        <Secao titulo="Botões">
          <BotaoPrincipal icone={<Camera aria-hidden />}>{textos.fotos.tirarFoto}</BotaoPrincipal>
          <BotaoSecundario icone={<Send aria-hidden />}>{textos.vistoria.enviarCliente}</BotaoSecundario>
          <BotaoPrincipal carregando>Enviando</BotaoPrincipal>
        </Secao>

        <Secao titulo="Campos (teclado certo para cada um)">
          <CampoPlaca valor={placa} onValor={setPlaca} erro={erroPlaca} />
          <CampoTelefone valor={telefone} onValor={setTelefone} erro={erroTelefone} />
          <CampoKm valor={km} onValor={setKm} />
          <BotaoSecundario icone={<Check aria-hidden />} onClick={() => setMostrarErros(true)}>
            Conferir campos (ver erros)
          </BotaoSecundario>
          <MensagemErroCampo>Falta a foto da traseira</MensagemErroCampo>
        </Secao>

        <Secao titulo="Medidor de combustível">
          <MedidorCombustivel valor={combustivel} onChange={setCombustivel} />
        </Secao>

        <Secao titulo="Seletor grande">
          <SeletorGrande
            rotulo="Pneu dianteiro esquerdo"
            valor={pneu}
            onChange={setPneu}
            opcoes={[
              { valor: "bom", rotulo: textos.estadoItem.bom, tom: "bom" },
              { valor: "ruim", rotulo: textos.estadoItem.ruim, tom: "ruim" },
              { valor: "ausente", rotulo: textos.estadoItem.ausente, tom: "neutro" },
            ]}
          />
          <SeletorGrande
            rotulo="Extintor"
            valor={item}
            onChange={setItem}
            opcoes={[
              { valor: "tem", rotulo: textos.estadoItem.tem, tom: "bom", icone: <Check aria-hidden /> },
              { valor: "nao_tem", rotulo: textos.estadoItem.naoTem, tom: "ruim", icone: <X aria-hidden /> },
            ]}
          />
        </Secao>

        <Secao titulo="Cartões de foto">
          <div className="grid grid-cols-2 gap-3">
            <CartaoFoto numero={1} titulo="Frente" vista="frente" estado="vazio" obrigatoria />
            <CartaoFoto numero={2} titulo="Traseira" vista="traseira" estado="enviando" progresso={60} />
            <CartaoFoto numero={3} titulo="Lateral esquerda" vista="lateral-esquerda" estado="ok" />
            <CartaoFoto numero={4} titulo="Lateral direita" vista="lateral-direita" estado="erro" />
            <CartaoFoto numero={5} titulo="Diagonal dianteira" vista="diagonal-dianteira-esquerda" estado="aguardando" />
            <CartaoFoto numero={6} titulo="Diagonal traseira" vista="diagonal-traseira-direita" estado="vazio" obrigatoria />
            <CartaoFoto numero={7} titulo="Painel ligado" vista="painel" estado="vazio" obrigatoria />
            <CartaoFoto numero={8} titulo="Placa" vista="placa" estado="vazio" obrigatoria />
          </div>
        </Secao>

        <Secao titulo="Desfazer (aviso de 5 segundos)">
          <ul className="flex flex-col gap-2">
            {observacoes.map((o, i) => (
              <li key={o} className="flex items-center gap-2 rounded-xl border-[length:var(--borda)] border-input p-2 pl-4 text-base">
                <span className="flex-1">{o}</span>
                <button
                  type="button"
                  onClick={() => apagar(i)}
                  className="inline-flex min-h-toque items-center gap-1.5 rounded-lg px-3 font-semibold text-perigo hover:bg-perigo-fundo [&_svg]:size-5"
                >
                  <Trash2 aria-hidden />
                  Apagar
                </button>
              </li>
            ))}
            {observacoes.length === 0 && <li className="text-base text-muted-foreground">Lista vazia. Use o Desfazer no aviso.</li>}
          </ul>
        </Secao>

        <Secao titulo="Confirmação (só para o que não volta atrás)">
          <BotaoSecundario onClick={() => setConfirmar(true)}>Testar: concluir vistoria</BotaoSecundario>
          <BotaoSecundario onClick={() => setExcluir(true)}>Testar: excluir</BotaoSecundario>
        </Secao>

        <Secao titulo="Sem internet">
          <AvisoSemInternet forcar pendentes={3} />
        </Secao>

        <Secao titulo="Lista vazia">
          <EstadoVazio titulo={textos.vazio.nenhumaVistoria} texto={textos.vazio.nenhumaVistoriaAcao} />
        </Secao>

        <Secao titulo="Carregando">
          <Carregando linhas={2} />
        </Secao>

        <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />}>
          {textos.geral.proximo}
        </BotaoPrincipal>
      </main>

      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        titulo={textos.confirmacao.concluirTitulo}
        texto={textos.confirmacao.concluirTexto}
        textoConfirmar={textos.confirmacao.concluirSim}
        onConfirmar={() => {}}
      />
      <ConfirmacaoImportante
        aberto={excluir}
        onAberto={setExcluir}
        perigo
        titulo={textos.confirmacao.excluirTitulo}
        texto="Esta vistoria em rascunho será apagada."
        textoConfirmar={textos.confirmacao.excluirSim}
        onConfirmar={() => {}}
      />
    </>
  );
}
