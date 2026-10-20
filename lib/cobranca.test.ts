import { describe, expect, it } from "vitest";
import { usuariosAMais, valorMensalidade } from "./cobranca";

const basico = { base: 49.9, inclusos: 3, extra: 9.9 };

describe("valorMensalidade", () => {
  it("até 3 usuários paga só o plano", () => {
    expect(valorMensalidade(basico, 1)).toBe(49.9);
    expect(valorMensalidade(basico, 3)).toBe(49.9);
  });
  it("cada usuário a mais soma R$ 9,90", () => {
    expect(valorMensalidade(basico, 4)).toBe(59.8);
    expect(valorMensalidade(basico, 5)).toBe(69.7);
    expect(valorMensalidade(basico, 13)).toBe(148.9);
  });
  it("sem limite de usuários não cobra a mais", () => {
    expect(valorMensalidade({ base: 199.9, inclusos: null, extra: 9.9 }, 50)).toBe(199.9);
    expect(usuariosAMais({ base: 199.9, inclusos: null, extra: 9.9 }, 50)).toBe(0);
  });
});
