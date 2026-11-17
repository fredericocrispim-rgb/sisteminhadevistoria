import { describe, expect, it } from "vitest";
import { cepValido, cvvValido, formatarCep, formatarNumeroCartao, formatarValidade, lerValidade, numeroCartaoValido } from "./cartao";

describe("cartão", () => {
  it("número confere pelo dígito verificador", () => {
    expect(numeroCartaoValido("4111 1111 1111 1111")).toBe(true);
    expect(numeroCartaoValido("4111 1111 1111 1112")).toBe(false);
    expect(numeroCartaoValido("1234")).toBe(false);
  });

  it("máscaras", () => {
    expect(formatarNumeroCartao("5162306048299858")).toBe("5162 3060 4829 9858");
    expect(formatarValidade("0830")).toBe("08/30");
    expect(formatarCep("75800000")).toBe("75800-000");
  });

  it("validade: mês certo e não vencida", () => {
    const hoje = new Date(2026, 10, 17); // nov/2026
    expect(lerValidade("08/30", hoje)).toEqual({ mes: "08", ano: "2030" });
    expect(lerValidade("11/26", hoje)).toEqual({ mes: "11", ano: "2026" });
    expect(lerValidade("10/26", hoje)).toBeNull();
    expect(lerValidade("13/30", hoje)).toBeNull();
    expect(lerValidade("8/3", hoje)).toBeNull();
  });

  it("CVV e CEP", () => {
    expect(cvvValido("318")).toBe(true);
    expect(cvvValido("12")).toBe(false);
    expect(cepValido("75800-000")).toBe(true);
    expect(cepValido("7580")).toBe(false);
  });
});
