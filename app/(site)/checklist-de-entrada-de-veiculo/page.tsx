import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/site/blocos";
import { metadadosPagina } from "@/lib/site";

const caminho = "/checklist-de-entrada-de-veiculo";

export const metadata: Metadata = metadadosPagina({
  titulo: "Checklist de Entrada de Veículo para Oficina (Modelo)",
  descricao: "Modelo de checklist de entrada de veículo para oficina: lataria, vidros, pneus, painel, km, combustível e objetos. Use o modelo e faça no celular.",
  caminho,
});

const grupos: { titulo: string; itens: string[] }[] = [
  {
    titulo: "Lataria e pintura",
    itens: [
      "Riscos, arranhões e marcas de raspão em cada lado",
      "Amassados nas portas, capô, teto, para-lamas e tampa traseira",
      "Para-choques dianteiro e traseiro: trincas, encaixe e raspados",
      "Pontos de ferrugem e pintura descascando",
      "Retrovisores: capa, lente e regulagem",
      "Frisos, emblemas e borrachas faltando",
    ],
  },
  {
    titulo: "Vidros",
    itens: ["Para-brisa: trincas, lascas e marcas de pedra", "Vidros laterais e vigia traseiro", "Palhetas do limpador", "Películas rasgadas ou bolhas"],
  },
  {
    titulo: "Faróis e lanternas",
    itens: ["Faróis: lente trincada, amarelada ou com umidade", "Lanternas traseiras e luz de freio", "Setas e pisca-alerta", "Faróis de neblina, se houver"],
  },
  {
    titulo: "Pneus e rodas",
    itens: [
      "Estado de cada pneu: bom, ruim ou ausente",
      "Estepe: presente e em condições de uso",
      "Rodas e calotas: riscos de meio-fio, amassados e peças faltando",
      "Parafusos antifurto e chave de roda",
    ],
  },
  {
    titulo: "Painel, quilometragem e combustível",
    itens: [
      "Quilometragem registrada na chegada",
      "Nível de combustível (vazio, 1/4, 1/2, 3/4 ou cheio)",
      "Luzes de alerta acesas no painel (injeção, óleo, bateria, freio, airbag, ABS)",
      "Funcionamento do rádio ou central multimídia",
    ],
  },
  {
    titulo: "Interior e objetos no carro",
    itens: [
      "Bancos: rasgos, manchas e queimaduras",
      "Tapetes e forros",
      "Objetos de valor deixados no carro (anote ou peça para o cliente retirar)",
      "Documentos, controles de portão e acessórios",
    ],
  },
  {
    titulo: "Itens obrigatórios e acessórios",
    itens: ["Macaco", "Chave de roda", "Triângulo", "Antena", "Tampa do tanque", "Cópia da chave e controle do alarme, se entregues"],
  },
];

export default function Pagina() {
  return (
    <PaginaConteudo
      caminho={[{ nome: "Checklist de entrada de veículo", caminho }]}
      titulo="Checklist de entrada de veículo para oficina"
      resumo="Um modelo completo do que conferir quando o carro chega, para a sua equipe não esquecer nada e a oficina ter tudo registrado."
      chamada="Faça este checklist no celular, com fotos e assinatura."
    >
      <h2>Para que serve o checklist de entrada de veículo</h2>
      <p>
        O checklist de entrada é a lista de itens que a oficina confere no momento em que recebe o carro do cliente. Ele garante que toda vistoria seja feita do
        mesmo jeito, por qualquer pessoa da equipe, e que nenhum detalhe importante fique de fora.
      </p>
      <p>
        Quando o checklist é feito com fotos e assinatura do cliente, ele vira um registro que protege a oficina: se depois aparecer uma reclamação sobre um risco,
        um pneu ou um objeto, a resposta já está documentada.
      </p>

      <h2>Modelo de checklist de entrada de veículo</h2>
      <p>Use a lista abaixo como modelo. Adapte ao tipo de serviço da sua oficina.</p>
      {grupos.map((g) => (
        <section key={g.titulo}>
          <h3>{g.titulo}</h3>
          <ul>
            {g.itens.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}

      <h2>Fotos obrigatórias na entrada do veículo</h2>
      <p>Além do checklist, as fotos são a melhor prova do estado do carro. Na Vistoria Rápida, seis fotos são obrigatórias:</p>
      <ol>
        <li>
          <strong>Frente:</strong> a cerca de 3 passos do carro, pegando o para-choque e os faróis.
        </li>
        <li>
          <strong>Traseira:</strong> também a 3 passos, mostrando lanternas, para-choque e a placa.
        </li>
        <li>
          <strong>Lado esquerdo:</strong> o carro inteiro, de lado.
        </li>
        <li>
          <strong>Lado direito:</strong> o carro inteiro, de lado.
        </li>
        <li>
          <strong>Painel:</strong> com o carro ligado, mostrando a quilometragem, o combustível e as luzes de alerta.
        </li>
        <li>
          <strong>Motor com o capô aberto:</strong> mostrando o motor inteiro.
        </li>
      </ol>
      <p>Se houver um detalhe importante, como um risco pequeno ou uma peça faltando, tire uma foto extra de perto.</p>

      <h2>Como aplicar o checklist na rotina</h2>
      <ul>
        <li>Faça a conferência com o cliente presente, sempre que possível. Ele vê o que foi anotado e assina na hora.</li>
        <li>Combine que nenhum carro entra no pátio sem vistoria. É um hábito que protege todo mundo.</li>
        <li>Na entrega, faça a vistoria de saída e compare com a entrada.</li>
        <li>Guarde os registros de forma organizada, para encontrar qualquer vistoria pela placa.</li>
      </ul>

      <h2>Papel ou celular?</h2>
      <p>
        Você pode imprimir este checklist e usar no papel. Mas a ficha impressa tem os problemas de sempre: molha, rasga, some e não tem foto. Com a Vistoria
        Rápida, o mesmo checklist é feito no celular, com fotos datadas, riscos marcados no desenho do carro, pneus e itens conferidos e a assinatura do cliente com
        o dedo. O termo em PDF vai direto para o WhatsApp do cliente.
      </p>
      <p>
        Veja <Link href="/como-funciona">como funciona o app de vistoria veicular</Link> e leia o artigo{" "}
        <Link href="/blog/checklist-entrada-veiculo-oficina">Checklist de entrada de veículo: o modelo completo para sua oficina</Link>.
      </p>
    </PaginaConteudo>
  );
}
