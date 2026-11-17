/**
 * Conferência e máscara do cartão (navegador e servidor). Não guarda nada: o número e o CVV
 * só passam pelo servidor para ir ao Asaas.
 */

const so = (v: string) => v.replace(/\D/g, "");

/** Número do cartão confere pelo dígito verificador (Luhn), com 13 a 19 números. */
export function numeroCartaoValido(v: string) {
  const n = so(v);
  if (n.length < 13 || n.length > 19) return false;
  let soma = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
  }
  return soma % 10 === 0;
}

/** "1234567812345678" → "1234 5678 1234 5678" */
export function formatarNumeroCartao(v: string) {
  return so(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "0830" → "08/30" */
export function formatarValidade(v: string) {
  const n = so(v).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

/** Validade MM/AA: mês de 01 a 12 e ainda não vencida. Devolve mês e ano com 4 números. */
export function lerValidade(v: string, hoje = new Date()): { mes: string; ano: string } | null {
  const n = so(v);
  if (n.length !== 4) return null;
  const mes = Number(n.slice(0, 2));
  const ano = 2000 + Number(n.slice(2));
  if (mes < 1 || mes > 12) return null;
  const agora = hoje.getFullYear() * 12 + hoje.getMonth() + 1;
  if (ano * 12 + mes < agora) return null;
  return { mes: n.slice(0, 2), ano: String(ano) };
}

export function cvvValido(v: string) {
  return /^\d{3,4}$/.test(so(v));
}

export function cepValido(v: string) {
  return so(v).length === 8;
}

/** "75800000" → "75800-000" */
export function formatarCep(v: string) {
  const n = so(v).slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
}
