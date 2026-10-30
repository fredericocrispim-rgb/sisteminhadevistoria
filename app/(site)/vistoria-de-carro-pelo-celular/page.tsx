import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/site/blocos";
import { metadadosPagina } from "@/lib/site";

const caminho = "/vistoria-de-carro-pelo-celular";

export const metadata: Metadata = metadadosPagina({
  titulo: "Vistoria de Carro pelo Celular em 3 Minutos",
  descricao: "Vistoria de carro pelo celular na oficina: fotos com data e hora, avarias no desenho e assinatura do cliente, sem prancheta. Comece agora.",
  caminho,
});

export default function Pagina() {
  return (
    <PaginaConteudo
      caminho={[{ nome: "Vistoria de carro pelo celular", caminho }]}
      titulo="Vistoria de carro pelo celular"
      resumo="Troque a prancheta pelo celular que você já tem no bolso e registre o estado do carro com fotos, avarias e assinatura em cerca de 3 minutos."
    >
      <h2>Celular x prancheta: o que muda na vistoria do carro</h2>
      <p>
        A prancheta com ficha de papel foi, por muitos anos, a forma de registrar o carro que chega na oficina. Ela funciona enquanto tudo dá certo. O problema
        aparece quando o cliente questiona alguma coisa e a ficha não ajuda: letra ilegível, campo em branco, nenhuma foto e, às vezes, nem a assinatura.
      </p>
      <p>Com a vistoria de carro pelo celular, a situação muda:</p>
      <ul>
        <li>
          <strong>Foto no lugar da descrição.</strong> Em vez de escrever &quot;risco na porta&quot;, você mostra a foto, com data e hora gravadas.
        </li>
        <li>
          <strong>Avaria no ponto exato.</strong> O risco ou amassado é marcado no desenho do carro, no lugar certo.
        </li>
        <li>
          <strong>Assinatura que não se perde.</strong> O cliente assina com o dedo e a assinatura fica no termo em PDF.
        </li>
        <li>
          <strong>Nada some.</strong> A vistoria fica guardada no sistema e pode ser encontrada pela placa a qualquer momento.
        </li>
        <li>
          <strong>Cliente informado na hora.</strong> O termo vai para o WhatsApp do cliente assim que a vistoria é concluída.
        </li>
      </ul>

      <h2>O que é registrado na vistoria do carro</h2>
      <p>Cada vistoria feita pelo celular reúne:</p>
      <ul>
        <li>Placa, marca, modelo, cor e tipo de veículo (carro, moto ou caminhão).</li>
        <li>Nome e contato do cliente.</li>
        <li>Seis fotos guiadas: frente, traseira, lado esquerdo, lado direito, painel e motor com o capô aberto, além de uma foto extra opcional.</li>
        <li>Quilometragem e nível de combustível, que aparecem na foto do painel.</li>
        <li>Riscos, amassados, peças quebradas, trincadas, faltando ou com ferrugem, marcados no desenho do carro.</li>
        <li>Estado de cada pneu, incluindo o estepe, e os itens do veículo.</li>
        <li>Observações da oficina.</li>
        <li>Assinatura do cliente e do responsável da oficina, e a data e a hora em que a vistoria foi concluída.</li>
      </ul>
      <p>
        Para não esquecer nada na conferência, use o nosso <Link href="/checklist-de-entrada-de-veiculo">checklist de entrada de veículo</Link>.
      </p>

      <h2>Como fazer a vistoria de carro pelo celular em 3 minutos</h2>
      <ol>
        <li>Abra a Vistoria Rápida no celular e toque em CHEGOU CARRO.</li>
        <li>Digite a placa e os dados do cliente.</li>
        <li>Siga o desenho de cada foto e aperte &quot;Tirar foto&quot;.</li>
        <li>Toque no desenho do carro onde houver risco ou amassado.</li>
        <li>Marque os pneus e os itens do veículo.</li>
        <li>Peça para o cliente conferir e assinar com o dedo.</li>
        <li>Conclua e envie o PDF para o WhatsApp do cliente.</li>
      </ol>
      <p>
        Veja cada tela em detalhe em <Link href="/como-funciona">como funciona o app de vistoria veicular</Link>.
      </p>

      <h2>Dicas para boas fotos no pátio</h2>
      <ul>
        <li>Fique a cerca de 3 passos do carro para pegar a frente e a traseira inteiras.</li>
        <li>Nas laterais, afaste-se até o carro inteiro caber na foto.</li>
        <li>Na foto do painel, deixe o carro ligado para aparecer a quilometragem e o combustível.</li>
        <li>Evite fotografar contra o sol; se precisar, mude de lado.</li>
        <li>Se um risco for pequeno, use a &quot;Outra foto&quot; para mostrar o detalhe de perto.</li>
      </ul>

      <h2>Importante: não é vistoria do Detran nem vistoria cautelar</h2>
      <p>
        A Vistoria Rápida é uma vistoria de entrada e saída feita pela própria oficina, para registrar o estado do veículo enquanto ele está sob seus cuidados.
      </p>
      <p>
        <strong>Ela não substitui a vistoria do Detran</strong> (feita para transferência, emplacamento ou regularização do veículo) <strong>nem a vistoria
        cautelar</strong> (feita por empresas credenciadas para verificar a procedência e a estrutura do veículo antes de uma compra). Esses serviços seguem regras
        próprias e são feitos por órgãos ou empresas autorizados.
      </p>
      <p>
        O objetivo aqui é outro: proteger a oficina e o cliente, registrando como o carro chegou e como foi entregue.
      </p>

      <h2>Funciona em qualquer celular?</h2>
      <p>
        Funciona em celulares Android e iPhone com câmera e um navegador atualizado. Não é preciso baixar nada da loja de aplicativos. Também dá para abrir no
        computador para consultar as vistorias e reenviar o PDF.
      </p>
      <p>
        O documento final é o termo de vistoria em PDF. Entenda o que vem nele na página <Link href="/laudo-de-vistoria-digital">laudo de vistoria digital</Link>.
      </p>
    </PaginaConteudo>
  );
}
