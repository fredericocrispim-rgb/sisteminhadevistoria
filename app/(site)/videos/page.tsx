import type { Metadata } from "next";
import Link from "next/link";
import { PaginaConteudo } from "@/components/site/blocos";
import { VideosDeUso } from "@/components/site/videos-uso";
import { metadadosPagina } from "@/lib/site";

const caminho = "/videos";

export const metadata: Metadata = metadadosPagina({
  titulo: "Vídeos: como usar a Vistoria Rápida | Vistoria online pelo celular",
  descricao:
    "Vídeos curtos, passo a passo: como instalar a Vistoria Rápida no iPhone e no Android e como fazer a vistoria online do veículo pelo celular.",
  caminho,
});

/** Antiga página "Como funciona" (/como-funciona redireciona para cá). */
export default function Pagina() {
  return (
    <PaginaConteudo
      caminho={[{ nome: "Vídeos", caminho }]}
      titulo="Vídeos: aprenda a usar em poucos minutos"
      resumo="Vídeos curtos, um passo de cada vez. Comece instalando o app no seu celular."
    >
      <VideosDeUso />

      <h2>Como é a vistoria, passo a passo</h2>
      <ol>
        <li>
          <strong>Toque em CHEGOU CARRO.</strong> Digite a placa, o carro e o cliente.
        </li>
        <li>
          <strong>Tire as 6 fotos.</strong> O app mostra o ângulo certo: frente, traseira, os dois lados, painel e motor. Cada foto sai com data e hora.
        </li>
        <li>
          <strong>Marque os riscos.</strong> Toque no desenho do carro onde tem risco, amassado ou vidro trincado.
        </li>
        <li>
          <strong>Confira pneus e itens.</strong> Um toque em cada: bom, ruim, tem ou não tem.
        </li>
        <li>
          <strong>O cliente assina com o dedo.</strong> Na tela do seu celular, sem baixar nada.
        </li>
        <li>
          <strong>Envie pelo WhatsApp.</strong> O termo em PDF sai com a logo da sua oficina.
        </li>
      </ol>
      <p>Leva cerca de 3 minutos. Na entrega do carro, toque em ENTREGAR CARRO e faça a vistoria de saída do mesmo jeito.</p>

      <h2>Do que você precisa</h2>
      <ul>
        <li>Um celular com câmera, Android ou iPhone.</li>
        <li>Internet. Se o sinal cair no meio, o que foi feito fica salvo.</li>
        <li>Não precisa baixar nada da loja de aplicativos.</li>
      </ul>
      <p>
        Veja os <Link href="/precos">planos e preços</Link> ou o que vem no <Link href="/laudo-de-vistoria-digital">laudo de vistoria digital</Link>.
      </p>
    </PaginaConteudo>
  );
}
