import { describe, expect, it } from "vitest";
import { faturaEmAberto, planosAVenda } from "./config";

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
