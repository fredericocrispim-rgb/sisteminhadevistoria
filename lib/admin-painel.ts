/**
 * Regras do painel do administrador (Frederico): situação de cada oficina,
 * "último uso" em linguagem simples e as mensagens de cobrança pelo WhatsApp.
 * Funções puras (sem banco), com testes em admin-painel.test.ts.
 */
import { fasePagamento } from "@/lib/cadastro";
import { formatarReais } from "@/lib/pix";

export type GrupoSituacao = "teste" | "pagando" | "vence_logo" | "atrasado" | "bloqueado";

export type Situacao = {
  grupo: GrupoSituacao;
  texto: string;
  /** Data que vale agora (fim do teste ou vencimento), aaaa-mm-dd. */
  vencimento: string | null;
  diasParaVencer: number;
  diasAtraso: number;
  /** Bloqueado à mão no /admin (status cancelada/inadimplente). */
  bloqueioManual: boolean;
};

export const dataBR = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

/** Em que situação de pagamento a oficina está, com um texto curto para o selo. */
export function situacaoOficina(
  a: { status: string; fim_teste: string | null; proximo_vencimento: string | null; acesso_ate?: string | null } | null,
  hoje: string,
  carencia: number,
): Situacao {
  const teste = !a || a.status === "teste";
  const vencimento = (teste ? a?.fim_teste : a?.proximo_vencimento) ?? null;
  const r = fasePagamento(vencimento, hoje, teste ? 0 : carencia); // 1º pagamento: sem carência
  const base = { vencimento, diasParaVencer: r.diasParaVencer, diasAtraso: r.diasAtraso, bloqueioManual: false };
  // Cancelou a assinatura do Asaas, mas ainda tem dias pagos: usa até acesso_ate (igual a lib/sessao.ts)
  if (a?.status === "cancelada" && a.acesso_ate && a.acesso_ate >= hoje) {
    return { ...base, vencimento: a.acesso_ate, grupo: "vence_logo", texto: `Cancelou · usa até ${dataBR(a.acesso_ate)}` };
  }
  if (a && (a.status === "cancelada" || a.status === "inadimplente")) {
    return { ...base, grupo: "bloqueado", texto: "Bloqueado por você", bloqueioManual: true };
  }
  switch (r.fase) {
    case "em_dia":
      return teste
        ? { ...base, grupo: "teste", texto: `Teste: faltam ${dias(r.diasParaVencer + 1)}` }
        : { ...base, grupo: "pagando", texto: `Pago até ${dataBR(vencimento!)}` };
    case "vence_logo":
      return {
        ...base,
        grupo: "vence_logo",
        texto: `${teste ? "Teste acaba" : "Vence"} ${r.diasParaVencer === 0 ? "hoje" : `em ${dias(r.diasParaVencer)}`}`,
      };
    case "atrasado":
      return { ...base, grupo: "atrasado", texto: `${teste ? "Teste acabou" : "Atrasado"} há ${dias(r.diasAtraso)}` };
    default:
      return { ...base, grupo: "bloqueado", texto: vencimento ? `Bloqueado (${dias(r.diasAtraso)} sem pagar)` : "Bloqueado" };
  }
}

/** "agora há pouco", "há 3 horas", "ontem", "há 12 dias", "nunca". */
export function tempoDesde(iso: string | null, agora: number = Date.now()): string {
  if (!iso) return "nunca";
  const min = Math.floor((agora - Date.parse(iso)) / 60000);
  if (min < 15) return "agora há pouco";
  if (min < 60) return `há ${min} minutos`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 60) return `há ${d} dias`;
  const m = Math.floor(d / 30);
  return `há ${m} meses`;
}

/** Cor do "último uso": verde até 2 dias, amarelo até 7, vermelho depois (cliente esfriando). */
export function temperaturaUso(iso: string | null, agora: number = Date.now()): "quente" | "morno" | "frio" {
  if (!iso) return "frio";
  const d = (agora - Date.parse(iso)) / 86400000;
  if (d <= 2) return "quente";
  if (d <= 7) return "morno";
  return "frio";
}

export type ModeloMensagem = "boas_vindas" | "lembrete" | "atrasado" | "bloqueado" | "obrigado" | "sumiu";

export const MODELOS: { id: ModeloMensagem; nome: string }[] = [
  { id: "lembrete", nome: "Lembrete (vai vencer)" },
  { id: "atrasado", nome: "Cobrança (atrasado)" },
  { id: "bloqueado", nome: "Acesso bloqueado" },
  { id: "obrigado", nome: "Pagamento recebido" },
  { id: "boas_vindas", nome: "Como está o teste?" },
  { id: "sumiu", nome: "Parou de usar" },
];

/** Modelo que faz mais sentido para a situação da oficina. */
export function modeloSugerido(s: Situacao): ModeloMensagem {
  switch (s.grupo) {
    case "teste":
      return "boas_vindas";
    case "vence_logo":
      return "lembrete";
    case "atrasado":
      return "atrasado";
    case "bloqueado":
      return "bloqueado";
    default:
      return "obrigado";
  }
}

export type DadosMensagem = {
  nomePessoa: string | null;
  oficina: string;
  produto: string;
  teste: boolean;
  valor: number;
  vencimento: string | null;
  diasParaVencer: number;
  diasAtraso: number;
  /** Pix copia e cola com o valor da oficina (vazio se a chave Pix não estiver cadastrada). */
  pix: string | null;
  linkPlano: string;
};

/** Texto pronto para mandar pelo WhatsApp (o administrador ainda pode mudar antes de enviar). */
export function mensagemWhatsapp(modelo: ModeloMensagem, d: DadosMensagem): string {
  const ola = `Olá${d.nomePessoa ? `, ${d.nomePessoa.split(" ")[0]}` : ""}! Aqui é o Frederico, do ${d.produto}.`;
  const oQue = d.teste ? "O teste grátis" : "A mensalidade";
  const venc = d.vencimento ? dataBR(d.vencimento) : "";
  const quando = d.diasParaVencer === 0 ? "hoje" : d.diasParaVencer === 1 ? "amanhã" : `em ${venc}`;
  const pagar =
    `Valor: ${formatarReais(d.valor)}.` +
    (d.pix ? `\n\nPix copia e cola:\n${d.pix}` : "") +
    `\n\nOu pague pelo sistema: ${d.linkPlano}` +
    `\n\nDepois de pagar, me mande o comprovante por aqui.`;

  switch (modelo) {
    case "boas_vindas":
      return `${ola} Tudo certo com o teste na ${d.oficina}? Se precisar de ajuda para fazer a primeira vistoria, é só me chamar aqui.`;
    case "lembrete":
      return `${ola} Passando para lembrar: ${oQue.toLowerCase()} da ${d.oficina} vence ${quando}.\n\n${pagar}`;
    case "atrasado":
      return `${ola} ${oQue} da ${d.oficina} venceu em ${venc} e ainda não identifiquei o pagamento. Para não bloquear o acesso da equipe, faça o Pix assim que puder.\n\n${pagar}`;
    case "bloqueado":
      return `${ola} O acesso da ${d.oficina} ao sistema está bloqueado por falta de pagamento. Assim que o Pix cair, eu libero na hora.\n\n${pagar}`;
    case "obrigado":
      return `${ola} Recebi o pagamento da ${d.oficina}. Muito obrigado! O acesso está liberado${venc ? ` até ${venc}` : ""}.`;
    case "sumiu":
      return `${ola} Vi que a ${d.oficina} não usa o sistema há alguns dias. Aconteceu alguma coisa? Posso ajudar em algo?`;
  }
}
