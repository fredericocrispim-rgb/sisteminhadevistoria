import { describe, expect, it } from "vitest";
import { planosAVenda } from "./config";

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
