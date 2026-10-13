import { describe, expect, it } from "vitest";
import {
  formatarKm,
  formatarPlaca,
  formatarTelefone,
  kmParaNumero,
  placaParaBanco,
  placaValida,
  telefoneParaWhatsapp,
  telefoneValido,
  tipoDaPlaca,
} from "./formatos";

describe("placa", () => {
  it("reconhece placa antiga e Mercosul", () => {
    expect(tipoDaPlaca("ABC1234")).toBe("antiga");
    expect(tipoDaPlaca("abc-1234")).toBe("antiga");
    expect(tipoDaPlaca("ABC1D23")).toBe("mercosul");
    expect(tipoDaPlaca("AB1234")).toBeNull();
    expect(placaValida("ABC12")).toBe(false);
  });

  it("formata enquanto digita", () => {
    expect(formatarPlaca("abc1234")).toBe("ABC-1234");
    expect(formatarPlaca("abc1d23")).toBe("ABC1D23");
    expect(formatarPlaca("ab")).toBe("AB");
    expect(formatarPlaca("ABC-12345678")).toBe("ABC-1234");
    expect(placaParaBanco("abc-1234")).toBe("ABC1234");
  });
});

describe("telefone", () => {
  it("formata celular e fixo", () => {
    expect(formatarTelefone("11987654321")).toBe("(11) 98765-4321");
    expect(formatarTelefone("1134567890")).toBe("(11) 3456-7890");
    expect(formatarTelefone("+55 11 98765-4321")).toBe("(11) 98765-4321");
    expect(formatarTelefone("11")).toBe("(11");
  });

  it("valida", () => {
    expect(telefoneValido("(11) 98765-4321")).toBe(true);
    expect(telefoneValido("(11) 3456-7890")).toBe(true);
    expect(telefoneValido("(11) 8765-432")).toBe(false);
    expect(telefoneValido("(11) 88765-4321")).toBe(false);
    expect(telefoneParaWhatsapp("(11) 98765-4321")).toBe("5511987654321");
  });
});

describe("km", () => {
  it("formata com ponto de milhar", () => {
    expect(formatarKm("45320")).toBe("45.320");
    expect(formatarKm("0045320")).toBe("45.320");
    expect(formatarKm("abc")).toBe("");
    expect(kmParaNumero("45.320")).toBe(45320);
    expect(kmParaNumero("")).toBeNull();
  });
});
