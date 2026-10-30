import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { JsonLd, PaginaConteudo, Perguntas, schemaPerguntas } from "@/components/site/blocos";
import { PERGUNTAS_PRECOS } from "@/lib/conteudo/perguntas";
import { contatoSuporte, metadadosPagina } from "@/lib/site";

const caminho = "/precos";

export const metadata: Metadata = metadadosPagina({
  titulo: "Preço da Vistoria Digital | Pague por Pix",
  descricao: "Preço da vistoria digital para oficinas: mensalidade paga só por Pix, sem cartão, com fotos, assinatura e PDF no WhatsApp. Comece agora.",
  caminho,
});

const incluido = [
  "Vistorias de chegada e de entrega pelo celular",
  "Fotos guiadas com data e hora",
  "Riscos e amassados marcados no desenho do carro",
  "Pneus, itens do veículo e observações",
  "Assinatura do cliente com o dedo",
  "Termo de vistoria em PDF com a logo da sua oficina",
  "Envio para o WhatsApp do cliente",
  "Código de autenticidade e página para conferir a vistoria",
  "Carros, motos e caminhões",
  "Equipe com papéis: dono, gerente e vistoriador",
  "Histórico das vistorias e busca pela placa",
];

export default async function Pagina() {
  const contato = await contatoSuporte();
  return (
    <PaginaConteudo
      caminho={[{ nome: "Preços", caminho }]}
      titulo="Preços da Vistoria Rápida"
      resumo="Uma mensalidade simples, paga por Pix, sem cartão de crédito."
      chamada="Comece a fazer vistoria digital na sua oficina."
    >
      <JsonLd dados={schemaPerguntas(PERGUNTAS_PRECOS)} />

      <h2>Planos e preço</h2>
      {/* TODO(Frederico): colocar aqui os planos e o valor da mensalidade quando o preço puder aparecer no site
          (no sistema hoje: tabela "planos"). Quando entrar, incluir também "offers" em BRL no Service da página inicial. */}
      <p>
        A Vistoria Rápida é cobrada por mensalidade. O valor aparece na tela <strong>Meu plano</strong> assim que a oficina cria a conta, junto com o QR Code do
        Pix.
      </p>
      {contato ? (
        <p>
          Quer saber o valor antes de criar a conta? <a href={contato.link}>Fale com a gente no WhatsApp</a>.
        </p>
      ) : null}

      <h2>O que está incluído</h2>
      <ul className="!list-none !pl-0">
        {incluido.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <Check aria-hidden className="mt-1 size-5 shrink-0 text-acao" strokeWidth={3} /> {i}
          </li>
        ))}
      </ul>

      <h2>Como funciona o pagamento por Pix</h2>
      <ol>
        <li>Crie a conta da oficina com o seu nome, WhatsApp e o nome da oficina.</li>
        <li>Na tela Meu plano aparecem o valor, o QR Code e o Pix copia e cola.</li>
        <li>Pague pelo aplicativo do seu banco. Não precisa de cartão de crédito.</li>
        <li>Depois de confirmado o pagamento, o acesso fica liberado por mais 30 dias.</li>
      </ol>
      <p>
        Alguns dias antes do vencimento, o sistema mostra o Pix da próxima mensalidade para o dono da oficina. Só o dono vê as informações de cobrança; a equipe
        continua trabalhando normalmente.
      </p>

      <h2>Por que vale a pena</h2>
      <p>
        Uma única reclamação de risco que a oficina não causou pode custar um reparo de funilaria ou um cliente perdido. Com a vistoria digital, a oficina tem foto
        com data e a assinatura do cliente para mostrar. Além disso, o termo com a sua logo no WhatsApp passa uma imagem de oficina organizada e confiável.
      </p>
      <p>
        Veja <Link href="/como-funciona">como funciona o app</Link> ou leia sobre a <Link href="/vistoria-digital-para-oficinas">vistoria digital para oficinas</Link>.
      </p>

      <h2>Sem surpresa na cobrança</h2>
      <p>
        Não há cobrança automática no cartão nem débito em conta. A oficina paga cada mensalidade quando quiser, dentro do prazo, pelo Pix. O comprovante fica no
        aplicativo do seu banco, e o sistema mostra na tela Meu plano até quando o acesso está pago.
      </p>
      <p>
        Se a mensalidade atrasar, o sistema avisa antes de bloquear. Mesmo com o acesso bloqueado, nada é apagado: as vistorias que você já fez continuam
        guardadas e voltam a ficar disponíveis assim que o pagamento é confirmado.
      </p>

      <h2>Para quem é</h2>
      <p>
        Para oficinas mecânicas, funilarias, autocentros, centros automotivos e guinchos que recebem veículos de clientes e querem parar de usar ficha de papel.
        Serve para a oficina pequena, em que o próprio dono faz a vistoria, e para a oficina com equipe, em que recepcionista, mecânico e gerente dividem o
        trabalho, cada um com o seu acesso.
      </p>

      <h2>Perguntas sobre a cobrança</h2>
      <Perguntas itens={PERGUNTAS_PRECOS} />
    </PaginaConteudo>
  );
}
