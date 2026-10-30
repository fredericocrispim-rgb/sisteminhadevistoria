"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Hourglass,
  Moon,
  TrendingUp,
  Wallet,
  X,
  CalendarClock,
  ChevronDown,
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
  pagamento: FormaPainel;
};

export type FormaPainel = "pix_manual" | "asaas_pix" | "asaas_cartao";

type Situ = "todas" | "teste" | "pagando" | "cobrar" | "bloqueado" | "inativas";
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
const NOME_PAGAMENTO: Record<FormaPainel, string> = { pix_manual: "Pix manual", asaas_pix: "Asaas · Pix", asaas_cartao: "Asaas · Cartão" };
const diaHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const paradaHaDias = (o: OficinaPainel, dias: number) => !o.ultimoUso || Date.now() - Date.parse(o.ultimoUso) > dias * 86400000;
const novaHaDias = (o: OficinaPainel, dias: number) => Date.now() - Date.parse(o.criadoEm) <= dias * 86400000;

/** Lista de oficinas do administrador: números, filtros, busca e um cartão por oficina. */
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

  const ativas = oficinas.filter((o) => o.ativa);
  const conta = (f: Situ) => oficinas.filter((o) => passaSituacao(o, f)).length;
  const pagantes = ativas.filter((o) => o.situacao.grupo !== "teste" && !o.teste);
  const receitaMes = pagantes.filter((o) => o.situacao.grupo !== "bloqueado").reduce((s, o) => s + o.valor, 0);
  const [desde30] = useState(() => Date.now() - 30 * 86400000);
  const recebido30 = oficinas.flatMap((o) => o.pagamentos).filter((p) => Date.parse(p.pagoEm) >= desde30).reduce((s, p) => s + p.valor, 0);
  const vistoriasMes = ativas.reduce((s, o) => s + o.vistoriasMes, 0);
  const semUso7 = ativas.filter((o) => paradaHaDias(o, 7)).length;

  const filtrando = situ !== "todas" || pagamento !== "todas" || uso !== "todos" || vendedor !== "todos" || cadastro !== "todos" || busca.trim() !== "";
  const limpar = () => {
    setSitu("todas");
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

  const blocos: { id: Situ; nome: string; valor: number; icone: ReactNode; cor: string }[] = [
    { id: "todas", nome: "Ativas", valor: ativas.length, icone: <Building2 aria-hidden />, cor: "bg-superficie text-foreground" },
    { id: "teste", nome: "Prazo de pagar", valor: conta("teste"), icone: <Hourglass aria-hidden />, cor: "bg-oficina-clara text-oficina" },
    { id: "pagando", nome: "Pagando", valor: conta("pagando"), icone: <CheckCircle2 aria-hidden />, cor: "bg-acao-clara text-acao" },
    { id: "cobrar", nome: "Para cobrar", valor: conta("cobrar"), icone: <AlertTriangle aria-hidden />, cor: "bg-atencao-clara text-atencao-texto" },
    { id: "bloqueado", nome: "Bloqueadas", valor: conta("bloqueado"), icone: <Lock aria-hidden />, cor: "bg-perigo-clara text-perigo" },
    { id: "inativas", nome: "Inativas", valor: conta("inativas"), icone: <Archive aria-hidden />, cor: "bg-superficie text-muted-foreground" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Dinheiro e uso" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero titulo="Por mês (quem paga)" valor={formatarReais(receitaMes)} icone={<Wallet aria-hidden />} destaque />
        <Numero titulo="Recebido em 30 dias" valor={formatarReais(recebido30)} icone={<TrendingUp aria-hidden />} />
        <Numero titulo="Vistorias no mês" valor={String(vistoriasMes)} icone={<ClipboardCheck aria-hidden />} />
        <Numero
          titulo="Sem uso há 7 dias"
          valor={String(semUso7)}
          icone={<Moon aria-hidden />}
          onClick={() => {
            setSitu("todas");
            setUso("7");
          }}
        />
      </section>

      <section
        aria-label="Situação"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6"
      >
        {blocos.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSitu(b.id)}
            aria-pressed={situ === b.id}
            className={cn(
              "tocavel flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-2xl border bg-background p-3 text-left shadow-sm transition-shadow hover:shadow-md",
              situ === b.id ? "border-oficina ring-2 ring-oficina" : "border-border",
            )}
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-5", b.cor)}>{b.icone}</span>
            <span className="flex flex-col leading-tight">
              <span className="text-2xl font-extrabold">{b.valor}</span>
              <span className="text-sm font-semibold text-muted-foreground">{b.nome}</span>
            </span>
          </button>
        ))}
      </section>

      <section aria-label="Filtros" className="flex flex-col gap-3 rounded-3xl border border-border bg-background p-4 shadow-sm">
        <label className="flex min-h-toque items-center gap-2 rounded-2xl bg-superficie px-4 focus-within:ring-2 focus-within:ring-oficina">
          <Search aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar oficina, pessoa, cidade ou telefone"
            aria-label="Buscar"
            className="min-w-0 flex-1 bg-transparent text-lg outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Escolha rotulo="Pagamento" valor={pagamento} onValor={(v) => setPagamento(v as FiltroPagamento)}>
            <option value="todas">Todos</option>
            <option value="pix_manual">Pix manual</option>
            <option value="asaas_pix">Asaas · Pix</option>
            <option value="asaas_cartao">Asaas · Cartão</option>
          </Escolha>
          <Escolha rotulo="Uso" valor={uso} onValor={(v) => setUso(v as FiltroUso)}>
            <option value="todos">Todos</option>
            <option value="recente">Usou nos últimos 2 dias</option>
            <option value="7">Sem uso há 7 dias</option>
            <option value="30">Sem uso há 30 dias</option>
            <option value="sem_vistoria">Nunca fez vistoria</option>
          </Escolha>
          <Escolha rotulo="Quem vendeu" valor={vendedor} onValor={setVendedor}>
            <option value="todos">Todos</option>
            <option value="eu">Eu mesmo</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Escolha>
          <Escolha rotulo="Cadastro" valor={cadastro} onValor={(v) => setCadastro(v as FiltroCadastro)}>
            <option value="todos">Qualquer data</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </Escolha>
          <Escolha rotulo="Ordenar" valor={ordem} onValor={(v) => setOrdem(v as Ordem)} className="col-span-2 lg:col-span-1">
            <option value="uso">Usou por último</option>
            <option value="vencimento">Vence primeiro</option>
            <option value="novas">Mais novas</option>
            <option value="vistorias">Mais vistorias</option>
            <option value="valor">Maior mensalidade</option>
            <option value="nome">Nome (A-Z)</option>
          </Escolha>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-semibold text-muted-foreground" aria-live="polite">
            {lista.length} {lista.length === 1 ? "oficina" : "oficinas"}
          </p>
          {filtrando && (
            <button type="button" onClick={limpar} className="tocavel inline-flex min-h-11 items-center gap-1.5 rounded-full bg-superficie px-4 text-sm font-bold">
              <X aria-hidden className="size-4" /> Limpar filtros
            </button>
          )}
        </div>
      </section>

      {lista.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-background p-8 text-center text-lg text-muted-foreground">
          Nenhuma oficina com esses filtros.
        </p>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {lista.map((o) => (
            <CartaoOficina key={o.id} oficina={o} onCobrar={() => setCobrar(o)} vendedores={vendedores} comissaoAtiva={comissaoAtiva} />
          ))}
        </ul>
      )}

      <JanelaWhatsapp oficina={cobrar} produto={produto} linkPlano={linkPlano} onFechar={() => setCobrar(null)} />
    </div>
  );
}

/** Número do resumo (dinheiro e uso). Com onClick, vira atalho de filtro. */
function Numero({ titulo, valor, icone, destaque, onClick }: { titulo: string; valor: string; icone: ReactNode; destaque?: boolean; onClick?: () => void }) {
  const conteudo = (
    <>
      <span className={cn("grid size-10 place-items-center rounded-xl [&_svg]:size-5", destaque ? "bg-white/20" : "bg-superficie text-oficina")}>{icone}</span>
      <span className="text-2xl font-extrabold">{valor}</span>
      <span className={cn("text-sm font-semibold", destaque ? "text-white/85" : "text-muted-foreground")}>{titulo}</span>
    </>
  );
  const classe = cn(
    "flex flex-col items-start gap-1 rounded-3xl p-4 text-left shadow-sm",
    destaque ? "bg-gradient-to-br from-marca-azul to-oficina text-white" : "border border-border bg-background",
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(classe, "tocavel transition-shadow hover:shadow-md")}>
      {conteudo}
    </button>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

/** Lista de escolha dos filtros, com o nome em cima. */
function Escolha({
  rotulo,
  valor,
  onValor,
  className,
  children,
}: {
  rotulo: string;
  valor: string;
  onValor: (v: string) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="px-1 text-sm font-bold text-muted-foreground">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => onValor(e.target.value)}
        className="min-h-toque w-full min-w-0 rounded-2xl bg-superficie px-3 text-base font-semibold outline-none focus:ring-2 focus:ring-oficina"
      >
        {children}
      </select>
    </label>
  );
}

function passaSituacao(o: OficinaPainel, f: Situ) {
  if (f === "inativas") return !o.ativa;
  if (!o.ativa) return false; // inativas só aparecem no filtro delas
  const g = o.situacao.grupo;
  switch (f) {
    case "todas":
      return true;
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

function CartaoOficina({
  oficina: o,
  onCobrar,
  vendedores,
  comissaoAtiva,
}: {
  oficina: OficinaPainel;
  onCobrar: () => void;
  vendedores: Vendedor[];
  comissaoAtiva: boolean;
}) {
  const vendedor = vendedores.find((v) => v.id === o.vendedorId);
  const [aberto, setAberto] = useState(false);
  const temp = temperaturaUso(o.ultimoUso);
  const r = o.responsavel;

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-3xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md",
        aberto && "xl:col-span-2",
      )}
    >
      <div className="flex items-start gap-3">
        <LogoOficina nome={o.nome} url={o.logo} tamanho="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{o.nome}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {o.ativa ? (
              <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-bold", COR_SITUACAO[o.situacao.grupo])}>{o.situacao.texto}</span>
            ) : (
              <span className="rounded-full bg-foreground px-2.5 py-0.5 text-sm font-bold text-background">
                Inativa{o.inativadaEm && ` desde ${new Date(o.inativadaEm).toLocaleDateString("pt-BR")}`}
              </span>
            )}
            <span className="rounded-full bg-superficie px-2.5 py-0.5 text-sm font-bold text-muted-foreground">{NOME_PAGAMENTO[o.pagamento]}</span>
            {vendedor && <span className="rounded-full bg-oficina-clara px-2.5 py-0.5 text-sm font-bold text-oficina">Vendedor: {vendedor.nome}</span>}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Dado rotulo="Último uso">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", COR_USO[temp])} />
            {tempoDesde(o.ultimoUso)}
          </span>
        </Dado>
        <Dado rotulo="Vistorias no mês">
          {o.vistoriasMes} <span className="font-semibold text-muted-foreground">/ {o.vistoriasTotal}</span>
        </Dado>
        <Dado rotulo="Mensalidade">{formatarReais(o.valor)}</Dado>
        <Dado rotulo="Responsável">
          <span className="block truncate">{r.nome ?? "sem nome"}</span>
        </Dado>
      </dl>

      <p className="text-sm text-muted-foreground">
        {[
          o.cidade,
          r.whatsapp && formatarTelefone(r.whatsapp),
          `cadastro ${new Date(o.criadoEm).toLocaleDateString("pt-BR")}`,
          o.ultimaMensagem && `sua última mensagem ${tempoDesde(o.ultimaMensagem)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCobrar}
          className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-3 text-base font-bold text-white"
        >
          <MessageCircle aria-hidden className="size-6" /> WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-superficie px-3 text-base font-bold"
        >
          {aberto ? "Fechar" : "Gerenciar"}
          <ChevronDown aria-hidden className={cn("size-5 transition-transform", aberto && "rotate-180")} />
        </button>
      </div>

      {aberto && <DetalhesOficina oficina={o} vendedores={vendedores} comissaoAtiva={comissaoAtiva} />}
    </li>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-superficie px-3 py-2">
      <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{rotulo}</dt>
      <dd className="text-base font-extrabold">{children}</dd>
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
    <div className="flex flex-col gap-4 border-t border-border pt-4">
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
