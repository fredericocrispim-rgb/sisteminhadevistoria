/** Quanto do cadastro da oficina está preenchido (0 a 100) e o que falta. */
export type CamposCadastro = {
  nome_fantasia?: string | null;
  whatsapp?: string | null;
  logo_app_url?: string | null;
};

const itens: { campo: keyof CamposCadastro; falta: string }[] = [
  { campo: "nome_fantasia", falta: "Nome da oficina" },
  { campo: "whatsapp", falta: "WhatsApp da oficina" },
  { campo: "logo_app_url", falta: "Logo" },
];

export function progressoCadastro(e: CamposCadastro) {
  const faltando = itens.filter((i) => !e[i.campo]).map((i) => i.falta);
  return {
    pct: Math.round(((itens.length - faltando.length) / itens.length) * 100),
    faltando,
  };
}

/** Dias que faltam até a data (fim do dia, horário de Brasília). Nunca negativo. */
export function diasAte(data: string, agora: number = Date.now()): number {
  const fim = new Date(`${data}T23:59:59-03:00`).getTime();
  return Math.max(0, Math.ceil((fim - agora) / 86400000));
}

/** A data (aaaa-mm-dd) já passou? Conta o dia inteiro no horário de Brasília. */
export function dataPassou(data: string, agora: number = Date.now()): boolean {
  return new Date(`${data}T23:59:59-03:00`).getTime() < agora;
}

/* ---------- Régua de cobrança ---------- */

/** Hoje (aaaa-mm-dd) no horário de Brasília. */
export function hojeBR(agora: number = Date.now()): string {
  return new Date(agora).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Diferença em dias entre duas datas aaaa-mm-dd (b - a). */
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

export type FasePagamento = "em_dia" | "vence_logo" | "atrasado" | "bloqueado";

export const DIAS_AVISO_ANTES = 3;

/**
 * Em que fase da cobrança a oficina está (vale para o fim do teste e para cada mensalidade):
 * - em_dia: faltam mais de 3 dias para vencer;
 * - vence_logo: faltam 3 dias ou menos (inclui o dia do vencimento) → mostra o Pix ao entrar;
 * - atrasado: venceu há até `carencia` dias → mostra o Pix com "Mensalidade em atraso", ainda usa;
 * - bloqueado: venceu há mais de `carencia` dias → só a tela do Pix.
 */
export function fasePagamento(vencimento: string | null, hoje: string, carencia: number) {
  if (!vencimento) return { fase: "bloqueado" as FasePagamento, diasParaVencer: 0, diasAtraso: 0 };
  const diasParaVencer = diasEntre(hoje, vencimento);
  const diasAtraso = Math.max(0, -diasParaVencer);
  let fase: FasePagamento;
  if (diasParaVencer > DIAS_AVISO_ANTES) fase = "em_dia";
  else if (diasParaVencer >= 0) fase = "vence_logo";
  else if (diasAtraso <= carencia) fase = "atrasado";
  else fase = "bloqueado";
  return { fase, diasParaVencer, diasAtraso };
}
