import { describe, expect, it } from "vitest";
import { cobrancasDoPeriodoPago, cobrancasParaValorNovo, faturaEmAberto, planosAVenda } from "./config";

const planos = [
  { nome: "Básico", video_segundos: 0 },
  { nome: "Pro", video_segundos: 60 },
];

describe("planosAVenda", () => {
  it("com o vídeo desligado, vende só o Básico", () => {
    expect(planosAVenda(planos, false).map((p) => p.nome)).toEqual(["Básico"]);
  });

  it("com o vídeo ligado, vende Básico e Pro", () => {
    expect(planosAVenda(planos, true).map((p) => p.nome)).toEqual(["Básico", "Pro"]);
  });

  it("sem plano com vídeo na tabela, vende só o Básico", () => {
    expect(planosAVenda([{ nome: "Básico", video_segundos: 0 }], true).map((p) => p.nome)).toEqual(["Básico"]);
  });
});

describe("faturaEmAberto", () => {
  it("com duas em aberto (o Asaas já gerou a do mês seguinte), escolhe a que vence primeiro", () => {
    const faturas = [
      { id: "dez", status: "pendente", vencimento: "2026-12-01" },
      { id: "nov", status: "pendente", vencimento: "2026-11-01" },
      { id: "out", status: "paga", vencimento: "2026-10-01" },
    ];
    expect(faturaEmAberto(faturas)?.id).toBe("nov");
  });

  it("vencida conta como em aberto; paga e cancelada não", () => {
    expect(faturaEmAberto([{ status: "vencida", vencimento: "2026-11-01" }])?.status).toBe("vencida");
    expect(faturaEmAberto([{ status: "paga", vencimento: "2026-11-01" }, { status: "cancelada", vencimento: "2026-12-01" }])).toBeUndefined();
    expect(faturaEmAberto(null)).toBeUndefined();
  });
});

describe("cobrancasParaValorNovo (mudou o plano)", () => {
  // Caso da S3: pagou até 20/12; o Asaas tinha a de 21/11 (sobrando) e a de 21/12 (próximo mês)
  const cobrancas = [
    { id: "nov", status: "PENDING", dueDate: "2026-11-21" },
    { id: "dez", status: "PENDING", dueDate: "2026-12-21" },
    { id: "out", status: "RECEIVED", dueDate: "2026-10-21" },
  ];

  it("só a cobrança do próximo período recebe o valor novo", () => {
    expect(cobrancasParaValorNovo(cobrancas, "2026-11-20", "2026-12-20").map((c) => c.id)).toEqual(["dez"]);
  });

  it("não mexe em cobrança vencida nem paga", () => {
    expect(cobrancasParaValorNovo(cobrancas, "2026-11-22", null).map((c) => c.id)).toEqual(["dez"]);
  });

  it("vencimento do Asaas um pouco antes do fim do período ainda conta como próximo", () => {
    expect(cobrancasParaValorNovo([{ id: "a", status: "PENDING", dueDate: "2026-12-18" }], "2026-11-22", "2026-12-20")).toHaveLength(1);
  });

  it("ainda no prazo de pagar (sem período pago): a 1ª cobrança já vem no plano escolhido", () => {
    expect(cobrancasParaValorNovo([{ id: "a", status: "PENDING", dueDate: "2026-11-21" }], "2026-11-20", null)).toHaveLength(1);
  });
});

describe("cobrancasDoPeriodoPago (marcado como pago à mão)", () => {
  it("tira a cobrança deste período e deixa a do mês seguinte", () => {
    const cobrancas = [
      { id: "nov", status: "PENDING", dueDate: "2026-11-21" },
      { id: "dez", status: "PENDING", dueDate: "2026-12-21" },
    ];
    expect(cobrancasDoPeriodoPago(cobrancas, "2026-12-20").map((c) => c.id)).toEqual(["nov"]);
  });

  it("também tira a vencida, mas nunca a paga", () => {
    const cobrancas = [
      { id: "venc", status: "OVERDUE", dueDate: "2026-11-21" },
      { id: "paga", status: "RECEIVED", dueDate: "2026-11-21" },
    ];
    expect(cobrancasDoPeriodoPago(cobrancas, "2026-12-20").map((c) => c.id)).toEqual(["venc"]);
  });
});
