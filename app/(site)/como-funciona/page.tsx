import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/site/blocos";
import { metadadosPagina } from "@/lib/site";

const caminho = "/como-funciona";

export const metadata: Metadata = metadadosPagina({
  titulo: "Como Funciona o App de Vistoria Veicular | Vistoria Rápida",
  descricao: "Veja o passo a passo do app de vistoria veicular: fotos guiadas, riscos no desenho, assinatura do cliente e PDF no WhatsApp. Faça a sua agora.",
  caminho,
});

export default function Pagina() {
  return (
    <PaginaConteudo
      caminho={[{ nome: "Como funciona", caminho }]}
      titulo="Como funciona o app de vistoria veicular"
      resumo="Seis telas simples, uma tarefa por vez. Em cerca de 3 minutos o carro está registrado e o cliente recebe o termo no WhatsApp."
    >
      <h2>Um app de vistoria veicular feito para o pátio</h2>
      <p>
        A Vistoria Rápida foi desenhada para quem trabalha no pátio: recepcionista, mecânico, funileiro ou motorista de guincho. Por isso cada tela tem uma única
        tarefa, um botão principal grande e verde embaixo, ao alcance do polegar, e pouco texto. Uma barra no alto mostra em qual passo você está, e o botão Voltar
        está sempre visível.
      </p>
      <p>
        O que você faz vai sendo salvo durante a vistoria. Se for interrompido no meio, é só voltar: na tela inicial, um aviso de &quot;Continuar&quot; leva
        direto para a vistoria que ficou aberta.
      </p>

      <h2>Começar: CHEGOU CARRO ou ENTREGAR CARRO</h2>
      <p>
        Na tela inicial há dois botões grandes. <strong>CHEGOU CARRO</strong> abre a vistoria de entrada. <strong>ENTREGAR CARRO</strong> abre a vistoria de saída
        de um veículo que está no pátio. Em seguida você escolhe o tipo: carro, moto ou caminhão.
      </p>

      <h2>Os 4 passos da vistoria em detalhe</h2>
      <h3>1. Fotos guiadas pelo app</h3>
      <p>
        Depois de preencher a placa, o veículo e o cliente, o app pede as fotos uma a uma. Para cada foto aparece um desenho mostrando o ângulo certo e uma dica
        curta, como &quot;Fique 3 passos na frente do carro&quot;. As fotos obrigatórias são seis:
      </p>
      <ul>
        <li>Frente</li>
        <li>Traseira</li>
        <li>Lado esquerdo</li>
        <li>Lado direito</li>
        <li>Painel, com o carro ligado, mostrando a quilometragem e o combustível</li>
        <li>Motor, com o capô aberto</li>
      </ul>
      <p>
        Se quiser registrar um detalhe, há ainda uma &quot;Outra foto&quot; opcional. Cada foto sai com a data, a hora, a placa e o nome da oficina gravados na
        imagem.
      </p>

      <h3>2. Marque riscos e avarias no desenho</h3>
      <p>
        O carro aparece desenhado em cinco vistas: lado esquerdo, lado direito, frente, traseira e de cima. Você toca no ponto onde está o problema e escolhe o tipo:
        risco, amassado, quebrado, trincado, faltando, ferrugem ou outro. Cada marca ganha um número, e o termo mostra a lista completa. Se não houver nenhuma
        avaria, o termo deixa isso registrado também.
      </p>

      <h3>3. Pneus, itens e assinatura do cliente</h3>
      <p>
        Na tela de pneus e itens você marca o estado de cada pneu (bom, ruim ou ausente), incluindo o estepe, e confere os itens do veículo. Há espaço para
        observações.
      </p>
      <p>
        Depois o cliente confere a vistoria e assina com o dedo na tela do celular. Ele não precisa ter conta nem instalar nada. Em uma tela separada, a oficina
        assina e conclui.
      </p>

      <h3>4. PDF com a sua logo direto no WhatsApp</h3>
      <p>
        Ao concluir, o sistema gera o termo de vistoria em PDF, com a logo da oficina, um código de autenticidade e um QR Code. Com um toque você envia para o
        WhatsApp do cliente. O cliente também recebe um link para ver as fotos no celular.
      </p>
      <p>
        A vistoria concluída fica travada. Se for preciso corrigir algo, a correção entra como uma observação extra (adendo), sem apagar o que já foi registrado.
        Saiba mais sobre o <Link href="/laudo-de-vistoria-digital">laudo de vistoria digital</Link>.
      </p>

      <h2>Requisitos do celular</h2>
      <ul>
        <li>Um celular com câmera, Android ou iPhone.</li>
        <li>Um navegador atualizado, como Chrome ou Safari.</li>
        <li>Internet para enviar as fotos e o PDF. Se o sinal cair no meio, o que foi feito fica salvo.</li>
      </ul>
      <p>
        Não é preciso baixar nada da loja de aplicativos. Se quiser, você coloca o ícone da Vistoria Rápida na tela inicial do celular e abre como um app. Também
        funciona no computador, para consultar e enviar vistorias.
      </p>

      <h2>Quanto tempo leva</h2>
      <p>
        Em média, cerca de 3 minutos do início até o PDF no WhatsApp do cliente. Nas primeiras vistorias pode levar um pouco mais, enquanto a equipe se acostuma
        com as telas. Depois, vira rotina.
      </p>

      <h2>Quem pode usar</h2>
      <p>
        O dono da oficina cria a conta e cadastra a equipe. Cada pessoa entra com o próprio e-mail e senha. O vistoriador faz vistorias e vê os veículos no pátio;
        o gerente acompanha tudo; e só o dono vê o plano e o pagamento.
      </p>
      <p>
        Se a sua dúvida é sobre a rotina da oficina, veja a página de <Link href="/vistoria-digital-para-oficinas">vistoria digital para oficinas</Link>.
      </p>
    </PaginaConteudo>
  );
}
