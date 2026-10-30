import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/site/blocos";
import { metadadosPagina } from "@/lib/site";

const caminho = "/vistoria-digital-para-oficinas";

export const metadata: Metadata = metadadosPagina({
  titulo: "Vistoria Digital para Oficinas Mecânicas | Vistoria Rápida",
  descricao: "Vistoria de entrada e saída para oficina mecânica pelo celular: fotos, riscos no desenho e assinatura do cliente. Menos discussão. Comece agora.",
  caminho,
});

export default function Pagina() {
  return (
    <PaginaConteudo
      caminho={[{ nome: "Para oficinas", caminho }]}
      titulo="Vistoria digital para oficinas mecânicas"
      resumo="Uma vistoria de entrada e saída simples, feita pelo celular, que protege a oficina e passa confiança para o cliente."
    >
      <h2>As dores de toda oficina na hora de receber o carro</h2>
      <p>
        O dia a dia de uma oficina mecânica é corrido. O carro chega, o cliente explica o problema com pressa, deixa a chave no balcão e vai embora. Quase sempre
        ninguém tem tempo de olhar o veículo com calma. E é justamente nesse momento que nascem os problemas que aparecem dias depois.
      </p>
      <p>Algumas situações se repetem em quase todas as oficinas:</p>
      <ul>
        <li>O cliente volta e diz que o risco na porta, o para-choque raspado ou a calota quebrada não estavam lá quando ele deixou o carro.</li>
        <li>Alguém pergunta pelo estepe, pelo macaco ou por um objeto que estava no porta-luvas, e ninguém sabe dizer se ele estava no carro.</li>
        <li>A quilometragem e o nível de combustível na chegada não foram anotados, e o cliente desconfia que o carro foi usado.</li>
        <li>A ficha de papel foi preenchida pela metade, com letra difícil de ler, ou simplesmente sumiu.</li>
      </ul>
      <p>
        Sem registro, cada uma dessas conversas vira palavra contra palavra. Muitas vezes a oficina acaba pagando um reparo que não causou, só para não perder o
        cliente. Outras vezes perde o cliente do mesmo jeito.
      </p>

      <h2>O que é a vistoria de entrada e saída na oficina mecânica</h2>
      <p>
        A vistoria de entrada é o registro do estado do veículo no momento em que ele chega: lataria, vidros, faróis, pneus, painel, quilometragem, combustível e
        os itens que estão dentro do carro. A vistoria de saída repete o registro na hora da entrega, para mostrar que o carro sai como entrou, ou com o serviço
        feito.
      </p>
      <p>
        Com a vistoria digital, esse registro deixa de ser uma ficha de papel e passa a ser um documento com fotos datadas, avarias marcadas no desenho do carro e a
        assinatura do cliente. Na Vistoria Rápida, você escolhe na tela inicial se é <strong>CHEGOU CARRO</strong> ou <strong>ENTREGAR CARRO</strong>, e o app
        guia o resto.
      </p>
      <p>
        Na entrega, a vistoria de saída mostra também os riscos que já tinham sido registrados na chegada. Assim fica fácil comparar o antes e o depois e mostrar ao
        cliente que nada mudou.
      </p>

      <h2>Como a vistoria digital funciona na rotina da oficina</h2>
      <ol>
        <li>O recepcionista ou o mecânico toca em CHEGOU CARRO e preenche a placa, o veículo e o cliente.</li>
        <li>Tira as fotos guiadas: frente, traseira, os dois lados, o painel e o motor com o capô aberto.</li>
        <li>Marca no desenho do carro os riscos, amassados, peças quebradas ou trincadas.</li>
        <li>Confere os pneus e os itens do veículo, como estepe e macaco.</li>
        <li>O cliente confere e assina com o dedo. Depois a oficina assina e conclui.</li>
        <li>O termo em PDF, com a logo da oficina, vai para o WhatsApp do cliente.</li>
      </ol>
      <p>
        Tudo leva cerca de 3 minutos. Se quiser os detalhes de cada tela, veja <Link href="/como-funciona">como funciona o app de vistoria veicular</Link>.
      </p>

      <h2>Ganhos para a equipe</h2>
      <h3>Todo mundo faz do mesmo jeito</h3>
      <p>
        A vistoria segue sempre as mesmas etapas e as mesmas fotos. Não importa se quem recebeu o carro foi o dono, o gerente ou o mecânico mais novo: o resultado é
        o mesmo. Isso evita esquecimentos e deixa a oficina com um padrão de atendimento que o cliente percebe.
      </p>
      <h3>Cada pessoa vê só o que precisa</h3>
      <p>
        O dono cadastra a equipe e define o papel de cada um. O vistoriador faz as vistorias e vê o pátio. O gerente acompanha tudo. Só o dono cuida do plano e do
        pagamento.
      </p>
      <h3>Menos tempo no balcão</h3>
      <p>
        Com o registro feito na chegada, a conversa da entrega fica mais curta. Se aparecer uma dúvida, a resposta está nas fotos, com data e hora, e na assinatura
        do cliente.
      </p>
      <h3>Veículos no pátio sempre à vista</h3>
      <p>
        A tela de veículos no pátio mostra quais carros entraram e ainda não foram entregues. E qualquer vistoria antiga pode ser encontrada pela placa.
      </p>

      <h2>Ganhos para o cliente da oficina</h2>
      <p>
        O cliente recebe no WhatsApp um termo organizado, com fotos e a logo da oficina. Isso transmite cuidado e profissionalismo. Ele sabe exatamente como o carro
        foi deixado e pode conferir a autenticidade do documento na página <Link href="/verificar">Conferir uma vistoria</Link>.
      </p>
      <p>
        Uma oficina que registra tudo com clareza costuma ter menos reclamações e mais clientes que voltam e indicam. Para entender o documento, veja o que vem no{" "}
        <Link href="/laudo-de-vistoria-digital">laudo de vistoria digital</Link>.
      </p>

      <h2>Para quem a Vistoria Rápida foi feita</h2>
      <p>
        Oficinas mecânicas, funilarias, autocentros, centros automotivos e guinchos que recebem veículos de clientes e precisam registrar o estado deles. A vistoria
        serve para carros, motos e caminhões.
      </p>
      <p>
        Quer um ponto de partida? Use o nosso <Link href="/checklist-de-entrada-de-veiculo">checklist de entrada de veículo</Link> como modelo para treinar a equipe.
      </p>
    </PaginaConteudo>
  );
}
