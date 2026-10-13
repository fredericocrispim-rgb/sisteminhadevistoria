/**
 * Pix "copia e cola" e QR Code, SEM intermediário (sem Asaas, sem taxa).
 * Gera o código padrão do Banco Central (BR Code / EMV) a partir da chave Pix.
 * O pagamento cai direto na conta do dono da chave; a confirmação é manual (no /admin).
 *
 * Fase de validação do produto. Depois, a cobrança automática entra por lib/pagamentos.
 */

export type DadosPix = {
  /** Chave Pix: CPF/CNPJ (só números), e-mail, telefone (+5511...) ou chave aleatória. */
  chave: string;
  /** Nome de quem recebe (até 25 letras). */
  nome: string;
  /** Cidade de quem recebe (até 15 letras). */
  cidade: string;
  /** Valor em reais. Sem valor, quem paga digita. */
  valor?: number;
  /** Identificador do pagamento (até 25 letras/números), ex.: "OFICINA123OUT26". */
  identificador?: string;
  /** Texto curto que aparece para quem paga. */
  descricao?: string;
  /** QR fixo, que pode ser pago várias vezes (campo 01 = 11), igual ao que o banco Inter gera. Padrão: sim. */
  reutilizavel?: boolean;
};

function campo(id: string, valor: string): string {
  return `${id}${valor.length.toString().padStart(2, "0")}${valor}`;
}

/** Tira acentos e caracteres que alguns bancos não aceitam. */
function limpar(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,\-@+/]/g, "")
    .trim()
    .slice(0, max);
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no fim do código Pix. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Monta o código Pix "copia e cola". O mesmo texto vira o QR Code. */
export function gerarPixCopiaECola(d: DadosPix): string {
  const contaInfo =
    campo("00", "br.gov.bcb.pix") +
    campo("01", d.chave.trim()) +
    (d.descricao ? campo("02", limpar(d.descricao, 40)) : "");

  const identificador = (d.identificador ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  let codigo =
    campo("00", "01") +
    (d.reutilizavel === false ? "" : campo("01", "11")) +
    campo("26", contaInfo) +
    campo("52", "0000") +
    campo("53", "986") + // Real
    (d.valor && d.valor > 0 ? campo("54", d.valor.toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", limpar(d.nome, 25).toUpperCase()) +
    campo("60", limpar(d.cidade, 15).toUpperCase()) +
    campo("62", campo("05", identificador)) +
    "6304";

  codigo += crc16(codigo);
  return codigo;
}

/** R$ 1.234,56 */
export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
