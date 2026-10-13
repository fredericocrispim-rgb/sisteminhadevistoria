import { describe, expect, it } from "vitest";
import { CORES_PRONTAS, contraste, corDominante, corSeguraParaTextoBranco, iniciais } from "./cores";

describe("cores", () => {
  it("escurece cor clara até o texto branco ficar legível", () => {
    const c = corSeguraParaTextoBranco("#ffd700");
    expect(contraste(c, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(corSeguraParaTextoBranco("#1d4ed8")).toBe("#1d4ed8");
  });
  it("cores prontas são legíveis", () => {
    for (const c of CORES_PRONTAS) expect(contraste(c, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
  it("acha a cor dominante ignorando branco", () => {
    const px = new Uint8ClampedArray([
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, // branco
      200, 20, 20, 255, 202, 22, 18, 255, // vermelho
      20, 20, 200, 255, // azul
    ]);
    expect(corDominante(px)).toBe("#c91513");
    expect(corDominante(new Uint8ClampedArray([255, 255, 255, 255]))).toBeNull();
  });
  it("iniciais", () => {
    expect(iniciais("Auto Center Silva")).toBe("AS");
    expect(iniciais("Oficina do João LTDA")).toBe("OJ");
    expect(iniciais("Mecânica")).toBe("ME");
  });
});
