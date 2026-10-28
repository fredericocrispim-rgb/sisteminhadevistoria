/**
 * Comissão de venda (decisão do Frederico, 28/10/2026): quem vendeu a oficina recebe
 * `plataforma.comissao_percentual` (50%) de cada pagamento recebido dela.
 * Funções puras (sem banco), com testes em comissao.test.ts.
 */
import { formatarReais } from "@/lib/pix";

export type StatusComissao = "pendente" | "paga" | "cancelada";

export type Comissao = {
  id: string;
  vendedorId: string;
  empresaId: string;
  oficina: string;
  valorRecebido: number;
  /** Quando o Pix da oficina entrou (ISO). */
  recebidoEm: string;
  percentual: number;
  valor: number;
  status: StatusComissao;
  pagaEm: string | null;
};

export type FiltroComissoes = {
  /** "" = todos os vendedores */
  vendedorId: string;
  status: "pendente" | "paga" | "todas";
  /** aaaa-mm (mês em que o Pix da oficina entrou); "" = todos os meses */
  mes: string;
};

/** Comissão arredondada para centavos: 50% de R$ 49,90 = R$ 24,95. */
export function valorComissao(valorRecebido: number, percentual: number): number {
  return Math.round(valorRecebido * percentual) / 100;
}

/** Mês (aaaa-mm) de uma data, no fuso de São Paulo. */
export function mesDe(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10" → "outubro de 2026" */
export function nomeMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

/** Meses que têm comissão, do mais novo para o mais antigo. */
export function mesesComComissao(lista: Comissao[]): string[] {
  return [...new Set(lista.map((c) => mesDe(c.recebidoEm)))].sort().reverse();
}

export function filtrarComissoes(lista: Comissao[], f: FiltroComissoes): Comissao[] {
  return lista.filter(
    (c) =>
      c.status !== "cancelada" &&
      (!f.vendedorId || c.vendedorId === f.vendedorId) &&
      (f.status === "todas" || c.status === f.status) &&
      (!f.mes || mesDe(c.recebidoEm) === f.mes),
  );
}

export const somaComissoes = (lista: Comissao[]) => Math.round(lista.reduce((s, c) => s + c.valor, 0) * 100) / 100;

const dataBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/** Extrato para mandar ao vendedor pelo WhatsApp. */
export function textoExtratoVendedor(nomeVendedor: string, lista: Comissao[], mes: string, produto: string): string {
  const periodo = mes ? ` de ${nomeMes(mes)}` : "";
  const linhas = lista
    .slice()
    .sort((a, b) => a.recebidoEm.localeCompare(b.recebidoEm))
    .map((c) => `• ${dataBR(c.recebidoEm)} – ${c.oficina}: ${formatarReais(c.valorRecebido)} → ${formatarReais(c.valor)}`);
  return (
    `Olá, ${nomeVendedor.split(" ")[0]}! Aqui é o Frederico, do ${produto}.\n` +
    `Segue sua comissão${periodo}:\n\n${linhas.join("\n")}\n\n` +
    `Total: ${formatarReais(somaComissoes(lista))}`
  );
}

/** Planilha (CSV, separada por ponto e vírgula, abre direto no Excel em português). */
export function csvComissoes(lista: Comissao[], nomeVendedor: (id: string) => string): string {
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const campo = (t: string) => `"${t.replace(/"/g, '""')}"`;
  const linhas = lista.map((c) =>
    [
      campo(nomeVendedor(c.vendedorId)),
      campo(c.oficina),
      dataBR(c.recebidoEm),
      num(c.valorRecebido),
      num(c.percentual),
      num(c.valor),
      c.status === "paga" ? "Paga" : "A pagar",
      c.pagaEm ? dataBR(c.pagaEm) : "",
    ].join(";"),
  );
  return ["Vendedor;Oficina;Recebido em;Valor recebido;%;Comissão;Situação;Paga em", ...linhas].join("\r\n");
}
