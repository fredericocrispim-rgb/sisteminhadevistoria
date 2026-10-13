import { describe, expect, it } from "vitest";
import { dataPassou, diasAte, progressoCadastro } from "./cadastro";

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
