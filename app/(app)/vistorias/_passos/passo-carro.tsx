"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, History } from "lucide-react";
import {
  BotaoPrincipal,
  Campo,
  CampoKm,
  CampoPlaca,
  CampoTelefone,
  MedidorCombustivel,
  MensagemErroCampo,
  SeletorGrande,
} from "@/components/vf";
import { formatarKm, formatarPlaca, kmParaNumero, placaValida, telefoneValido } from "@/lib/formatos";
import { CORES_CARRO, EXEMPLO_MODELO, MARCAS_POR_TIPO, NOMES_COMBUSTIVEL, dataHoraBR, type TipoVeiculo } from "@/lib/vistoria";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { buscarPorPlaca, salvarCarroCliente } from "../acoes";
import type { DadosCarro, InfoEntrada } from "./tipos";

const RASCUNHO = "vf-vistoria-carro";

export function PassoCarro({
  vistoriaId,
  tipo,
  tipoVeiculo,
  inicial,
  entrada,
  aoSalvar,
}: {
  vistoriaId: string | null;
  tipo: "ENTRADA" | "SAIDA";
  tipoVeiculo: TipoVeiculo;
  inicial: DadosCarro;
  entrada: InfoEntrada;
  aoSalvar: (id: string, dados: DadosCarro) => void;
}) {
  const MARCAS_COMUNS = MARCAS_POR_TIPO[tipoVeiculo];
  const [c, setC] = useState<DadosCarro>(() => {
    if (vistoriaId || inicial.placa) return inicial;
    try {
      return { ...inicial, ...JSON.parse(localStorage.getItem(`${RASCUNHO}-${tipo}-${tipoVeiculo}`) ?? "{}") };
    } catch {
      return inicial;
    }
  });
  const [conhecido, setConhecido] = useState(false);
  const [ultimoKm, setUltimoKm] = useState<number | null>(entrada?.km ?? null);
  const [outraMarca, setOutraMarca] = useState(Boolean(inicial.marca && !MARCAS_COMUNS.includes(inicial.marca)));
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);
  const placaBuscada = useRef(inicial.placa);

  const muda = (p: Partial<DadosCarro>) => setC((a) => ({ ...a, ...p }));

  // Salva no aparelho enquanto preenche (só na vistoria nova, ainda sem número)
  useEffect(() => {
    if (vistoriaId) return;
    try {
      localStorage.setItem(`${RASCUNHO}-${tipo}-${tipoVeiculo}`, JSON.stringify(c));
    } catch {}
  }, [c, vistoriaId, tipo, tipoVeiculo]);

  // Placa completa → já conhecemos este carro?
  useEffect(() => {
    if (!placaValida(c.placa) || placaBuscada.current === c.placa) return;
    placaBuscada.current = c.placa;
    buscarPorPlaca(c.placa).then((r) => {
      if (!r) return setConhecido(false);
      setConhecido(true);
      setUltimoKm((k) => k ?? r.ultimoKm);
      if (r.marca && !MARCAS_COMUNS.includes(r.marca)) setOutraMarca(true);
      setC((a) => ({
        ...a,
        marca: a.marca || r.marca,
        modelo: a.modelo || r.modelo,
        cor: a.cor || r.cor,
        clienteNome: a.clienteNome || r.clienteNome,
        clienteWhatsapp: a.clienteWhatsapp || r.clienteWhatsapp,
      }));
    });
  }, [c.placa, MARCAS_COMUNS]);

  const km = kmParaNumero(c.km);
  const erros = {
    placa: conferir && !placaValida(c.placa) ? (c.placa ? textos.erros.placaInvalida : textos.erros.placaFalta) : undefined,
    marca: conferir && !c.marca,
    cor: conferir && !c.cor,
    km: conferir && km === null ? textos.erros.kmFalta : undefined,
    combustivel: conferir && !c.combustivel,
    clienteNome: conferir && c.clienteNome.trim().length < 2 ? "Coloque o nome do cliente" : undefined,
    clienteWhatsapp: conferir && !telefoneValido(c.clienteWhatsapp) ? (c.clienteWhatsapp ? textos.erros.telefoneInvalido : textos.erros.telefoneFalta) : undefined,
  };
  const temErro = Object.values(erros).some(Boolean);

  async function continuar() {
    setConferir(true);
    const invalido =
      !placaValida(c.placa) || !c.marca || !c.cor || km === null || !c.combustivel || c.clienteNome.trim().length < 2 || !telefoneValido(c.clienteWhatsapp);
    if (invalido) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setCarregando(true);
    setErro(undefined);
    const r = await salvarCarroCliente({ vistoriaId, tipo, tipoVeiculo, entradaId: entrada?.id ?? null, ...c, combustivel: c.combustivel! });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    try {
      localStorage.removeItem(`${RASCUNHO}-${tipo}-${tipoVeiculo}`);
    } catch {}
    aoSalvar(r.id, c);
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        continuar();
      }}
    >
      {entrada && (
        <div className="flex items-start gap-3 rounded-2xl bg-oficina-clara px-4 py-3 text-oficina">
          <History aria-hidden className="mt-0.5 size-7 shrink-0" />
          <p className="text-base font-bold">
            Chegou em {dataHoraBR(entrada.data)}
            {entrada.km != null ? ` com ${entrada.km.toLocaleString("pt-BR")} km` : ""}
            {entrada.combustivel ? ` e ${NOMES_COMBUSTIVEL[entrada.combustivel]} de tanque` : ""}.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <CampoPlaca valor={c.placa} onValor={(v) => muda({ placa: formatarPlaca(v) })} erro={erros.placa} autoFocus={!c.placa} />
        {conhecido && (
          <p className="flex items-center gap-2 rounded-2xl bg-acao-clara px-4 py-3 text-base font-bold text-acao">
            <Check aria-hidden className="size-6" /> Já conhecemos este veículo. Confira os dados.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SeletorGrande
          rotulo="Marca"
          valor={outraMarca ? "Outra" : MARCAS_COMUNS.includes(c.marca) ? c.marca : null}
          onChange={(v) => {
            if (v === "Outra") {
              setOutraMarca(true);
              muda({ marca: "" });
            } else {
              setOutraMarca(false);
              muda({ marca: v });
            }
          }}
          colunas={3}
          compacto
          erro={erros.marca}
          opcoes={[...MARCAS_COMUNS, "Outra"].map((m) => ({ valor: m, rotulo: m }))}
        />
        {outraMarca && <Campo rotulo="Qual marca?" autoCapitalize="words" valor={c.marca} onValor={(v) => muda({ marca: v })} />}
        {erros.marca && <MensagemErroCampo>Escolha a marca</MensagemErroCampo>}
      </div>

      <Campo rotulo="Modelo" dica={EXEMPLO_MODELO[tipoVeiculo]} autoCapitalize="words" valor={c.modelo} onValor={(v) => muda({ modelo: v })} />

      <div className="flex flex-col gap-2">
        <span className="text-lg font-bold">Cor</span>
        <div role="radiogroup" aria-label="Cor" aria-invalid={erros.cor || undefined} className={cn("grid grid-cols-4 gap-2", erros.cor && "rounded-2xl ring-2 ring-perigo")}>
          {CORES_CARRO.map((cor) => {
            const marcado = c.cor === cor.nome;
            return (
              <button
                key={cor.nome}
                type="button"
                role="radio"
                aria-checked={marcado}
                onClick={() => muda({ cor: cor.nome })}
                className={cn(
                  "tocavel flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl text-sm font-bold",
                  marcado ? "bg-foreground text-background" : "bg-superficie",
                )}
              >
                <span
                  aria-hidden
                  className="size-7 rounded-full border-2 border-black/15"
                  style={{ background: cor.hex || "conic-gradient(#c81e1e, #eab308, #15803d, #1d4ed8, #c81e1e)" }}
                />
                {cor.nome}
              </button>
            );
          })}
        </div>
        {erros.cor && <MensagemErroCampo>Escolha a cor</MensagemErroCampo>}
      </div>

      <div className="flex flex-col gap-2">
        <CampoKm valor={c.km} onValor={(v) => muda({ km: formatarKm(v) })} erro={erros.km} />
        {km !== null && ultimoKm !== null && km < ultimoKm && (
          <p className="rounded-2xl bg-atencao-clara px-4 py-3 text-base font-bold text-atencao-texto">
            Atenção: menor que o último registro ({ultimoKm.toLocaleString("pt-BR")} km). Confira.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <MedidorCombustivel valor={c.combustivel} onChange={(v) => muda({ combustivel: v })} erro={erros.combustivel} />
        {erros.combustivel && <MensagemErroCampo>Marque o combustível</MensagemErroCampo>}
      </div>

      <Campo rotulo="Nome do cliente" autoCapitalize="words" autoComplete="off" valor={c.clienteNome} onValor={(v) => muda({ clienteNome: v })} erro={erros.clienteNome} />
      <CampoTelefone valor={c.clienteWhatsapp} onValor={(v) => muda({ clienteWhatsapp: v })} erro={erros.clienteWhatsapp} />

      {tipo === "ENTRADA" && (
        <div className="flex flex-col gap-4">
          <SeletorGrande
            rotulo="Chegou de guincho?"
            valor={c.chegouGuincho ? "sim" : "nao"}
            onChange={(v) => muda({ chegouGuincho: v === "sim" })}
            compacto
            opcoes={[
              { valor: "nao", rotulo: textos.geral.nao },
              { valor: "sim", rotulo: textos.geral.sim },
            ]}
          />
          {c.chegouGuincho && (
            <>
              <Campo
                rotulo="Placa do guincho"
                autoCapitalize="characters"
                maxLength={8}
                valor={c.placaGuincho}
                onValor={(v) => muda({ placaGuincho: formatarPlaca(v) })}
              />
              <Campo rotulo="Nome do motorista do guincho" autoCapitalize="words" valor={c.prestadorGuincho} onValor={(v) => muda({ prestadorGuincho: v })} />
            </>
          )}
        </div>
      )}

      {temErro && conferir && <MensagemErroCampo>Falta preencher o que está em vermelho</MensagemErroCampo>}
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo type="submit" carregando={carregando} icone={<ArrowRight aria-hidden />}>
        {textos.geral.proximo}
      </BotaoPrincipal>
    </form>
  );
}
