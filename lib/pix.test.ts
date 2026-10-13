import { describe, expect, it } from "vitest";
import { crc16, formatarReais, gerarPixCopiaECola } from "./pix";

describe("pix", () => {
  it("calcula o CRC16 padrão (CCITT-FALSE)", () => {
    // Valor de referência conhecido do CRC-16/CCITT-FALSE
    expect(crc16("123456789")).toBe("29B1");
  });

  it("gera o código copia e cola com valor e identificador", () => {
    const codigo = gerarPixCopiaECola({
      chave: "fulano@exemplo.com",
      nome: "Frederico Crispim",
      cidade: "São Paulo",
      valor: 49.9,
      identificador: "OFICINA-01",
    });
    expect(codigo.startsWith("000201010211")).toBe(true);
    expect(codigo).toContain("0014br.gov.bcb.pix0118fulano@exemplo.com");
    expect(codigo).toContain("540549.90");
    expect(codigo).toContain("5917FREDERICO CRISPIM");
    expect(codigo).toContain("6009SAO PAULO");
    expect(codigo).toContain("62130509OFICINA01");
    // CRC no fim confere com o resto do código
    expect(codigo.slice(-4)).toBe(crc16(codigo.slice(0, -4)));
  });

  it("sem valor e sem identificador usa ***", () => {
    const codigo = gerarPixCopiaECola({ chave: "12345678000199", nome: "Oficina", cidade: "Recife" });
    expect(codigo).not.toContain("5405");
    expect(codigo).toContain("62070503***");
  });

  it("gera exatamente o mesmo código que o banco Inter (QR da TUKA SOLUCOES)", () => {
    const inter =
      "00020101021126620014br.gov.bcb.pix0114363654100001830222Sisteminha de Vistoria520400005303986540549.905802BR5913TUKA SOLUCOES6007GOIANIA62070503***63042A58";
    const codigo = gerarPixCopiaECola({
      chave: "36365410000183",
      nome: "TUKA SOLUCOES",
      cidade: "GOIANIA",
      valor: 49.9,
      descricao: "Sisteminha de Vistoria",
    });
    expect(codigo).toBe(inter);
  });

  it("formata reais", () => {
    expect(formatarReais(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});
