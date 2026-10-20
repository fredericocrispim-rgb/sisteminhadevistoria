"use client";

import { useState } from "react";
import { ArrowRight, Hand, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BotaoPrincipal, Campo, DesenhoCarro, MensagemErroCampo, avisarComDesfazer, type MarcaAvaria } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { TIPOS_AVARIA, VISTAS, corDoTipo, nomeDaVista, nomeDoTipo, type VistaAvaria } from "@/lib/desenhos-carro";
import { cn } from "@/lib/utils";
import type { Avaria } from "./tipos";

type Pendente = { x: number; y: number; existente?: Avaria };

export function PassoAvarias({
  vistoriaId,
  veiculo,
  tipo,
  iniciais,
  daEntrada,
  aoMudar,
  aoTerminar,
}: {
  vistoriaId: string;
  veiculo: string;
  tipo: "ENTRADA" | "SAIDA";
  iniciais: Avaria[];
  daEntrada: Avaria[];
  aoMudar: (a: Avaria[]) => void;
  aoTerminar: () => void;
}) {
  const [vista, setVista] = useState<VistaAvaria>("lateral_esquerda");
  const [avarias, setAvarias] = useState<Avaria[]>(iniciais);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [tipoEscolhido, setTipoEscolhido] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();

  const atualizar = (lista: Avaria[]) => {
    setAvarias(lista);
    aoMudar(lista);
  };

  const marcas: MarcaAvaria[] = [
    ...daEntrada.filter((a) => a.vista === vista).map((a) => ({ id: `e-${a.id}`, numero: a.numero, x: a.x, y: a.y, tipo: a.tipo, antiga: true })),
    ...avarias.filter((a) => a.vista === vista).map((a) => ({ id: a.id, numero: a.numero, x: a.x, y: a.y, tipo: a.tipo })),
  ];

  function abrirNova(x: number, y: number) {
    setPendente({ x, y });
    setTipoEscolhido(null);
    setDescricao("");
    setErro(undefined);
  }

  function abrirExistente(m: MarcaAvaria) {
    const a = avarias.find((x) => x.id === m.id);
    if (!a) return;
    setPendente({ x: a.x, y: a.y, existente: a });
    setTipoEscolhido(a.tipo);
    setDescricao(a.descricao ?? "");
    setErro(undefined);
  }

  async function salvar() {
    if (!pendente || !tipoEscolhido) return setErro("Escolha o tipo");
    setSalvando(true);
    const supabase = criarClienteNavegador();
    if (pendente.existente) {
      const { error } = await supabase
        .from("vistoria_avarias")
        .update({ tipo: tipoEscolhido, descricao: descricao.trim() || null })
        .eq("id", pendente.existente.id);
      setSalvando(false);
      if (error) return setErro("Não salvou. Tente de novo.");
      atualizar(avarias.map((a) => (a.id === pendente.existente!.id ? { ...a, tipo: tipoEscolhido, descricao: descricao.trim() || null } : a)));
    } else {
      const numero = Math.max(0, ...avarias.map((a) => a.numero)) + 1;
      const nova = {
        vistoria_id: vistoriaId,
        numero,
        vista,
        x: pendente.x,
        y: pendente.y,
        tipo: tipoEscolhido,
        descricao: descricao.trim() || null,
        nova_na_saida: tipo === "SAIDA",
      };
      const { data, error } = await supabase.from("vistoria_avarias").insert(nova).select("id").single();
      setSalvando(false);
      if (error || !data) return setErro("Não salvou. Tente de novo.");
      atualizar([...avarias, { ...nova, id: data.id }]);
    }
    setPendente(null);
  }

  async function apagar(a: Avaria) {
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("vistoria_avarias").delete().eq("id", a.id);
    if (error) return setErro("Não apagou. Tente de novo.");
    const sem = avarias.filter((x) => x.id !== a.id);
    atualizar(sem);
    setPendente(null);
    avisarComDesfazer("Marcação apagada", async () => {
      const { numero, vista: v, x, y, tipo: t, descricao: d, nova_na_saida } = a;
      const { data } = await supabase
        .from("vistoria_avarias")
        .insert({ vistoria_id: vistoriaId, numero, vista: v, x, y, tipo: t, descricao: d, nova_na_saida })
        .select("id")
        .single();
      if (data) {
        const volta = [...sem, { ...a, id: data.id }];
        setAvarias(volta);
        aoMudar(volta);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Abas das vistas */}
      <div role="tablist" aria-label="Vista do carro" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {VISTAS.map((v) => {
          const qtd = avarias.filter((a) => a.vista === v.id).length;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={vista === v.id}
              onClick={() => setVista(v.id)}
              className={cn(
                "tocavel flex min-h-toque shrink-0 items-center gap-2 rounded-2xl px-4 text-base font-bold",
                vista === v.id ? "bg-foreground text-background" : "bg-superficie",
              )}
            >
              {v.nome}
              {qtd > 0 && <span className="grid size-6 place-items-center rounded-full bg-perigo text-sm text-white">{qtd}</span>}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-superficie p-3">
        <DesenhoCarro vista={vista} veiculo={veiculo} marcas={marcas} onToque={abrirNova} onMarca={abrirExistente} />
      </div>
      <p className="flex items-center justify-center gap-2 text-center text-lg font-bold text-muted-foreground">
        <Hand aria-hidden className="size-6" /> Toque onde tem risco ou amassado
      </p>
      {tipo === "SAIDA" && daEntrada.length > 0 && (
        <p className="text-center text-base text-muted-foreground">Em cinza: o que já tinha na chegada.</p>
      )}

      {avarias.length > 0 && (
        <ul className="flex flex-col gap-2">
          {avarias
            .slice()
            .sort((a, b) => a.numero - b.numero)
            .map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setVista(a.vista);
                    abrirExistente({ id: a.id, numero: a.numero, x: a.x, y: a.y, tipo: a.tipo });
                  }}
                  className="tocavel flex min-h-toque w-full items-center gap-3 rounded-2xl bg-superficie px-3 py-2 text-left"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ backgroundColor: corDoTipo(a.tipo) }}>
                    {a.numero}
                  </span>
                  <span className="flex-1 text-base">
                    <strong>{nomeDoTipo(a.tipo)}</strong> · {nomeDaVista(a.vista)}
                    {a.descricao ? ` · ${a.descricao}` : ""}
                  </span>
                  {tipo === "SAIDA" && <span className="rounded-full bg-perigo px-2 text-sm font-bold text-white">NOVA</span>}
                </button>
              </li>
            ))}
        </ul>
      )}

      {erro && !pendente && <MensagemErroCampo>{erro}</MensagemErroCampo>}

      {tipo === "SAIDA" && avarias.length > 0 && (
        <p className="rounded-2xl bg-perigo-clara px-4 py-3 text-lg font-extrabold text-perigo">
          Atenção: {avarias.length} {avarias.length === 1 ? "avaria nova encontrada" : "avarias novas encontradas"}
        </p>
      )}

      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />} onClick={aoTerminar}>
        {avarias.length > 0 ? "Próximo" : "Nenhum risco – Próximo"}
      </BotaoPrincipal>

      {/* Painel para escolher o tipo */}
      <Dialog open={Boolean(pendente)} onOpenChange={(aberto) => !aberto && setPendente(null)}>
        <DialogContent className="gap-4 rounded-3xl p-5 sm:max-w-md">
          <DialogTitle className="text-2xl font-extrabold">{pendente?.existente ? `Marcação ${pendente.existente.numero}` : "O que tem aqui?"}</DialogTitle>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_AVARIA.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTipoEscolhido(t.id);
                  setErro(undefined);
                }}
                aria-pressed={tipoEscolhido === t.id}
                className={cn(
                  "tocavel flex min-h-toque items-center gap-2 rounded-2xl px-3 text-lg font-bold",
                  tipoEscolhido === t.id ? "text-white" : "bg-superficie",
                )}
                style={tipoEscolhido === t.id ? { backgroundColor: t.cor } : undefined}
              >
                <span aria-hidden className="size-4 shrink-0 rounded-full border-2 border-white" style={{ backgroundColor: t.cor }} />
                {t.nome}
              </button>
            ))}
          </div>
          <Campo rotulo="Detalhe (se quiser)" placeholder="Ex.: porta do motorista" valor={descricao} onValor={setDescricao} />
          {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="tocavel min-h-toque-grande rounded-2xl bg-acao px-4 text-xl font-bold text-acao-texto disabled:opacity-60"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            {pendente?.existente && (
              <button
                type="button"
                onClick={() => apagar(pendente.existente!)}
                className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl px-4 text-lg font-bold text-perigo"
              >
                <Trash2 aria-hidden className="size-6" /> Apagar marcação
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
