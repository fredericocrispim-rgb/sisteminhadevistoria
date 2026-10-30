import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/site/blocos";
import { metadadosPagina } from "@/lib/site";

const caminho = "/laudo-de-vistoria-digital";

export const metadata: Metadata = metadadosPagina({
  titulo: "Laudo de Vistoria Digital com Assinatura | Vistoria Rápida",
  descricao: "Laudo e termo de vistoria digital em PDF: fotos datadas, avarias, km, assinatura do cliente e código para conferir. Faça o seu agora.",
  caminho,
});

export default function Pagina() {
  return (
    <PaginaConteudo
      caminho={[{ nome: "Laudo de vistoria digital", caminho }]}
      titulo="Laudo de vistoria digital"
      resumo="O termo de vistoria em PDF que a oficina envia ao cliente: tudo o que foi registrado, com assinatura e um código para conferir se é verdadeiro."
    >
      <h2>O que é o laudo de vistoria digital</h2>
      <p>
        O laudo de vistoria digital, que na Vistoria Rápida chamamos de <strong>termo de vistoria</strong>, é o documento gerado ao final de cada vistoria. Ele
        reúne em um PDF tudo o que foi registrado no celular: dados do veículo e do cliente, fotos, avarias, pneus, itens, observações e assinaturas.
      </p>
      <p>
        Esse termo é a prova de como o carro estava quando chegou à oficina, ou quando foi entregue. Se surgir uma dúvida depois, é ele que mostra o que foi
        combinado e assinado.
      </p>

      <h2>O que tem no PDF</h2>
      <h3>Cabeçalho com a sua logo</h3>
      <p>
        O termo sai com a logo da oficina, o tipo de vistoria (chegada ou entrega) e o número da vistoria. Para o cliente, é um documento da sua oficina.
      </p>
      <h3>Veículo e cliente</h3>
      <p>Placa, marca, modelo, cor, tipo de veículo, quilometragem, combustível e os dados do cliente, com o documento mascarado para proteger a privacidade.</p>
      <h3>Fotos com data e hora</h3>
      <p>
        As seis fotos guiadas (frente, traseira, lados, painel e motor) e a foto extra, se houver. Cada foto traz gravadas a data, a hora e a placa.
      </p>
      <h3>Riscos e amassados</h3>
      <p>
        O desenho do carro com cada avaria marcada e numerada, e uma lista com o tipo e o local de cada uma. Se não houver avarias, o termo diz isso de forma
        clara.
      </p>
      <h3>Pneus, itens e observações</h3>
      <p>O estado de cada pneu, incluindo o estepe, os itens conferidos no veículo e as observações escritas pela oficina.</p>
      <h3>Assinaturas</h3>
      <p>A assinatura do cliente, feita com o dedo na tela, e a assinatura do responsável da oficina, junto com o texto de aceite que o cliente confirmou.</p>
      <h3>Evidências do registro</h3>
      <p>
        A data e a hora em que a vistoria foi concluída, informações de onde ela foi feita, o código de autenticidade e um QR Code que leva à página de conferência.
      </p>

      <h2>Campos do termo de vistoria</h2>
      <ul>
        <li>Número da vistoria e tipo (chegada ou entrega)</li>
        <li>Placa, marca, modelo, cor e tipo de veículo</li>
        <li>Quilometragem e combustível</li>
        <li>Nome e contato do cliente</li>
        <li>Fotos guiadas com data e hora</li>
        <li>Mapa de avarias com a lista numerada</li>
        <li>Pneus e itens do veículo</li>
        <li>Observações</li>
        <li>Adendos (correções feitas depois de concluir)</li>
        <li>Assinaturas do cliente e da oficina</li>
        <li>Código de autenticidade e QR Code</li>
      </ul>

      <h2>Por que o termo não pode ser alterado</h2>
      <p>
        Depois de concluída, a vistoria fica travada. Ninguém consegue trocar uma foto, apagar uma avaria ou mudar a assinatura. Se for preciso corrigir alguma
        informação, a oficina registra um <strong>adendo</strong>: uma observação extra, com data, que aparece no termo sem apagar o registro original.
      </p>
      <p>
        Isso dá segurança para os dois lados. O cliente sabe que o documento não foi mexido depois que ele assinou, e a oficina tem um registro confiável para mostrar
        se houver reclamação.
      </p>

      <h2>Como conferir uma vistoria</h2>
      <p>
        Cada termo tem um código de autenticidade no formato SV-XXXX-XXXX e um QR Code. Para conferir se o documento é verdadeiro:
      </p>
      <ol>
        <li>
          Abra a página <Link href="/verificar">Conferir uma vistoria</Link>, ou aponte a câmera do celular para o QR Code do PDF.
        </li>
        <li>Digite o código de autenticidade que aparece no termo.</li>
        <li>Confira se a placa, a data e a oficina batem com o PDF que você tem em mãos.</li>
      </ol>
      <p>
        Qualquer pessoa pode fazer essa conferência: o dono do carro, um parente, uma seguradora ou um advogado. Não precisa ter conta.
      </p>

      <h2>Como o cliente recebe o laudo</h2>
      <p>
        Ao concluir, a oficina toca em &quot;Enviar para o cliente&quot; e o termo vai para o WhatsApp dele, junto com um link para ver as fotos no celular. O PDF
        também pode ser baixado e enviado por outro meio, se preferir.
      </p>
      <p>
        Quer entender todo o caminho até o termo? Veja <Link href="/como-funciona">como funciona o app de vistoria veicular</Link> ou a{" "}
        <Link href="/vistoria-de-carro-pelo-celular">vistoria de carro pelo celular</Link>.
      </p>
    </PaginaConteudo>
  );
}
