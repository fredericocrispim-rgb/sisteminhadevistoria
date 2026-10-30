"use client";

import { createElement, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  ChevronRight,
  FileDown,
  Loader2,
  X,
  CalendarClock,
  Copy,
  Lock,
  LockOpen,
  Mail,
  MessageCircle,
  Phone,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { ConfirmacaoImportante, LogoOficina } from "@/components/vf";
import type { Vendedor } from "./comissoes";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatarReais } from "@/lib/pix";
import { formatarTelefone, telefoneParaWhatsapp } from "@/lib/formatos";
import {
  MODELOS,
  dataBR,
  mensagemWhatsapp,
  modeloSugerido,
  temperaturaUso,
  tempoDesde,
  type GrupoSituacao,
  type ModeloMensagem,
  type Situacao,
} from "@/lib/admin-painel";
import {
  bloquearAcesso,
  darMaisDias,
  liberarAcesso,
  marcarComoPago,
  mudarUsuarioAtivo,
  mudarVencimento,
  registrarMensagem,
  definirVendedor,
  inativarOficina,
  mudarGratuita,
  reativarOficina,
  type Resultado,
} from "./acoes";

export type PessoaPainel = {
  vinculoId: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  papel: string;
  ativo: boolean;
  cortesia: boolean;
  ultimoUso: string | null;
};

export type OficinaPainel = {
  id: string;
  nome: string;
  logo: string | null;
  cidade: string;
  criadoEm: string;
  codigo: string;
  indicadaPor: string | null;
  responsavel: { nome: string | null; whatsapp: string | null; email: string | null };
  whatsappOficina: string | null;
  situacao: Situacao;
  teste: boolean;
  planoNome: string;
  usuarios: number;
  cortesias: number;
  valor: number;
  pix: string | null;
  ultimoUso: string | null;
  vistoriasTotal: number;
  vistoriasMes: number;
  ultimaVistoria: string | null;
  equipe: PessoaPainel[];
  pagamentos: { valor: number; pagoEm: string; descricao: string | null }[];
  ultimaMensagem: string | null;
  /** Quem vendeu (recebe a comissão); vazio = venda sua. */
  vendedorId: string | null;
  /** Inativada no painel: some da lista principal e a equipe não usa o sistema. */
  ativa: boolean;
  inativadaEm: string | null;
  /** Uso gratuito (marcado no painel): fora da receita e dos pagantes. O acesso não muda. */
  gratuita: boolean;
  pagamento: FormaPainel;
};

export type FormaPainel = "pix_manual" | "asaas_pix" | "asaas_cartao";

type Situ = "todas" | "teste" | "pagando" | "cobrar" | "gratis" | "bloqueado" | "inativas";
type FiltroPagamento = "todas" | FormaPainel;
type FiltroUso = "todos" | "recente" | "7" | "30" | "sem_vistoria";
type FiltroCadastro = "todos" | "7" | "30" | "90";
type Ordem = "uso" | "vencimento" | "novas" | "nome" | "vistorias" | "valor";

const COR_SITUACAO: Record<GrupoSituacao, string> = {
  teste: "bg-oficina-clara text-oficina",
  pagando: "bg-acao-clara text-acao",
  vence_logo: "bg-atencao-clara text-atencao-texto",
  atrasado: "bg-atencao-clara text-atencao-texto",
  bloqueado: "bg-perigo-clara text-perigo",
};
const COR_USO = { quente: "bg-acao", morno: "bg-atencao", frio: "bg-perigo" };
const PAPEL: Record<string, string> = { dono: "Dono", gerente: "Gerente", vistoriador: "Vistoriador" };
export const NOME_PAGAMENTO: Record<FormaPainel, string> = { pix_manual: "Pix manual", asaas_pix: "Asaas · Pix", asaas_cartao: "Asaas · Cartão" };
const diaHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const paradaHaDias = (o: OficinaPainel, dias: number) => !o.ultimoUso || Date.now() - Date.parse(o.ultimoUso) > dias * 86400000;
const novaHaDias = (o: OficinaPainel, dias: number) => Date.now() - Date.parse(o.criadoEm) <= dias * 86400000;

const NOME_SITU: Record<Situ, string> = {
  todas: "Ativas",
  teste: "Prazo de pagar",
  pagando: "Pagando",
  cobrar: "Para cobrar",
  gratis: "Grátis",
  bloqueado: "Bloqueadas",
  inativas: "Inativas",
};
const NOME_USO: Record<FiltroUso, string> = {
  todos: "Todos",
  recente: "Usou nos últimos 2 dias",
  "7": "Sem uso há 7 dias",
  "30": "Sem uso há 30 dias",
  sem_vistoria: "Nunca fez vistoria",
};
const NOME_CADASTRO: Record<FiltroCadastro, string> = { todos: "Qualquer data", "7": "Últimos 7 dias", "30": "Últimos 30 dias", "90": "Últimos 90 dias" };
const NOME_ORDEM: Record<Ordem, string> = {
  uso: "Usou por último",
  vencimento: "Vence primeiro",
  novas: "Mais novas",
  vistorias: "Mais vistorias",
  valor: "Maior mensalidade",
  nome: "Nome (A-Z)",
};

/** Texto da situação: inativa e grátis têm prioridade. */
const textoSituacao = (o: OficinaPainel) => (!o.ativa ? "Inativa" : o.gratuita ? "Grátis" : o.situacao.texto);
/** Mensalidade na lista: oficina grátis não paga. */
const textoValor = (o: OficinaPainel) => (o.gratuita ? "Grátis" : formatarReais(o.valor));
/** Conta como pagante (receita): ativa, não grátis, já passou do prazo do 1º pagamento e não bloqueada. */
const ehPagante = (o: OficinaPainel) => o.ativa && !o.gratuita && !o.teste && o.situacao.grupo !== "teste" && o.situacao.grupo !== "bloqueado";

/** Lista de oficinas do administrador: números, abas, filtros, tabela e painel lateral de cada oficina. */
export function PainelOficinas({
  oficinas,
  produto,
  linkPlano,
  vendedores,
  comissaoAtiva,
}: {
  oficinas: OficinaPainel[];
  produto: string;
  linkPlano: string;
  vendedores: Vendedor[];
  /** Banco preparado para comissões. */
  comissaoAtiva: boolean;
}) {
  const [situ, setSitu] = useState<Situ>("todas");
  const [pagamento, setPagamento] = useState<FiltroPagamento>("todas");
  const [uso, setUso] = useState<FiltroUso>("todos");
  const [vendedor, setVendedor] = useState("todos");
  const [cadastro, setCadastro] = useState<FiltroCadastro>("todos");
  const [ordem, setOrdem] = useState<Ordem>("uso");
  const [busca, setBusca] = useState("");
  const [cobrar, setCobrar] = useState<OficinaPainel | null>(null);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  // Depois de uma ação (pago, bloquear...), a lista volta do servidor atualizada: o painel lateral acompanha pelo id
  const aberta = oficinas.find((o) => o.id === abertaId) ?? null;

  const ativas = oficinas.filter((o) => o.ativa);
  const conta = (f: Situ) => oficinas.filter((o) => passaSituacao(o, f)).length;
  const pagantes = oficinas.filter(ehPagante);
  const receitaMes = pagantes.reduce((s, o) => s + o.valor, 0);
  const [desde30] = useState(() => Date.now() - 30 * 86400000);
  const recebido30 = oficinas
    .filter((o) => !o.gratuita)
    .flatMap((o) => o.pagamentos).filter((p) => Date.parse(p.pagoEm) >= desde30).reduce((s, p) => s + p.valor, 0);
  const vistoriasMes = ativas.reduce((s, o) => s + o.vistoriasMes, 0);
  const semUso7 = ativas.filter((o) => paradaHaDias(o, 7)).length;

  const filtrando = pagamento !== "todas" || uso !== "todos" || vendedor !== "todos" || cadastro !== "todos" || busca.trim() !== "";
  const limpar = () => {
    setPagamento("todas");
    setUso("todos");
    setVendedor("todos");
    setCadastro("todos");
    setBusca("");
  };

  const lista = useMemo(() => {
    const q = semAcento(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return oficinas
      .filter((o) => passaSituacao(o, situ))
      .filter((o) => pagamento === "todas" || o.pagamento === pagamento)
      .filter((o) => {
        switch (uso) {
          case "recente":
            return !paradaHaDias(o, 2);
          case "7":
            return paradaHaDias(o, 7);
          case "30":
            return paradaHaDias(o, 30);
          case "sem_vistoria":
            return o.vistoriasTotal === 0;
          default:
            return true;
        }
      })
      .filter((o) => vendedor === "todos" || (vendedor === "eu" ? !o.vendedorId : o.vendedorId === vendedor))
      .filter((o) => cadastro === "todos" || novaHaDias(o, Number(cadastro)))
      .filter((o) => {
        if (!q) return true;
        const texto = semAcento(
          [o.nome, o.cidade, o.codigo, o.responsavel.nome, o.responsavel.email, ...o.equipe.flatMap((p) => [p.nome, p.email])].filter(Boolean).join(" "),
        );
        const fones = [o.responsavel.whatsapp, o.whatsappOficina, ...o.equipe.map((p) => p.whatsapp)].join(" ").replace(/\D/g, "");
        return texto.includes(q) || (digitos.length >= 4 && fones.includes(digitos));
      })
      .sort((a, b) => {
        switch (ordem) {
          case "uso":
            return (b.ultimoUso ?? "").localeCompare(a.ultimoUso ?? "");
          case "vencimento":
            return (a.situacao.vencimento ?? "9999").localeCompare(b.situacao.vencimento ?? "9999");
          case "nome":
            return a.nome.localeCompare(b.nome, "pt-BR");
          case "vistorias":
            return b.vistoriasMes - a.vistoriasMes || b.vistoriasTotal - a.vistoriasTotal;
          case "valor":
            return b.valor - a.valor;
          default:
            return b.criadoEm.localeCompare(a.criadoEm);
        }
      });
  }, [oficinas, situ, pagamento, uso, vendedor, cadastro, busca, ordem]);

  /** Gera o PDF da lista como está na tela (mesmos filtros e ordem) e baixa o arquivo. */
  async function exportarPdf() {
    setGerandoPdf(true);
    try {
      const filtros = [
        `Situação: ${NOME_SITU[situ]}`,
        pagamento !== "todas" && `Pagamento: ${NOME_PAGAMENTO[pagamento]}`,
        uso !== "todos" && `Uso: ${NOME_USO[uso]}`,
        vendedor !== "todos" && `Vendedor: ${vendedor === "eu" ? "Eu mesmo" : (vendedores.find((v) => v.id === vendedor)?.nome ?? "")}`,
        cadastro !== "todos" && `Cadastro: ${NOME_CADASTRO[cadastro]}`,
        busca.trim() && `Busca: "${busca.trim()}"`,
        `Ordem: ${NOME_ORDEM[ordem]}`,
      ].filter((f): f is string => Boolean(f));
      const [{ pdf }, { RelatorioOficinasPdf }] = await Promise.all([import("@react-pdf/renderer"), import("./relatorio-pdf")]);
      const documento = createElement(RelatorioOficinasPdf, {
        produto,
        filtros,
        oficinas: lista.map((o) => ({
          nome: o.nome,
          cidade: o.cidade,
          responsavel: o.responsavel.nome ?? "",
          whatsapp: o.responsavel.whatsapp ? formatarTelefone(o.responsavel.whatsapp) : "",
          situacao: textoSituacao(o),
          pagamento: NOME_PAGAMENTO[o.pagamento],
          ultimoUso: tempoDesde(o.ultimoUso),
          vistorias: `${o.vistoriasMes} / ${o.vistoriasTotal}`,
          valor: textoValor(o),
          cadastro: dia(o.criadoEm),
          vendedor: vendedores.find((v) => v.id === o.vendedorId)?.nome ?? "",
        })),
        resumo: {
          oficinas: lista.length,
          mensalidades: formatarReais(lista.filter(ehPagante).reduce((s, o) => s + o.valor, 0)),
          vistoriasMes: lista.reduce((s, o) => s + o.vistoriasMes, 0),
        },
      });
      const blob = await pdf(documento as Parameters<typeof pdf>[0]).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `oficinas-${new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (erro) {
      console.error(erro);
      toast.error("Não consegui gerar o PDF. Tente de novo.");
    } finally {
      setGerandoPdf(false);
    }
  }

  const abas: Situ[] = ["todas", "teste", "pagando", "cobrar", "gratis", "bloqueado", "inativas"];

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Resumo" className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-background lg:grid-cols-4">
        <Resumo rotulo="Receita mensal" valor={formatarReais(receitaMes)} detalhe={`${pagantes.length} ${pagantes.length === 1 ? "oficina pagando" : "oficinas pagando"}`} />
        <Resumo rotulo="Recebido em 30 dias" valor={formatarReais(recebido30)} detalhe="Pagamentos confirmados" />
        <Resumo rotulo="Vistorias no mês" valor={String(vistoriasMes)} detalhe="Últimos 30 dias" />
        <Resumo rotulo="Sem uso há 7 dias" valor={String(semUso7)} detalhe={semUso7 > 0 ? "Vale um contato" : "Todas usando"} />
      </section>

      <section aria-label="Oficinas" className="overflow-hidden rounded-2xl border border-border bg-background">
        <div role="tablist" aria-label="Situação" className="flex gap-1 overflow-x-auto border-b border-border px-2">
          {abas.map((a) => (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={situ === a}
              onClick={() => setSitu(a)}
              className={cn(
                "-mb-px flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-bold whitespace-nowrap transition-colors",
                situ === a ? "border-oficina text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {NOME_SITU[a]}
              <span className={cn("rounded-full px-2 py-0.5 text-xs", situ === a ? "bg-oficina text-oficina-texto" : "bg-superficie")}>{conta(a)}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-b border-border p-3 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border px-3 focus-within:ring-2 focus-within:ring-oficina lg:min-w-64">
            <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar oficina, pessoa, cidade ou telefone"
              aria-label="Buscar"
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
            <Escolha rotulo="Pagamento" valor={pagamento} onValor={(v) => setPagamento(v as FiltroPagamento)}>
              <option value="todas">Todos</option>
              {(Object.keys(NOME_PAGAMENTO) as FormaPainel[]).map((f) => (
                <option key={f} value={f}>
                  {NOME_PAGAMENTO[f]}
                </option>
              ))}
            </Escolha>
            <Escolha rotulo="Uso" valor={uso} onValor={(v) => setUso(v as FiltroUso)}>
              {(Object.keys(NOME_USO) as FiltroUso[]).map((u) => (
                <option key={u} value={u}>
                  {NOME_USO[u]}
                </option>
              ))}
            </Escolha>
            <Escolha rotulo="Vendedor" valor={vendedor} onValor={setVendedor}>
              <option value="todos">Todos</option>
              <option value="eu">Eu mesmo</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </Escolha>
            <Escolha rotulo="Cadastro" valor={cadastro} onValor={(v) => setCadastro(v as FiltroCadastro)}>
              {(Object.keys(NOME_CADASTRO) as FiltroCadastro[]).map((c) => (
                <option key={c} value={c}>
                  {NOME_CADASTRO[c]}
                </option>
              ))}
            </Escolha>
            <Escolha rotulo="Ordenar" valor={ordem} onValor={(v) => setOrdem(v as Ordem)}>
              {(Object.keys(NOME_ORDEM) as Ordem[]).map((o) => (
                <option key={o} value={o}>
                  {NOME_ORDEM[o]}
                </option>
              ))}
            </Escolha>
            <button
              type="button"
              onClick={exportarPdf}
              disabled={gerandoPdf || lista.length === 0}
              className="tocavel inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-foreground px-4 text-sm font-bold text-background disabled:opacity-50"
            >
              {gerandoPdf ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <FileDown aria-hidden className="size-4" />}
              {gerandoPdf ? "Gerando..." : "Exportar PDF"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-muted-foreground">
          <span aria-live="polite">
            {lista.length} {lista.length === 1 ? "oficina" : "oficinas"}
          </span>
          {filtrando && (
            <button type="button" onClick={limpar} className="inline-flex min-h-9 items-center gap-1 font-bold text-oficina hover:underline">
              <X aria-hidden className="size-4" /> Limpar filtros
            </button>
          )}
        </div>

        {lista.length === 0 ? (
          <p className="border-t border-border p-10 text-center text-base text-muted-foreground">Nenhuma oficina com esses filtros.</p>
        ) : (
          <>
            {/* Computador: tabela */}
            <table className="hidden w-full border-t border-border text-left text-sm md:table">
              <thead className="bg-superficie/60 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Oficina</th>
                  <th className="px-3 py-2.5 font-bold">Situação</th>
                  <th className="px-3 py-2.5 font-bold">Último uso</th>
                  <th className="px-3 py-2.5 text-right font-bold">Vistorias</th>
                  <th className="px-3 py-2.5 text-right font-bold">Mensal</th>
                  <th className="hidden px-3 py-2.5 font-bold lg:table-cell">Responsável</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lista.map((o) => (
                  <tr key={o.id} className="cursor-pointer transition-colors hover:bg-superficie/60" onClick={() => setAbertaId(o.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <LogoOficina nome={o.nome} url={o.logo} tamanho="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">{o.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{[o.cidade, NOME_PAGAMENTO[o.pagamento]].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Selo oficina={o} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className={cn("size-2 rounded-full", COR_USO[temperaturaUso(o.ultimoUso)])} />
                        {tempoDesde(o.ultimoUso)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <strong>{o.vistoriasMes}</strong> <span className="text-muted-foreground">/ {o.vistoriasTotal}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold whitespace-nowrap tabular-nums">{textoValor(o)}</td>
                    <td className="hidden max-w-48 px-3 py-3 lg:table-cell">
                      <p className="truncate">{o.responsavel.nome ?? "sem nome"}</p>
                      {o.responsavel.whatsapp && <p className="text-xs text-muted-foreground">{formatarTelefone(o.responsavel.whatsapp)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Mandar WhatsApp"
                          aria-label={`Mandar WhatsApp para ${o.nome}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCobrar(o);
                          }}
                          className="grid size-9 place-items-center rounded-lg text-[#1f8f4e] hover:bg-acao-clara"
                        >
                          <MessageCircle aria-hidden className="size-5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Abrir ${o.nome}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAbertaId(o.id);
                          }}
                          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-superficie"
                        >
                          <ChevronRight aria-hidden className="size-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Celular: linhas compactas */}
            <ul className="divide-y divide-border border-t border-border md:hidden">
              {lista.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setAbertaId(o.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <LogoOficina nome={o.nome} url={o.logo} tamanho="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{o.nome}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <Selo oficina={o} />
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden className={cn("size-1.5 rounded-full", COR_USO[temperaturaUso(o.ultimoUso)])} />
                          {tempoDesde(o.ultimoUso)}
                        </span>
                        <span>{textoValor(o)}</span>
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <PainelLateral
        oficina={aberta}
        vendedores={vendedores}
        comissaoAtiva={comissaoAtiva}
        onFechar={() => setAbertaId(null)}
        onCobrar={() => aberta && setCobrar(aberta)}
      />
      <JanelaWhatsapp oficina={cobrar} produto={produto} linkPlano={linkPlano} onFechar={() => setCobrar(null)} />
    </div>
  );
}

function Resumo({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-border p-4 [&:nth-child(-n+2)]:border-b lg:border-b-0 lg:[&:not(:last-child)]:border-r odd:border-r">
      <span className="text-sm font-semibold text-muted-foreground">{rotulo}</span>
      <span className="text-2xl font-extrabold tracking-tight tabular-nums">{valor}</span>
      <span className="text-xs text-muted-foreground">{detalhe}</span>
    </div>
  );
}

function Selo({ oficina: o }: { oficina: OficinaPainel }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap",
        !o.ativa ? "bg-superficie text-muted-foreground" : o.gratuita ? "bg-oficina-clara text-oficina" : COR_SITUACAO[o.situacao.grupo],
      )}
    >
      {textoSituacao(o)}
    </span>
  );
}

/** Lista de escolha dos filtros, com o nome em cima. */
function Escolha({ rotulo, valor, onValor, children }: { rotulo: string; valor: string; onValor: (v: string) => void; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-bold text-muted-foreground">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => onValor(e.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border border-border bg-background px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-oficina lg:w-auto"
      >
        {children}
      </select>
    </label>
  );
}

function passaSituacao(o: OficinaPainel, f: Situ) {
  if (f === "inativas") return !o.ativa;
  if (!o.ativa) return false; // inativas só aparecem na aba delas
  if (f === "gratis") return o.gratuita;
  const g = o.situacao.grupo;
  if (f === "todas") return true;
  if (o.gratuita && f !== "bloqueado") return false; // grátis não entra em prazo, pagando nem cobrar
  switch (f) {
    case "teste":
      return g === "teste" || (o.teste && g === "vence_logo");
    case "pagando":
      return g === "pagando" || (!o.teste && g === "vence_logo");
    case "cobrar":
      return g === "vence_logo" || g === "atrasado";
    case "bloqueado":
      return g === "bloqueado";
  }
}

/** Roda uma ação do servidor e avisa o resultado. */
function useAcao() {
  const [rodando, iniciar] = useTransition();
  const rodar = (fazer: () => Promise<Resultado | void>, sucesso: string) =>
    iniciar(async () => {
      const r = await fazer();
      if (r && r.erro) toast.error(r.erro);
      else toast.success(sucesso);
    });
  return { rodando, rodar };
}

/** Painel que abre do lado com tudo da oficina: dados, ações de acesso, vendedor, equipe e pagamentos. */
function PainelLateral({
  oficina: o,
  vendedores,
  comissaoAtiva,
  onFechar,
  onCobrar,
}: {
  oficina: OficinaPainel | null;
  vendedores: Vendedor[];
  comissaoAtiva: boolean;
  onFechar: () => void;
  onCobrar: () => void;
}) {
  return (
    <Dialog open={Boolean(o)} onOpenChange={(a) => !a && onFechar()}>
      <DialogContent className="top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none p-0 sm:max-w-xl">
        {o && (
          <>
            <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-popover p-5 pr-12">
              <LogoOficina nome={o.nome} url={o.logo} tamanho="sm" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-xl font-extrabold">{o.nome}</DialogTitle>
                <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <Selo oficina={o} />
                  <span>{[o.cidade, NOME_PAGAMENTO[o.pagamento]].filter(Boolean).join(" · ")}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-col gap-5 p-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Dado rotulo="Responsável">{o.responsavel.nome ?? "sem nome"}</Dado>
                <Dado rotulo="WhatsApp">{o.responsavel.whatsapp ? formatarTelefone(o.responsavel.whatsapp) : "—"}</Dado>
                <Dado rotulo="Último uso">{tempoDesde(o.ultimoUso)}</Dado>
                <Dado rotulo="Vistorias (mês / total)">
                  {o.vistoriasMes} / {o.vistoriasTotal}
                </Dado>
                <Dado rotulo="Mensalidade">{textoValor(o)}</Dado>
                <Dado rotulo="Cadastro">{dia(o.criadoEm)}</Dado>
              </dl>
              <button
                type="button"
                onClick={onCobrar}
                className="tocavel inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f8f4e] px-4 text-base font-bold text-white"
              >
                <MessageCircle aria-hidden className="size-5" /> Mandar WhatsApp
              </button>
              <DetalhesOficina key={o.id} oficina={o} vendedores={vendedores} comissaoAtiva={comissaoAtiva} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{rotulo}</dt>
      <dd className="truncate font-bold">{children}</dd>
    </div>
  );
}

/** Quem vendeu a oficina: recebe a comissão de cada pagamento dela. */
function QuemVendeu({ oficina: o, vendedores }: { oficina: OficinaPainel; vendedores: Vendedor[] }) {
  const { rodando, rodar } = useAcao();
  const [escolhido, setEscolhido] = useState(o.vendedorId ?? "");
  const [anteriores, setAnteriores] = useState(true);
  const opcoes = vendedores.filter((v) => v.ativo || v.id === o.vendedorId);
  const mudou = escolhido !== (o.vendedorId ?? "");
  const temPagamentos = o.pagamentos.length > 0;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-lg font-extrabold">Quem vendeu</h3>
      {vendedores.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Cadastre os vendedores na aba{" "}
          <a href="/admin?aba=comissoes" className="font-bold text-oficina underline">
            Comissões
          </a>
          .
        </p>
      ) : (
        <>
          <select
            value={escolhido}
            onChange={(e) => setEscolhido(e.target.value)}
            aria-label="Quem vendeu esta oficina"
            className="min-h-toque rounded-2xl bg-superficie px-4 text-lg font-semibold outline-none focus:ring-2 focus:ring-oficina"
          >
            <option value="">Eu mesmo (sem comissão)</option>
            {opcoes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
          {mudou && escolhido && temPagamentos && (
            <label className="flex min-h-toque cursor-pointer items-center gap-3 rounded-2xl bg-superficie px-3 text-base">
              <input type="checkbox" checked={anteriores} onChange={(e) => setAnteriores(e.target.checked)} className="size-5 accent-[var(--color-oficina)]" />
              Gerar comissão dos pagamentos que já entraram
            </label>
          )}
          {mudou && (
            <button
              type="button"
              disabled={rodando}
              onClick={() => rodar(() => definirVendedor(o.id, escolhido || null, anteriores), "Vendedor salvo")}
              className="tocavel min-h-toque rounded-2xl bg-oficina px-4 text-base font-bold text-oficina-texto disabled:opacity-60"
            >
              Salvar vendedor
            </button>
          )}
        </>
      )}
    </section>
  );
}

function DetalhesOficina({ oficina: o, vendedores, comissaoAtiva }: { oficina: OficinaPainel; vendedores: Vendedor[]; comissaoAtiva: boolean }) {
  const { rodando, rodar } = useAcao();
  const [data, setData] = useState(o.situacao.vencimento ?? "");
  const [confirmarBloqueio, setConfirmarBloqueio] = useState(false);
  const [confirmarPago, setConfirmarPago] = useState(false);
  const [confirmarInativar, setConfirmarInativar] = useState(false);
  const s = o.situacao;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-extrabold">Acesso e pagamento</h3>
        <p className="text-base text-muted-foreground">
          {o.teste ? "Teste grátis" : `Plano ${o.planoNome}`}
          {s.vencimento && ` · ${o.teste ? "teste acaba" : "vence"} em ${dataBR(s.vencimento)}`}
          {` · ${o.usuarios} ${o.usuarios === 1 ? "usuário pago" : "usuários pagos"}`}
          {o.cortesias > 0 && ` + ${o.cortesias} cortesia`}
          {` · ${formatarReais(o.valor)}/mês`}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={rodando}
            onClick={() => setConfirmarPago(true)}
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-acao px-3 text-base font-bold text-acao-texto disabled:opacity-60"
          >
            <BadgeCheck aria-hidden className="size-6" /> Marcar como pago (+30 dias)
          </button>
          {s.grupo === "bloqueado" ? (
            <button
              type="button"
              disabled={rodando}
              onClick={() => rodar(() => liberarAcesso(o.id), "Acesso liberado")}
              className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-oficina px-3 text-base font-bold text-oficina-texto disabled:opacity-60"
            >
              <LockOpen aria-hidden className="size-6" /> Liberar acesso
            </button>
          ) : (
            <button
              type="button"
              disabled={rodando}
              onClick={() => setConfirmarBloqueio(true)}
              className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-perigo-clara px-3 text-base font-bold text-perigo disabled:opacity-60"
            >
              <Lock aria-hidden className="size-6" /> Bloquear acesso
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              disabled={rodando}
              onClick={() => rodar(() => darMaisDias(o.id, d), `Mais ${d} dias liberados`)}
              className="tocavel min-h-toque rounded-2xl bg-superficie px-3 text-base font-bold disabled:opacity-60"
            >
              + {d} dias {o.teste ? "de teste" : "grátis"}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            rodar(() => mudarVencimento(o.id, data), "Data salva");
          }}
        >
          <label className="flex min-h-toque flex-1 items-center gap-2 rounded-2xl bg-superficie px-3">
            <CalendarClock aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <span className="sr-only">{o.teste ? "Fim do teste" : "Vencimento"}</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className="min-w-0 flex-1 bg-transparent text-lg outline-none" />
          </label>
          <button type="submit" disabled={rodando || !data} className="tocavel min-h-toque whitespace-nowrap rounded-2xl bg-oficina px-4 text-base font-bold text-oficina-texto disabled:opacity-60">
            Mudar data
          </button>
        </form>
      </section>

      {comissaoAtiva && <QuemVendeu oficina={o} vendedores={vendedores} />}

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-extrabold">Equipe ({o.equipe.length})</h3>
        <ul className="flex flex-col gap-2">
          {o.equipe.map((p) => (
            <li key={p.vinculoId} className={cn("flex flex-col gap-1 rounded-2xl bg-superficie p-3", !p.ativo && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-base">{p.nome ?? "sem nome"}</strong>
                <span className="rounded-full bg-background px-2 py-0.5 text-sm font-bold">{PAPEL[p.papel] ?? p.papel}</span>
                {p.cortesia && <span className="rounded-full bg-oficina-clara px-2 py-0.5 text-sm font-bold text-oficina">Cortesia</span>}
                {!p.ativo && <span className="rounded-full bg-perigo-clara px-2 py-0.5 text-sm font-bold text-perigo">Desligado</span>}
              </div>
              <p className="flex items-center gap-2 text-sm">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", COR_USO[temperaturaUso(p.ultimoUso)])} />
                Último uso: {tempoDesde(p.ultimoUso)}
                {p.ultimoUso && <span className="text-muted-foreground">({diaHora(p.ultimoUso)})</span>}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {p.email && (
                  <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 break-all text-oficina underline">
                    <Mail aria-hidden className="size-4" /> {p.email}
                  </a>
                )}
                {p.whatsapp && (
                  <a
                    href={`https://wa.me/${telefoneParaWhatsapp(p.whatsapp)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-oficina underline"
                  >
                    <Phone aria-hidden className="size-4" /> {formatarTelefone(p.whatsapp)}
                  </a>
                )}
              </div>
              {p.papel !== "dono" && (
                <button
                  type="button"
                  disabled={rodando}
                  onClick={() => rodar(() => mudarUsuarioAtivo(p.vinculoId, !p.ativo), p.ativo ? "Pessoa desligada" : "Pessoa religada")}
                  className="tocavel mt-1 inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-background px-3 text-sm font-bold disabled:opacity-60"
                >
                  {p.ativo ? <UserX aria-hidden className="size-4" /> : <UserCheck aria-hidden className="size-4" />}
                  {p.ativo ? "Tirar acesso" : "Devolver acesso"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-extrabold">Pagamentos</h3>
        {o.pagamentos.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhum pagamento ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {o.pagamentos.map((p) => (
              <li key={p.pagoEm} className="flex justify-between gap-2 rounded-xl bg-superficie px-3 py-2 text-base">
                <span>{diaHora(p.pagoEm)}</span>
                <strong>{formatarReais(p.valor)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Cadastrada em {new Date(o.criadoEm).toLocaleDateString("pt-BR")} · Código {o.codigo}
        {o.indicadaPor && ` · Indicada por ${o.indicadaPor}`}
        {o.ultimaVistoria && ` · Última vistoria ${tempoDesde(o.ultimaVistoria)}`}
      </p>

      <section className="flex flex-col gap-2 rounded-2xl border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold">Uso gratuito</h3>
            <p className="text-sm text-muted-foreground">Fica fora da receita e dos pagantes. O pagamento continua possível.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={o.gratuita}
            aria-label="Uso gratuito"
            disabled={rodando}
            onClick={() => rodar(() => mudarGratuita(o.id, !o.gratuita), o.gratuita ? "Voltou a contar como pagante" : "Marcada como grátis")}
            className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60", o.gratuita ? "bg-oficina" : "bg-muted-foreground/30")}
          >
            <span aria-hidden className={cn("absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform", o.gratuita && "translate-x-6")} />
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-3">
        <h3 className="text-lg font-extrabold">{o.ativa ? "Inativar oficina" : "Oficina inativa"}</h3>
        <p className="text-base text-muted-foreground">
          {o.ativa
            ? "Some da lista, a equipe para de usar e a cobrança do Asaas é cancelada. Nada é apagado."
            : "Reative para a equipe voltar a usar. O acesso segue as datas de pagamento."}
        </p>
        {o.ativa ? (
          <button
            type="button"
            disabled={rodando}
            onClick={() => setConfirmarInativar(true)}
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 self-start rounded-2xl bg-superficie px-4 text-base font-bold disabled:opacity-60"
          >
            <Archive aria-hidden className="size-5" /> Inativar oficina
          </button>
        ) : (
          <button
            type="button"
            disabled={rodando}
            onClick={() => rodar(() => reativarOficina(o.id), "Oficina reativada")}
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 self-start rounded-2xl bg-oficina px-4 text-base font-bold text-oficina-texto disabled:opacity-60"
          >
            <ArchiveRestore aria-hidden className="size-5" /> Reativar oficina
          </button>
        )}
      </section>

      <ConfirmacaoImportante
        aberto={confirmarInativar}
        onAberto={setConfirmarInativar}
        titulo="Inativar esta oficina?"
        texto={`A equipe da ${o.nome} para de usar o sistema e a cobrança automática é cancelada. Você pode reativar depois.`}
        textoConfirmar="Sim, inativar"
        perigo
        onConfirmar={() => {
          setConfirmarInativar(false);
          rodar(() => inativarOficina(o.id), "Oficina inativada");
        }}
      />
      <ConfirmacaoImportante
        aberto={confirmarBloqueio}
        onAberto={setConfirmarBloqueio}
        titulo="Bloquear esta oficina?"
        texto={`A equipe da ${o.nome} só vai ver a tela do Pix até você liberar.`}
        textoConfirmar="Bloquear"
        perigo
        onConfirmar={() => {
          setConfirmarBloqueio(false);
          rodar(() => bloquearAcesso(o.id), "Oficina bloqueada");
        }}
      />
      <ConfirmacaoImportante
        aberto={confirmarPago}
        onAberto={setConfirmarPago}
        titulo="O Pix caiu na conta?"
        texto={`Registra ${formatarReais(o.valor)} pago pela ${o.nome} e libera mais 30 dias.`}
        textoConfirmar="Sim, marcar como pago"
        onConfirmar={() => {
          setConfirmarPago(false);
          const f = new FormData();
          f.set("empresa_id", o.id);
          rodar(() => marcarComoPago(f), "Pagamento registrado");
        }}
      />
    </div>
  );
}

/** Escolhe para quem mandar e o modelo da mensagem; abre o WhatsApp com o texto pronto. */
function JanelaWhatsapp({
  oficina,
  produto,
  linkPlano,
  onFechar,
}: {
  oficina: OficinaPainel | null;
  produto: string;
  linkPlano: string;
  onFechar: () => void;
}) {
  return (
    <Dialog open={Boolean(oficina)} onOpenChange={(a) => !a && onFechar()}>
      <DialogContent className="max-h-[92dvh] gap-4 overflow-y-auto rounded-3xl p-5 sm:max-w-lg">
        {oficina && <ConteudoWhatsapp key={oficina.id} oficina={oficina} produto={produto} linkPlano={linkPlano} onFechar={onFechar} />}
      </DialogContent>
    </Dialog>
  );
}

function ConteudoWhatsapp({ oficina: o, produto, linkPlano, onFechar }: { oficina: OficinaPainel; produto: string; linkPlano: string; onFechar: () => void }) {
  // Para quem mandar: o responsável primeiro, depois o WhatsApp da oficina e o resto da equipe
  const destinos = useMemo(() => {
    const vistos = new Set<string>();
    const lista: { nome: string | null; rotulo: string; fone: string }[] = [];
    const add = (nome: string | null, rotulo: string, fone: string | null) => {
      if (!fone) return;
      const n = telefoneParaWhatsapp(fone);
      if (vistos.has(n)) return;
      vistos.add(n);
      lista.push({ nome, rotulo, fone: n });
    };
    add(o.responsavel.nome, "Responsável", o.responsavel.whatsapp);
    add(o.responsavel.nome, "Oficina", o.whatsappOficina);
    o.equipe.filter((p) => p.ativo).forEach((p) => add(p.nome, PAPEL[p.papel] ?? p.papel, p.whatsapp));
    return lista;
  }, [o]);

  const [destino, setDestino] = useState(0);
  const [modelo, setModelo] = useState<ModeloMensagem>(() => (paradaHaDias(o, 7) && o.situacao.grupo === "teste" ? "sumiu" : modeloSugerido(o.situacao)));
  const textoDo = (m: ModeloMensagem, i: number) =>
    mensagemWhatsapp(m, {
      nomePessoa: destinos[i]?.nome ?? o.responsavel.nome,
      oficina: o.nome,
      produto,
      teste: o.teste,
      valor: o.valor,
      vencimento: o.situacao.vencimento,
      diasParaVencer: o.situacao.diasParaVencer,
      diasAtraso: o.situacao.diasAtraso,
      pix: o.pix,
      linkPlano,
    });
  const [texto, setTexto] = useState(() => textoDo(modelo, 0));
  const escolher = (m: ModeloMensagem, i: number) => {
    setModelo(m);
    setDestino(i);
    setTexto(textoDo(m, i));
  };
  const fone = destinos[destino]?.fone;

  return (
    <>
      <DialogTitle className="text-2xl font-extrabold">Mensagem para {o.nome}</DialogTitle>
      <DialogDescription className="text-base">
        Situação: <strong>{o.situacao.texto}</strong> · {formatarReais(o.valor)}/mês
      </DialogDescription>

      {destinos.length === 0 ? (
        <p className="rounded-2xl bg-atencao-clara p-3 font-bold text-atencao-texto">Ninguém desta oficina tem WhatsApp cadastrado.</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-bold">Para quem</legend>
          {destinos.map((d, i) => (
            <label key={d.fone} className={cn("flex min-h-toque cursor-pointer items-center gap-3 rounded-2xl bg-superficie px-3", destino === i && "ring-2 ring-oficina")}>
              <input type="radio" name="destino" checked={destino === i} onChange={() => escolher(modelo, i)} className="size-5 accent-[var(--color-oficina)]" />
              <span className="text-base">
                <strong>{d.nome ?? "sem nome"}</strong> <span className="text-muted-foreground">({d.rotulo})</span>
                <br />
                {formatarTelefone(d.fone.slice(2))}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-base font-bold">Modelo</p>
        <div className="flex flex-wrap gap-2">
          {MODELOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => escolher(m.id, destino)}
              aria-pressed={modelo === m.id}
              className={cn("tocavel min-h-11 rounded-full px-3 text-sm font-bold", modelo === m.id ? "bg-oficina text-oficina-texto" : "bg-superficie")}
            >
              {m.nome}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-base font-bold">Texto (pode mudar)</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={9}
          className="rounded-2xl bg-superficie p-3 text-base outline-none focus:ring-2 focus:ring-oficina"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(texto);
            toast.success("Texto copiado");
          }}
          className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-superficie px-3 text-base font-bold"
        >
          <Copy aria-hidden className="size-5" /> Copiar
        </button>
        {fone ? (
          <a
            href={`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void registrarMensagem(o.id, modelo);
              onFechar();
            }}
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-3 text-base font-bold text-white"
          >
            <MessageCircle aria-hidden className="size-6" /> Abrir WhatsApp
          </a>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}
