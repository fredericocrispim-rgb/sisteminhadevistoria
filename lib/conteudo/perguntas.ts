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
      "O pagamento é por Pix, sem cartão de crédito. A mensalidade é paga pelo QR Code ou pelo Pix copia e cola, que aparecem na tela Meu plano do sistema.",
  },
];

export const PERGUNTAS_PRECOS: Pergunta[] = [
  {
    pergunta: "Preciso de cartão de crédito?",
    resposta: "Não. O pagamento é só por Pix, pelo QR Code ou pelo Pix copia e cola que aparecem na tela Meu plano.",
  },
  {
    pergunta: "Quando pago a primeira mensalidade?",
    resposta: "Depois de criar a conta, a oficina tem 1 dia para pagar a primeira mensalidade pelo Pix.",
  },
  {
    pergunta: "E se eu atrasar uma mensalidade?",
    resposta:
      "Você tem alguns dias de tolerância e o sistema avisa antes. Se o atraso passar desse prazo, novas vistorias ficam bloqueadas até o pagamento, mas as vistorias antigas continuam guardadas para consulta.",
  },
  {
    pergunta: "Posso cadastrar a minha equipe?",
    resposta: "Sim. O dono da oficina cadastra a equipe e escolhe o papel de cada pessoa: gerente ou vistoriador.",
  },
];
