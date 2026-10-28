import { describe, expect, it } from "vitest";
import { csvComissoes, filtrarComissoes, mesDe, mesesComComissao, nomeMes, somaComissoes, textoExtratoVendedor, valorComissao, type Comissao } from "./comissao";

const c = (id: string, vendedorId: string, recebidoEm: string, status: Comissao["status"], valor = 24.95): Comissao => ({
  id,
  vendedorId,
  empresaId: "e" + id,
  oficina: "Oficina " + id,
  valorRecebido: 49.9,
  recebidoEm,
  percentual: 50,
  valor,
  status,
  pagaEm: status === "paga" ? "2026-10-30T15:00:00Z" : null,
});

const lista = [
  c("1", "ana", "2026-10-05T15:00:00Z", "pendente"),
  c("2", "ana", "2026-09-20T15:00:00Z", "paga"),
  c("3", "beto", "2026-10-10T15:00:00Z", "pendente", 34.9),
  c("4", "beto", "2026-10-11T15:00:00Z", "cancelada"),
];

describe("comissão", () => {
  it("50% arredondado para centavos", () => {
    expect(valorComissao(49.9, 50)).toBe(24.95);
    expect(valorComissao(69.8, 50)).toBe(34.9);
    expect(valorComissao(0.01, 50)).toBe(0.01);
  });
  it("mês no fuso de São Paulo (dia 1º à meia-noite e meia ainda é o mês anterior em UTC)", () => {
    expect(mesDe("2026-11-01T02:30:00Z")).toBe("2026-10");
    expect(nomeMes("2026-10")).toBe("outubro de 2026");
  });
  it("filtra por vendedor, situação e mês; nunca mostra canceladas", () => {
    expect(filtrarComissoes(lista, { vendedorId: "", status: "todas", mes: "" }).map((x) => x.id)).toEqual(["1", "2", "3"]);
    expect(filtrarComissoes(lista, { vendedorId: "ana", status: "pendente", mes: "" }).map((x) => x.id)).toEqual(["1"]);
    expect(filtrarComissoes(lista, { vendedorId: "", status: "todas", mes: "2026-10" }).map((x) => x.id)).toEqual(["1", "3"]);
    expect(somaComissoes(filtrarComissoes(lista, { vendedorId: "", status: "pendente", mes: "" }))).toBe(59.85);
    expect(mesesComComissao(lista)).toEqual(["2026-10", "2026-09"]);
  });
  it("extrato e planilha", () => {
    const t = textoExtratoVendedor("Ana Paula", [lista[0]], "2026-10", "Sisteminha de Vistoria");
    expect(t).toContain("Olá, Ana!");
    expect(t).toContain("outubro de 2026");
    expect(t).toContain("Oficina 1");
    const csv = csvComissoes([lista[0]], () => "Ana");
    expect(csv.split("\r\n")[1]).toBe('"Ana";"Oficina 1";05/10/2026;49,90;50,00;24,95;A pagar;');
  });
});
