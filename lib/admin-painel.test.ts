import { describe, expect, it } from "vitest";
import { mensagemWhatsapp, modeloSugerido, situacaoOficina, temperaturaUso, tempoDesde } from "./admin-painel";

describe("situacaoOficina", () => {
  const hoje = "2026-10-28";
  it("teste em dia", () => {
    const s = situacaoOficina({ status: "teste", fim_teste: "2026-11-04", proximo_vencimento: null }, hoje, 5);
    expect(s.grupo).toBe("teste");
    expect(s.texto).toBe("Teste: faltam 8 dias");
  });
  it("mensalidade vencendo amanhã", () => {
    const s = situacaoOficina({ status: "ativa", fim_teste: null, proximo_vencimento: "2026-10-29" }, hoje, 5);
    expect(s.grupo).toBe("vence_logo");
    expect(s.texto).toBe("Vence em 1 dia");
  });
  it("atrasado e depois bloqueado pela carência", () => {
    expect(situacaoOficina({ status: "ativa", fim_teste: null, proximo_vencimento: "2026-10-25" }, hoje, 5).grupo).toBe("atrasado");
    expect(situacaoOficina({ status: "ativa", fim_teste: null, proximo_vencimento: "2026-10-20" }, hoje, 5).grupo).toBe("bloqueado");
  });
  it("prazo de 1 dia do cadastro: venceu ontem, já bloqueia (sem carência)", () => {
    expect(situacaoOficina({ status: "teste", fim_teste: "2026-10-28", proximo_vencimento: null }, hoje, 5).grupo).toBe("vence_logo");
    expect(situacaoOficina({ status: "teste", fim_teste: "2026-10-27", proximo_vencimento: null }, hoje, 5).grupo).toBe("bloqueado");
  });
  it("bloqueio manual vence qualquer data", () => {
    const s = situacaoOficina({ status: "cancelada", fim_teste: null, proximo_vencimento: "2027-01-01" }, hoje, 5);
    expect(s.grupo).toBe("bloqueado");
    expect(s.bloqueioManual).toBe(true);
  });
});

describe("último uso", () => {
  const agora = Date.parse("2026-10-28T15:00:00Z");
  it("texto simples", () => {
    expect(tempoDesde(null, agora)).toBe("nunca");
    expect(tempoDesde("2026-10-28T14:55:00Z", agora)).toBe("agora há pouco");
    expect(tempoDesde("2026-10-28T12:00:00Z", agora)).toBe("há 3 horas");
    expect(tempoDesde("2026-10-27T10:00:00Z", agora)).toBe("ontem");
    expect(tempoDesde("2026-10-18T10:00:00Z", agora)).toBe("há 10 dias");
  });
  it("temperatura", () => {
    expect(temperaturaUso("2026-10-27T10:00:00Z", agora)).toBe("quente");
    expect(temperaturaUso("2026-10-23T10:00:00Z", agora)).toBe("morno");
    expect(temperaturaUso("2026-10-01T10:00:00Z", agora)).toBe("frio");
  });
});

describe("mensagens de cobrança", () => {
  const base = {
    nomePessoa: "João da Silva",
    oficina: "Auto Center Bom",
    produto: "Sisteminha de Vistoria",
    teste: false,
    valor: 49.9,
    vencimento: "2026-10-25",
    diasParaVencer: -3,
    diasAtraso: 3,
    pix: "000201PIX",
    linkPlano: "https://exemplo/plano",
  };
  it("cobrança de atraso tem nome, data, valor e Pix", () => {
    const m = mensagemWhatsapp("atrasado", base);
    expect(m).toContain("Olá, João!");
    expect(m).toContain("venceu em 25/10/2026");
    expect(m).toContain("R$");
    expect(m).toContain("000201PIX");
    expect(m).toContain("https://exemplo/plano");
  });
  it("sem Pix cadastrado, não mostra o bloco do Pix", () => {
    expect(mensagemWhatsapp("bloqueado", { ...base, pix: null })).not.toContain("copia e cola");
  });
  it("sugere o modelo pela situação", () => {
    const s = situacaoOficina({ status: "ativa", fim_teste: null, proximo_vencimento: "2026-10-25" }, "2026-10-28", 5);
    expect(modeloSugerido(s)).toBe("atrasado");
  });
});
