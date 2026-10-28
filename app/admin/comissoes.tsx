"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, BadgeCheck, Copy, Download, MessageCircle, Pencil, Plus, Undo2, UserCheck, UserX } from "lucide-react";
import { ConfirmacaoImportante } from "@/components/vf";
import { cn } from "@/lib/utils";
import { formatarReais } from "@/lib/pix";
import { formatarTelefone, telefoneParaWhatsapp } from "@/lib/formatos";
import {
  csvComissoes,
  filtrarComissoes,
  mesDe,
  mesesComComissao,
  nomeMes,
  somaComissoes,
  textoExtratoVendedor,
  type Comissao,
  type FiltroComissoes,
} from "@/lib/comissao";
import { marcarComissoes, mudarVendedorAtivo, salvarVendedor, type Resultado } from "./acoes";

export type Vendedor = { id: string; nome: string; whatsapp: string | null; pixChave: string | null; ativo: boolean };

const dataBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

function useAcao() {
  const [rodando, iniciar] = useTransition();
  const rodar = (fazer: () => Promise<Resultado>, sucesso: string, depois?: () => void) =>
    iniciar(async () => {
      const r = await fazer();
      if (r.erro) toast.error(r.erro);
      else {
        toast.success(sucesso);
        depois?.();
      }
    });
  return { rodando, rodar };
}

/** Aba Comissões do /admin: quanto pagar a cada vendedor (50% do que entrou das oficinas que ele vendeu). */
export function RelatorioComissoes({
  comissoes,
  vendedores,
  oficinasPorVendedor,
  produto,
  bancoPronto,
}: {
  comissoes: Comissao[];
  vendedores: Vendedor[];
  oficinasPorVendedor: Record<string, number>;
  produto: string;
  bancoPronto: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroComissoes>({ vendedorId: "", status: "pendente", mes: "" });
  const meses = useMemo(() => mesesComComissao(comissoes), [comissoes]);
  const lista = useMemo(() => filtrarComissoes(comissoes, filtro), [comissoes, filtro]);
  const nomeVendedor = (id: string) => vendedores.find((v) => v.id === id)?.nome ?? "Vendedor";
  const aPagar = somaComissoes(filtrarComissoes(comissoes, { vendedorId: "", status: "pendente", mes: "" }));
  const [mesAtual] = useState(() => mesDe(new Date().toISOString()));
  const pagoNoMes = somaComissoes(comissoes.filter((c) => c.status === "paga" && c.pagaEm && mesDe(c.pagaEm) === mesAtual));

  // Um bloco por vendedor, na ordem de quem tem mais a receber
  const grupos = useMemo(() => {
    const m = new Map<string, Comissao[]>();
    for (const c of lista) m.set(c.vendedorId, [...(m.get(c.vendedorId) ?? []), c]);
    return [...m.entries()].sort((a, b) => somaComissoes(b[1]) - somaComissoes(a[1]));
  }, [lista]);

  if (!bancoPronto) {
    return (
      <section className="flex flex-col gap-2 rounded-2xl bg-atencao-clara p-4 text-atencao-texto">
        <p className="flex items-center gap-2 text-xl font-extrabold">
          <AlertTriangle aria-hidden className="size-6" /> Falta preparar o banco
        </p>
        <p className="text-base">As comissões precisam de uma mudança no banco de dados. Peça ao Claude o passo a passo.</p>
      </section>
    );
  }

  const baixar = () => {
    const blob = new Blob([`﻿${csvComissoes(lista, nomeVendedor)}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `comissoes${filtro.mes ? `-${filtro.mes}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Resumo" className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-atencao-clara p-3">
          <p className="text-2xl font-extrabold text-atencao-texto">{formatarReais(aPagar)}</p>
          <p className="text-base font-semibold">A pagar (tudo)</p>
        </div>
        <div className="rounded-2xl bg-acao-clara p-3">
          <p className="text-2xl font-extrabold text-acao">{formatarReais(pagoNoMes)}</p>
          <p className="text-base font-semibold">Pago este mês</p>
        </div>
      </section>

      <section aria-label="Filtros" className="flex flex-col gap-2 rounded-2xl bg-superficie p-3">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-background p-1">
          {(
            [
              ["pendente", "A pagar"],
              ["paga", "Pagas"],
              ["todas", "Todas"],
            ] as const
          ).map(([id, nome]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtro.status === id}
              onClick={() => setFiltro({ ...filtro, status: id })}
              className={cn("tocavel min-h-12 rounded-xl text-base font-bold", filtro.status === id ? "bg-oficina text-oficina-texto" : "text-muted-foreground")}
            >
              {nome}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={filtro.vendedorId}
            onChange={(e) => setFiltro({ ...filtro, vendedorId: e.target.value })}
            aria-label="Vendedor"
            className="min-h-toque rounded-2xl bg-background px-4 text-lg font-semibold outline-none focus:ring-2 focus:ring-oficina"
          >
            <option value="">Todos os vendedores</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
          <select
            value={filtro.mes}
            onChange={(e) => setFiltro({ ...filtro, mes: e.target.value })}
            aria-label="Mês em que o Pix entrou"
            className="min-h-toque rounded-2xl bg-background px-4 text-lg font-semibold outline-none focus:ring-2 focus:ring-oficina"
          >
            <option value="">Todos os meses</option>
            {meses.map((m) => (
              <option key={m} value={m}>
                {nomeMes(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base">
            {lista.length} {lista.length === 1 ? "comissão" : "comissões"} · <strong>{formatarReais(somaComissoes(lista))}</strong>
          </p>
          {lista.length > 0 && (
            <button type="button" onClick={baixar} className="tocavel inline-flex min-h-12 items-center gap-2 rounded-xl bg-background px-3 text-base font-bold">
              <Download aria-hidden className="size-5" /> Baixar planilha
            </button>
          )}
        </div>
      </section>

      {grupos.length === 0 ? (
        <p className="rounded-2xl bg-superficie p-4 text-base text-muted-foreground">
          {comissoes.length === 0
            ? "Nenhuma comissão ainda. Marque quem vendeu cada oficina (aba Oficinas, botão Gerenciar). Quando você marcar um pagamento, a comissão aparece aqui."
            : "Nenhuma comissão com esses filtros."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {grupos.map(([vendedorId, itens]) => (
            <BlocoVendedor
              key={`${vendedorId}-${filtro.status}-${filtro.mes}`}
              vendedor={vendedores.find((v) => v.id === vendedorId) ?? { id: vendedorId, nome: "Vendedor", whatsapp: null, pixChave: null, ativo: false }}
              itens={itens}
              mes={filtro.mes}
              produto={produto}
            />
          ))}
        </ul>
      )}

      <Vendedores vendedores={vendedores} oficinasPorVendedor={oficinasPorVendedor} />
    </div>
  );
}

/** Comissões de um vendedor: escolher quais pagar, marcar como paga e mandar o extrato. */
function BlocoVendedor({ vendedor: v, itens, mes, produto }: { vendedor: Vendedor; itens: Comissao[]; mes: string; produto: string }) {
  const { rodando, rodar } = useAcao();
  const pendentes = itens.filter((c) => c.status === "pendente");
  const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set(pendentes.map((c) => c.id)));
  const [confirmar, setConfirmar] = useState(false);
  const selecionadas = pendentes.filter((c) => marcadas.has(c.id));
  const totalSel = somaComissoes(selecionadas);
  const alternar = (id: string) =>
    setMarcadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const extrato = textoExtratoVendedor(v.nome, selecionadas.length ? selecionadas : itens, mes, produto);

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-superficie p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xl font-extrabold">{v.nome}</p>
          {v.whatsapp && <p className="text-base text-muted-foreground">{formatarTelefone(v.whatsapp)}</p>}
        </div>
        <p className="text-right">
          <span className="block text-2xl font-extrabold">{formatarReais(somaComissoes(itens))}</span>
          <span className="text-sm text-muted-foreground">
            {itens.length} {itens.length === 1 ? "pagamento" : "pagamentos"}
          </span>
        </p>
      </div>

      {v.pixChave && (
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(v.pixChave!);
            toast.success("Chave Pix copiada");
          }}
          className="tocavel flex min-h-12 items-center gap-2 rounded-xl bg-background px-3 text-left text-base"
        >
          <Copy aria-hidden className="size-5 shrink-0" />
          <span className="min-w-0 break-all">
            Pix: <strong>{v.pixChave}</strong>
          </span>
        </button>
      )}

      <ul className="flex flex-col gap-1">
        {itens.map((c) => (
          <li key={c.id}>
            <label className={cn("flex min-h-12 items-center gap-3 rounded-xl bg-background px-3 py-2", c.status === "pendente" && "cursor-pointer")}>
              {c.status === "pendente" ? (
                <input
                  type="checkbox"
                  checked={marcadas.has(c.id)}
                  onChange={() => alternar(c.id)}
                  aria-label={`Pagar comissão de ${c.oficina}`}
                  className="size-5 shrink-0 accent-[var(--color-oficina)]"
                />
              ) : (
                <BadgeCheck aria-label="Paga" className="size-5 shrink-0 text-acao" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{c.oficina}</span>
                <span className="block text-sm text-muted-foreground">
                  Pix em {dataBR(c.recebidoEm)} · {formatarReais(c.valorRecebido)} × {c.percentual.toLocaleString("pt-BR")}%
                  {c.pagaEm && ` · paga em ${dataBR(c.pagaEm)}`}
                </span>
              </span>
              <strong className="shrink-0">{formatarReais(c.valor)}</strong>
              {c.status === "paga" && (
                <button
                  type="button"
                  disabled={rodando}
                  onClick={() => rodar(() => marcarComissoes([c.id], false), "Voltou para A pagar")}
                  aria-label={`Desfazer pagamento da comissão de ${c.oficina}`}
                  className="tocavel inline-flex min-h-11 items-center gap-1 rounded-lg bg-superficie px-2 text-sm font-bold disabled:opacity-60"
                >
                  <Undo2 aria-hidden className="size-4" /> Desfazer
                </button>
              )}
            </label>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {pendentes.length > 0 && (
          <button
            type="button"
            disabled={rodando || selecionadas.length === 0}
            onClick={() => setConfirmar(true)}
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-acao px-3 text-base font-bold text-acao-texto disabled:opacity-60"
          >
            <BadgeCheck aria-hidden className="size-6" /> Marcar como paga ({formatarReais(totalSel)})
          </button>
        )}
        {v.whatsapp && (
          <a
            href={`https://wa.me/${telefoneParaWhatsapp(v.whatsapp)}?text=${encodeURIComponent(extrato)}`}
            target="_blank"
            rel="noreferrer"
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-3 text-base font-bold text-white"
          >
            <MessageCircle aria-hidden className="size-6" /> Mandar extrato
          </a>
        )}
      </div>

      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        titulo={`Já pagou ${formatarReais(totalSel)}?`}
        texto={`Marca ${selecionadas.length} ${selecionadas.length === 1 ? "comissão" : "comissões"} de ${v.nome} como paga.`}
        textoConfirmar="Sim, já paguei"
        onConfirmar={() => {
          setConfirmar(false);
          rodar(() => marcarComissoes(selecionadas.map((c) => c.id), true), "Comissão marcada como paga");
        }}
      />
    </li>
  );
}

/** Lista de vendedores: cadastrar, mudar e tirar da lista. */
function Vendedores({ vendedores, oficinasPorVendedor }: { vendedores: Vendedor[]; oficinasPorVendedor: Record<string, number> }) {
  const [editando, setEditando] = useState<Vendedor | "novo" | null>(null);
  const { rodando, rodar } = useAcao();

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-superficie p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">Vendedores ({vendedores.length})</h2>
        {editando === null && (
          <button
            type="button"
            onClick={() => setEditando("novo")}
            className="tocavel inline-flex min-h-12 items-center gap-2 rounded-xl bg-oficina px-3 text-base font-bold text-oficina-texto"
          >
            <Plus aria-hidden className="size-5" /> Novo vendedor
          </button>
        )}
      </div>

      {editando !== null && (
        <FormVendedor
          key={editando === "novo" ? "novo" : editando.id}
          vendedor={editando === "novo" ? null : editando}
          onFechar={() => setEditando(null)}
        />
      )}

      {vendedores.length === 0 && editando === null && <p className="text-base text-muted-foreground">Cadastre quem vende o sistema para você.</p>}

      <ul className="flex flex-col gap-2">
        {vendedores.map((v) => (
          <li key={v.id} className={cn("flex flex-wrap items-center gap-2 rounded-xl bg-background p-3", !v.ativo && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {v.nome} {!v.ativo && <span className="text-sm font-semibold text-perigo">(fora da lista)</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                {oficinasPorVendedor[v.id] ?? 0} {(oficinasPorVendedor[v.id] ?? 0) === 1 ? "oficina" : "oficinas"}
                {v.whatsapp && ` · ${formatarTelefone(v.whatsapp)}`}
                {v.pixChave && ` · Pix ${v.pixChave}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditando(v)}
              className="tocavel inline-flex min-h-11 items-center gap-1 rounded-lg bg-superficie px-3 text-sm font-bold"
            >
              <Pencil aria-hidden className="size-4" /> Mudar
            </button>
            <button
              type="button"
              disabled={rodando}
              onClick={() => rodar(() => mudarVendedorAtivo(v.id, !v.ativo), v.ativo ? "Tirado da lista" : "Voltou para a lista")}
              className="tocavel inline-flex min-h-11 items-center gap-1 rounded-lg bg-superficie px-3 text-sm font-bold disabled:opacity-60"
            >
              {v.ativo ? <UserX aria-hidden className="size-4" /> : <UserCheck aria-hidden className="size-4" />}
              {v.ativo ? "Tirar" : "Voltar"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FormVendedor({ vendedor, onFechar }: { vendedor: Vendedor | null; onFechar: () => void }) {
  const { rodando, rodar } = useAcao();
  const [nome, setNome] = useState(vendedor?.nome ?? "");
  const [whatsapp, setWhatsapp] = useState(vendedor?.whatsapp ? formatarTelefone(vendedor.whatsapp) : "");
  const [pixChave, setPixChave] = useState(vendedor?.pixChave ?? "");
  const campo = "min-h-toque w-full rounded-2xl bg-background px-4 text-lg outline-none focus:ring-2 focus:ring-oficina";

  return (
    <form
      className="flex flex-col gap-2 rounded-2xl border-2 border-oficina p-3"
      onSubmit={(e) => {
        e.preventDefault();
        rodar(() => salvarVendedor({ id: vendedor?.id, nome, whatsapp: whatsapp.replace(/\D/g, ""), pixChave }), "Vendedor salvo", onFechar);
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-bold">Nome</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} autoComplete="off" className={campo} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-bold">WhatsApp</span>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
          type="tel"
          inputMode="tel"
          placeholder="(62) 99999-9999"
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-bold">Chave Pix (para pagar a comissão)</span>
        <input value={pixChave} onChange={(e) => setPixChave(e.target.value)} autoCapitalize="none" autoComplete="off" className={campo} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onFechar} className="tocavel min-h-toque rounded-2xl bg-background text-base font-bold">
          Cancelar
        </button>
        <button type="submit" disabled={rodando} className="tocavel min-h-toque rounded-2xl bg-acao text-base font-bold text-acao-texto disabled:opacity-60">
          {rodando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
