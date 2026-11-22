import Link from "next/link";
import type { Segmento } from "@/components/site/segmento";

/** Textos das páginas por tipo de negócio. Curtos e simples: o público é leigo e está com pressa. */

const assinatura = { pergunta: "O cliente precisa baixar alguma coisa?", resposta: "Não. Ele assina com o dedo no seu celular e recebe o PDF no WhatsApp." };
const baixar = {
  pergunta: "Preciso baixar aplicativo?",
  resposta: "Não. Abre no navegador do celular, Android ou iPhone. Se quiser, coloque o ícone na tela inicial e use como um app.",
};

export const OFICINA: Segmento = {
  caminho: "/sistema-para-oficina",
  nome: "Sistema para oficina",
  titulo: "Sistema para oficina mecânica | Vistoria do carro pelo celular",
  descricao:
    "Sistema para oficina simples: vistoria do carro na chegada com fotos, riscos e assinatura do cliente. Evite prejuízo na oficina. PDF no WhatsApp em 3 minutos.",
  h1: "Sistema para oficina: chega de prejuízo com risco que você não fez",
  resumo: "Registre como o carro chegou, com fotos e a assinatura do cliente. Em 3 minutos, pelo celular.",
  problemas: ["Cliente diz que o risco é culpa da oficina", "Ficha de papel some ou molha", "Cada mecânico confere de um jeito", "Discussão no balcão"],
  solucoes: ["Foto com data e hora de cada lado", "Tudo guardado, ache pela placa", "Todo mundo segue o mesmo passo a passo", "Cliente assinou: assunto encerrado"],
  texto: (
    <>
      <h2>Administrando a oficina sem dor de cabeça</h2>
      <p>
        Quem está administrando uma oficina sabe: um único risco reclamado pode levar o lucro do serviço. A vistoria na entrada é a forma mais barata de evitar
        prejuízo na oficina. Na saída, faça a vistoria de entrega do mesmo jeito e o cliente leva o carro sabendo o que foi feito.
      </p>
      <p>
        Leia também: <Link href="/blog/como-administrar-oficina-mecanica">como administrar uma oficina mecânica</Link> e{" "}
        <Link href="/blog/como-evitar-prejuizo-na-oficina">como evitar prejuízo na oficina</Link>.
      </p>
    </>
  ),
  perguntas: [
    { pergunta: "Serve para funilaria e autocentro?", resposta: "Sim. Serve para qualquer lugar que recebe o carro do cliente: oficina, funilaria, autocentro, elétrica e guincho." },
    assinatura,
    baixar,
  ],
};

export const LOJA: Segmento = {
  caminho: "/sistema-para-loja-de-carros",
  nome: "Sistema para loja de carros",
  titulo: "Sistema para loja de carros | Vistoria de veículos digital",
  descricao:
    "Sistema para loja de carros e revenda: vistoria do veículo na compra, na troca e na entrega, com fotos, riscos e assinatura do cliente. PDF no WhatsApp.",
  h1: "Sistema para loja de carros: vistoria na compra, na troca e na entrega",
  resumo: "Registre o estado de cada carro que entra e sai da loja. Com fotos, riscos e a assinatura do cliente.",
  problemas: ["Carro de troca chega com defeito escondido", "Comprador reclama de risco depois da entrega", "Fotos espalhadas no celular de cada vendedor"],
  solucoes: ["Vistoria na entrada do carro de troca", "Cliente assina como recebeu o carro", "Tudo organizado pela placa, em um lugar só"],
  texto: (
    <>
      <h2>Vistoria de veículos digital para revenda</h2>
      <p>
        Na loja de carros, a vistoria protege nos dois lados: quando você compra ou pega um carro na troca, e quando entrega o carro vendido. O termo com fotos,
        quilometragem e assinatura fica guardado e pode ser conferido pelo código no site.
      </p>
    </>
  ),
  perguntas: [
    { pergunta: "Serve para moto e caminhão?", resposta: "Sim. A vistoria funciona para carros, motos e caminhões." },
    { pergunta: "Os vendedores podem usar?", resposta: "Sim. O plano já vem com você e mais 3 pessoas. Cada um entra com o seu acesso." },
    assinatura,
  ],
};

export const LAVA_JATO: Segmento = {
  caminho: "/sistema-para-lava-jato",
  nome: "Sistema para lava jato",
  titulo: "Sistema para lava jato | Vistoria do carro antes de lavar",
  descricao:
    "Sistema para lava jato e estética automotiva: vistoria do carro antes de lavar, com fotos e assinatura do cliente. Evite reclamação de risco. PDF no WhatsApp.",
  h1: "Sistema para lava jato: fotografe antes de lavar",
  resumo: "O cliente deixou o carro? Tire as fotos e marque os riscos antes de começar. Leva 3 minutos.",
  problemas: ["Cliente acha risco depois da lavagem", "Polimento: “estava melhor antes”", "Ninguém lembra como o carro chegou"],
  solucoes: ["Fotos de todos os lados antes de lavar", "Riscos marcados no desenho", "Cliente assina e recebe no WhatsApp"],
  texto: (
    <>
      <h2>Vistoria rápida para lava jato e estética automotiva</h2>
      <p>
        No lava jato o movimento é grande e o tempo é curto. Por isso a vistoria é rápida: botões grandes, poucas telas e nada para escrever. Serve também para
        polimento, higienização e vitrificação.
      </p>
    </>
  ),
  perguntas: [
    { pergunta: "Demora muito para fazer em cada carro?", resposta: "Não. Leva cerca de 3 minutos, do começo até o PDF chegar no WhatsApp do cliente." },
    assinatura,
    baixar,
  ],
};

export const FROTA: Segmento = {
  caminho: "/sistema-para-frotista",
  nome: "Sistema para frotista",
  titulo: "Sistema para frotista | Vistoria de veículos da frota pelo celular",
  descricao:
    "Sistema para frotista e locadora: vistoria de veículos na saída e na volta, com fotos, quilometragem, riscos e assinatura do motorista. Tudo pelo celular.",
  h1: "Sistema para frotista: saiba como o veículo saiu e como voltou",
  resumo: "Faça a vistoria na entrega e na devolução de cada veículo. Com fotos, quilometragem e a assinatura do motorista.",
  problemas: ["Veículo volta com avaria e ninguém sabe quem foi", "Checklist em papel que ninguém preenche", "Quilometragem anotada errado"],
  solucoes: ["Vistoria na saída e na volta, pela placa", "Motorista assina com o dedo", "Fotos com data e hora como prova"],
  texto: (
    <>
      <h2>Vistoria de veículos da frota, sem papel</h2>
      <p>
        Para frota de empresa, locadora, transportadora ou aplicativo. O motorista que pega o veículo assina a vistoria de saída. Na volta, faça a vistoria de
        entrega e compare. Ficou alguma dúvida? As fotos mostram.
      </p>
    </>
  ),
  perguntas: [
    { pergunta: "Serve para caminhão?", resposta: "Sim. A vistoria funciona para carros, motos e caminhões." },
    { pergunta: "Consigo achar a vistoria de um veículo depois?", resposta: "Sim. Todas ficam guardadas e você encontra buscando pela placa." },
    baixar,
  ],
};
