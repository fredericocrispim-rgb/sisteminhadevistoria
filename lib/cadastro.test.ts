import { describe, expect, it } from "vitest";
import { dataPassou, diasAte, fasePagamento, progressoCadastro } from "./cadastro";

// 20/10/2026 às 10h de Brasília
const agora = new Date("2026-10-20T10:00:00-03:00").getTime();

describe("teste grátis", () => {
  it("o último dia do teste ainda vale inteiro", () => {
    expect(dataPassou("2026-10-20", agora)).toBe(false);
    expect(diasAte("2026-10-20", agora)).toBe(1);
  });
  it("no dia seguinte já bloqueia", () => {
    expect(dataPassou("2026-10-19", agora)).toBe(true);
    expect(diasAte("2026-10-19", agora)).toBe(0);
  });
});

describe("cadastro", () => {
  it("conta nome, WhatsApp e logo", () => {
    expect(progressoCadastro({ nome_fantasia: "X", whatsapp: "1" }).pct).toBe(67);
    expect(progressoCadastro({ nome_fantasia: "X", whatsapp: "1", logo_app_url: "u" }).pct).toBe(100);
  });
});

describe("régua de cobrança (vence 20/10, carência 5 dias)", () => {
  const f = (hoje: string) => fasePagamento("2026-10-20", hoje, 5).fase;
  it("em dia até 4 dias antes", () => expect(f("2026-10-16")).toBe("em_dia"));
  it("3 dias antes já mostra o Pix", () => expect(f("2026-10-17")).toBe("vence_logo"));
  it("no dia do vencimento ainda é 'vence logo'", () => expect(f("2026-10-20")).toBe("vence_logo"));
  it("1 a 5 dias depois: em atraso, mas usa", () => {
    expect(f("2026-10-21")).toBe("atrasado");
    expect(f("2026-10-25")).toBe("atrasado");
  });
  it("6º dia de atraso: bloqueado", () => expect(f("2026-10-26")).toBe("bloqueado"));
  it("sem data de vencimento: bloqueado", () => expect(fasePagamento(null, "2026-10-20", 5).fase).toBe("bloqueado"));
});
