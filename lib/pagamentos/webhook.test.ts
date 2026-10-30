import { describe, expect, it, vi } from "vitest";
import { acaoDoEvento, receberWebhook, somarUmMes, tokenValido, type Deps, type EventoAsaas } from "./webhook";

const TOKEN = "token-de-teste-com-mais-de-32-caracteres-123";

const cobranca = {
  id: "pay_123",
  subscription: "sub_1",
  value: 49.9,
  status: "RECEIVED",
  billingType: "PIX",
  dueDate: "2026-11-01",
};

const evento = (e: Partial<EventoAsaas> = {}): EventoAsaas => ({ id: "evt_1", event: "PAYMENT_RECEIVED", payment: cobranca, ...e });

/** Banco de mentira: guarda os ids dos eventos como a tabela eventos_pagamento. */
function depsFalsas() {
  const recebidos = new Set<string>();
  const deps = {
    registrarEvento: vi.fn(async (e: EventoAsaas) => {
      if (recebidos.has(e.id)) return false;
      recebidos.add(e.id);
      return true;
    }),
    aplicar: vi.fn(async () => {}),
    concluirEvento: vi.fn(async () => {}),
    desfazerEvento: vi.fn(async (id: string) => {
      recebidos.delete(id);
    }),
    log: vi.fn(),
  } satisfies Deps;
  return deps;
}

const receber = (deps: Deps, corpo: unknown, token: string | null = TOKEN) =>
  receberWebhook({ token, tokenEsperado: TOKEN, corpo: JSON.stringify(corpo) }, deps);

describe("webhook do Asaas", () => {
  it("evento válido: processa e responde 200", async () => {
    const deps = depsFalsas();
    const r = await receber(deps, evento());
    expect(r.status).toBe(200);
    expect(deps.aplicar).toHaveBeenCalledWith({ tipo: "pago", cobranca }, expect.objectContaining({ id: "evt_1" }));
    expect(deps.concluirEvento).toHaveBeenCalledWith("evt_1");
  });

  it("token errado ou ausente: 401 e não processa", async () => {
    const deps = depsFalsas();
    expect((await receber(deps, evento(), "token-errado")).status).toBe(401);
    expect((await receber(deps, evento(), null)).status).toBe(401);
    expect(deps.registrarEvento).not.toHaveBeenCalled();
    expect(deps.aplicar).not.toHaveBeenCalled();
  });

  it("sem token configurado no servidor: recusa", async () => {
    const deps = depsFalsas();
    const r = await receberWebhook({ token: TOKEN, tokenEsperado: undefined, corpo: JSON.stringify(evento()) }, deps);
    expect(r.status).toBe(500);
    expect(deps.aplicar).not.toHaveBeenCalled();
  });

  it("evento repetido: responde 200 e não processa de novo", async () => {
    const deps = depsFalsas();
    await receber(deps, evento());
    const r = await receber(deps, evento());
    expect(r.status).toBe(200);
    expect(r.corpo.motivo).toBe("repetido");
    expect(deps.aplicar).toHaveBeenCalledTimes(1);
  });

  it("falha ao processar: 500 e libera para o Asaas mandar de novo", async () => {
    const deps = depsFalsas();
    deps.aplicar.mockRejectedValueOnce(new Error("banco fora"));
    expect((await receber(deps, evento())).status).toBe(500);
    expect(deps.desfazerEvento).toHaveBeenCalledWith("evt_1");
    expect((await receber(deps, evento())).status).toBe(200);
    expect(deps.aplicar).toHaveBeenCalledTimes(2);
  });

  it("corpo inválido: 400", async () => {
    const deps = depsFalsas();
    const r = await receberWebhook({ token: TOKEN, tokenEsperado: TOKEN, corpo: "não é json" }, deps);
    expect(r.status).toBe(400);
    expect((await receber(deps, { event: "PAYMENT_RECEIVED" })).status).toBe(400);
  });

  it("evento desconhecido: anota no log e responde 200", async () => {
    const deps = depsFalsas();
    const r = await receber(deps, evento({ event: "ALGO_NOVO" }));
    expect(r.status).toBe(200);
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("ALGO_NOVO"));
  });
});

describe("o que cada evento faz", () => {
  it("Pix recebido e cartão confirmado liberam", () => {
    expect(acaoDoEvento(evento({ event: "PAYMENT_RECEIVED" })).tipo).toBe("pago");
    expect(acaoDoEvento(evento({ event: "PAYMENT_CONFIRMED" })).tipo).toBe("pago");
  });
  it("vencida marca atraso; estorno e chargeback bloqueiam", () => {
    expect(acaoDoEvento(evento({ event: "PAYMENT_OVERDUE" })).tipo).toBe("atrasado");
    expect(acaoDoEvento(evento({ event: "PAYMENT_REFUNDED" })).tipo).toBe("estorno");
    expect(acaoDoEvento(evento({ event: "PAYMENT_CHARGEBACK_REQUESTED" })).tipo).toBe("estorno");
  });
  it("assinatura apagada ou inativada encerra", () => {
    expect(acaoDoEvento({ id: "e", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_1" } })).toEqual({
      tipo: "assinatura_encerrada",
      assinaturaId: "sub_1",
    });
    expect(acaoDoEvento({ id: "e", event: "SUBSCRIPTION_INACTIVATED", subscription: { id: "sub_1" } }).tipo).toBe("assinatura_encerrada");
  });
  it("cobrança nova fica pendente", () => {
    expect(acaoDoEvento(evento({ event: "PAYMENT_CREATED", payment: { ...cobranca, status: "PENDING" } })).tipo).toBe("cobranca");
  });
});

describe("datas e token", () => {
  it("soma um mês mantendo o dia (ou o último dia do mês)", () => {
    expect(somarUmMes("2026-11-10")).toBe("2026-12-10");
    expect(somarUmMes("2026-12-15")).toBe("2027-01-15");
    expect(somarUmMes("2027-01-31")).toBe("2027-02-28");
  });
  it("token só vale se for igual", () => {
    expect(tokenValido(TOKEN, TOKEN)).toBe(true);
    expect(tokenValido(`${TOKEN}x`, TOKEN)).toBe(false);
    expect(tokenValido("", TOKEN)).toBe(false);
  });
});
