/**
 * Perguntas frequentes do site. O MESMO texto aparece na página e nos dados estruturados (FAQPage) do Google.
 * Pergunta sem resposta confirmada fica de fora (não entra nem na página nem no Google).
 */
export type Pergunta = { pergunta: string; resposta: string };

export const PERGUNTAS_INICIO: Pergunta[] = [
  {
    pergunta: "O que é vistoria digital de veículo?",
    resposta:
      "É o registro do estado do carro feito pelo celular, com fotos, marcação de avarias e assinatura do cliente. No fim, o cliente recebe um termo em PDF pelo WhatsApp.",
  },
  {
    pergunta: "Quanto tempo leva uma vistoria?",
    resposta: "Cerca de 3 minutos, do início até o PDF chegar no WhatsApp do cliente.",
  },
  {
    pergunta: "Para que serve a vistoria de entrada na oficina?",
    resposta:
      "Para registrar riscos, amassados e a quilometragem antes do serviço. Se o cliente reclamar depois, você tem foto com data e a assinatura dele.",
  },
  {
    pergunta: "Preciso baixar algum aplicativo?",
    resposta:
      "Não. A Vistoria Rápida abre no navegador do celular, sem baixar nada da loja de aplicativos. Se quiser, você coloca o ícone na tela inicial do celular e abre como um app.",
  },
  {
    pergunta: "O cliente precisa ter conta para assinar?",
    resposta: "Não. O cliente assina com o dedo na tela do celular da oficina, na hora da vistoria, sem criar conta nem baixar nada.",
  },
  {
    pergunta: "Posso colocar a logo da minha oficina no laudo?",
    resposta: "Sim. O PDF enviado ao cliente sai com a logo da sua oficina.",
  },
  {
    pergunta: "Como o cliente sabe que a vistoria é verdadeira?",
    resposta: "Qualquer pessoa pode conferir a vistoria na página \"Conferir uma vistoria\" do site.",
  },
  {
    pergunta: "Como funciona o pagamento?",
    resposta:
      "É uma mensalidade. Você escolhe pagar por Pix, cartão ou boleto. No cartão, paga sozinho todo mês.",
  },
];

export const PERGUNTAS_PRECOS: Pergunta[] = [
  {
    pergunta: "Como posso pagar?",
    resposta: "Por Pix, cartão ou boleto. No cartão, a mensalidade é paga sozinha todo mês. No Pix e no boleto, o sistema mostra a cobrança na tela Meu plano.",
  },
  {
    pergunta: "Qual a diferença entre o Básico e o Pro?",
    resposta: "Os dois fazem a vistoria completa. O Pro também grava um vídeo de até 1 minuto em volta do carro, em cada vistoria.",
  },
  {
    pergunta: "Posso mudar de plano depois?",
    resposta: "Pode. O novo valor só vale a partir da próxima mensalidade.",
  },
  {
    pergunta: "Quando pago a primeira mensalidade?",
    resposta: "Depois de criar a conta, você tem 1 dia para fazer o primeiro pagamento.",
  },
  {
    pergunta: "E se eu atrasar uma mensalidade?",
    resposta:
      "Você tem alguns dias de tolerância e o sistema avisa antes. Se o atraso passar desse prazo, novas vistorias ficam bloqueadas até o pagamento, mas as vistorias antigas continuam guardadas para consulta.",
  },
  {
    pergunta: "Posso cadastrar a minha equipe?",
    resposta: "Sim. O plano já vem com você e mais 3 pessoas. Cada pessoa a mais custa R$ 19,90 por mês.",
  },
];
