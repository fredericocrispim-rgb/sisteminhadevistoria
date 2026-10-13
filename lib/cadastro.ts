/** Quanto do cadastro da oficina está preenchido (0 a 100) e o que falta. */
export type CamposCadastro = {
  nome_fantasia?: string | null;
  cnpj_cpf?: string | null;
  whatsapp?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  cidade?: string | null;
  segmento?: string | null;
  logo_app_url?: string | null;
  email?: string | null;
};

const itens: { campo: keyof CamposCadastro; falta: string }[] = [
  { campo: "nome_fantasia", falta: "Nome da oficina" },
  { campo: "cnpj_cpf", falta: "CNPJ ou CPF" },
  { campo: "whatsapp", falta: "WhatsApp da oficina" },
  { campo: "logradouro", falta: "Endereço" },
  { campo: "cidade", falta: "Cidade" },
  { campo: "segmento", falta: "Tipo da oficina" },
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
