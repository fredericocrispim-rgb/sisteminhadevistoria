/**
 * Formatação e validação de campos (placa, telefone, km).
 * Funções puras: fáceis de testar (ver lib/formatos.test.ts).
 */

/** Deixa só letras e números, em maiúsculas. */
function soLetrasNumeros(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export type TipoPlaca = "antiga" | "mercosul";

/** Placa antiga: AAA9999. Mercosul: AAA9A99. */
export function tipoDaPlaca(valor: string): TipoPlaca | null {
  const p = soLetrasNumeros(valor);
  if (/^[A-Z]{3}[0-9]{4}$/.test(p)) return "antiga";
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p)) return "mercosul";
  return null;
}

export function placaValida(valor: string): boolean {
  return tipoDaPlaca(valor) !== null;
}

/**
 * Formata enquanto a pessoa digita: maiúsculas, no máximo 7 caracteres.
 * Placa antiga ganha hífen (ABC-1234); Mercosul fica junta (ABC1D23).
 */
export function formatarPlaca(valor: string): string {
  const p = soLetrasNumeros(valor).slice(0, 7);
  if (tipoDaPlaca(p) === "antiga") return `${p.slice(0, 3)}-${p.slice(3)}`;
  return p;
}

/** Placa só com letras e números, para gravar no banco. */
export function placaParaBanco(valor: string): string {
  return soLetrasNumeros(valor).slice(0, 7);
}

/** Telefone brasileiro: (11) 98765-4321 ou (11) 3456-7890. */
export function formatarTelefone(valor: string): string {
  let d = valor.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length === 11) return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
  return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
}

export function telefoneValido(valor: string): boolean {
  let d = valor.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return false;
  if (d[0] === "0") return false;
  // Celular (11 dígitos) começa com 9 depois do DDD
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

/** Formato internacional para WhatsApp: 5511987654321 */
export function telefoneParaWhatsapp(valor: string): string {
  let d = valor.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  return `55${d}`;
}

/** Km com ponto de milhar: 45320 → "45.320" */
export function formatarKm(valor: string): string {
  const d = valor.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 7);
  if (!d) return "";
  return Number(d).toLocaleString("pt-BR");
}

export function kmParaNumero(valor: string): number | null {
  const d = valor.replace(/\D/g, "");
  return d ? Number(d) : null;
}
