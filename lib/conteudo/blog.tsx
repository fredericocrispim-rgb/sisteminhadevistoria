import Link from "next/link";

/**
 * Artigos do blog. Para publicar um novo: acrescente na lista ARTIGOS (o sitemap e a lista do /blog pegam sozinhos).
 * Pauta dos próximos artigos: docs/pauta-blog.md. Não publique artigo vazio.
 */
export type Artigo = {
  slug: string;
  titulo: string;
  descricao: string;
  publicadoEm: string; // aaaa-mm-dd
  atualizadoEm: string; // aaaa-mm-dd
  resumo: string;
  Conteudo: () => React.ReactNode;
};

export const ARTIGOS: Artigo[] = [
  {
    slug: "checklist-entrada-veiculo-oficina",
    titulo: "Checklist de entrada de veículo: o modelo completo para sua oficina",
    descricao: "Modelo completo de checklist de entrada de veículo para oficina mecânica: o que conferir, quais fotos tirar e como implantar com a equipe.",
    publicadoEm: "2026-10-30",
    atualizadoEm: "2026-10-30",
    resumo: "O que conferir quando o carro chega, quais fotos tirar e como fazer a equipe seguir o checklist todos os dias.",
    Conteudo: ChecklistEntradaVeiculo,
  },
];

export function artigoPorSlug(slug: string) {
  return ARTIGOS.find((a) => a.slug === slug);
}

/** Data dd/mm/aaaa a partir de aaaa-mm-dd. */
export function dataArtigo(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function ChecklistEntradaVeiculo() {
  return (
    <>
      <p>
        Toda oficina conhece a cena: o cliente chega para buscar o carro, dá uma volta em torno dele e aponta um risco no para-choque. &quot;Isso não estava
        aqui.&quot; Se ninguém conferiu o carro na chegada, não há como provar o contrário. O checklist de entrada de veículo existe para que essa conversa nunca
        aconteça, ou para que termine rápido, com a foto e a assinatura do cliente na mão.
      </p>
      <p>
        Neste artigo você encontra um modelo completo de checklist para oficina mecânica, a lista de fotos que não podem faltar e dicas práticas para a equipe
        usar o checklist todos os dias, sem atrasar o atendimento.
      </p>

      <h2>O que é o checklist de entrada de veículo</h2>
      <p>
        É uma lista de verificação feita no momento em que a oficina recebe o carro. Ela registra o estado da lataria, dos vidros, das luzes, dos pneus, do painel e
        do interior, além da quilometragem, do combustível e dos objetos que ficaram no veículo. No final, o cliente confere e assina.
      </p>
      <p>
        O checklist tem duas funções. A primeira é proteger a oficina: tudo o que já existia antes do serviço fica documentado. A segunda é padronizar o trabalho:
        qualquer pessoa da equipe confere os mesmos itens, na mesma ordem, e nada é esquecido.
      </p>

      <h2>Por que toda oficina precisa de um checklist</h2>
      <ul>
        <li>
          <strong>Evita prejuízo.</strong> Sem registro, a oficina acaba pagando reparos que não causou para não perder o cliente.
        </li>
        <li>
          <strong>Reduz discussões.</strong> Quando há foto com data e assinatura, a conversa termina em segundos.
        </li>
        <li>
          <strong>Mostra profissionalismo.</strong> O cliente percebe que a oficina cuida do carro dele desde a chegada.
        </li>
        <li>
          <strong>Ajuda no diagnóstico.</strong> Luzes de alerta no painel e quilometragem anotadas na entrada ajudam o mecânico a entender o problema.
        </li>
        <li>
          <strong>Organiza o pátio.</strong> Você sabe quais carros entraram, quando e em que estado.
        </li>
      </ul>

      <h2>Modelo de checklist de entrada de veículo</h2>
      <p>Use a lista abaixo como ponto de partida e adapte ao tipo de serviço da sua oficina.</p>

      <h3>1. Lataria e pintura</h3>
      <ul>
        <li>Riscos e arranhões em cada lado do carro</li>
        <li>Amassados em portas, capô, teto, para-lamas e tampa traseira</li>
        <li>Para-choques: trincas, raspados e encaixe</li>
        <li>Ferrugem e pintura descascando</li>
        <li>Retrovisores, frisos e emblemas</li>
      </ul>

      <h3>2. Vidros e luzes</h3>
      <ul>
        <li>Para-brisa com trinca, lasca ou marca de pedra</li>
        <li>Vidros laterais, vigia traseiro e palhetas</li>
        <li>Faróis, lanternas, setas e luz de freio</li>
      </ul>

      <h3>3. Pneus e rodas</h3>
      <ul>
        <li>Estado de cada pneu: bom, ruim ou ausente</li>
        <li>Estepe presente e em condições</li>
        <li>Rodas e calotas: riscos de meio-fio e peças faltando</li>
      </ul>

      <h3>4. Painel</h3>
      <ul>
        <li>Quilometragem na chegada</li>
        <li>Nível de combustível</li>
        <li>Luzes de alerta acesas: injeção, óleo, bateria, freio, airbag, ABS</li>
      </ul>

      <h3>5. Interior e objetos</h3>
      <ul>
        <li>Bancos, tapetes e forros</li>
        <li>Objetos de valor no carro (o ideal é o cliente levar)</li>
        <li>Documentos, controles e acessórios</li>
      </ul>

      <h3>6. Itens do veículo</h3>
      <ul>
        <li>Macaco, chave de roda e triângulo</li>
        <li>Antena e tampa do tanque</li>
        <li>Chave reserva e controle do alarme, se o cliente deixou</li>
      </ul>
      <p>
        Para motos e caminhões, a lógica é a mesma: adapte os itens (na moto, por exemplo, são dois pneus, carenagem, retrovisores e baú; no caminhão, entram
        a carroceria, o baú ou a caçamba e os pneus de cada eixo). O importante é que a lista seja sempre a mesma para o mesmo tipo de veículo.
      </p>
      <p>
        Uma versão organizada desta lista está na página <Link href="/checklist-de-entrada-de-veiculo">checklist de entrada de veículo para oficina</Link>.
      </p>

      <h2>As fotos que não podem faltar</h2>
      <p>
        O checklist diz o que foi conferido. A foto mostra como estava. As duas coisas juntas formam um registro difícil de contestar. Estas são as fotos mínimas:
      </p>
      <ol>
        <li>Frente, a cerca de 3 passos do carro</li>
        <li>Traseira, também a 3 passos</li>
        <li>Lado esquerdo, com o carro inteiro</li>
        <li>Lado direito, com o carro inteiro</li>
        <li>Painel com o carro ligado, mostrando km, combustível e luzes de alerta</li>
        <li>Motor com o capô aberto</li>
      </ol>
      <p>
        Se houver um risco pequeno ou uma peça faltando, tire uma foto de perto. E garanta que cada foto tenha data e hora: sem isso, ela prova pouco.
      </p>

      <h2>Como implantar o checklist na oficina</h2>
      <h3>Defina uma regra simples</h3>
      <p>
        &quot;Nenhum carro entra no pátio sem vistoria.&quot; Regras simples são mais fáceis de cumprir. Combine com a equipe e cobre nos primeiros dias, até virar
        hábito.
      </p>
      <h3>Faça com o cliente presente</h3>
      <p>
        Sempre que possível, confira o carro com o cliente ao lado. Ele vê o que está sendo anotado, concorda na hora e assina. Isso evita a sensação de que a
        oficina &quot;inventou&quot; um risco depois.
      </p>
      <h3>Repita na saída</h3>
      <p>
        Na entrega, faça a vistoria de saída e compare com a de entrada. Se o carro sai como entrou, ou com o serviço feito, o cliente leva o registro e a oficina
        fecha o atendimento com segurança.
      </p>
      <h3>Guarde tudo de forma organizada</h3>
      <p>
        O registro só ajuda se você conseguir encontrá-lo. Organize por placa e por data, para achar qualquer vistoria em segundos quando o cliente voltar com uma
        dúvida.
      </p>

      <h2>Erros comuns no checklist de entrada</h2>
      <ul>
        <li>Preencher depois que o cliente já foi embora, sem a assinatura dele.</li>
        <li>Escrever &quot;carro ok&quot; sem detalhar nada.</li>
        <li>Não anotar a quilometragem e o combustível.</li>
        <li>Fotos tremidas, escuras ou sem data.</li>
        <li>Ficha guardada em gaveta, que molha, rasga ou some.</li>
      </ul>

      <h2>Do papel para o celular</h2>
      <p>
        O checklist em papel resolve parte do problema, mas deixa de fora o principal: as fotos. Com a <Link href="/">Vistoria Rápida</Link>, o mesmo checklist é
        feito no celular, em cerca de 3 minutos. O app guia cada foto com um desenho do ângulo certo, grava data e hora em cada imagem, deixa marcar riscos e
        amassados no desenho do carro e colhe a assinatura do cliente com o dedo.
      </p>
      <p>
        No fim, o termo de vistoria em PDF, com a logo da sua oficina, vai direto para o WhatsApp do cliente. E qualquer pessoa pode conferir se o documento é
        verdadeiro na página <Link href="/verificar">Conferir uma vistoria</Link>. Veja <Link href="/como-funciona">como funciona o app de vistoria veicular</Link>.
      </p>

      <h2>Resumo</h2>
      <p>
        Um bom checklist de entrada de veículo confere lataria, vidros, luzes, pneus, painel, interior e itens; registra km e combustível; tem fotos com data e hora;
        e termina com a assinatura do cliente. Feito todos os dias, ele protege a oficina, organiza a equipe e passa confiança para quem deixa o carro com você.
      </p>
    </>
  );
}
