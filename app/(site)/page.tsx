import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Check, FileText, MessageCircle, PenLine } from "lucide-react";
import { SilhuetaCarro } from "@/components/vf";
import { BotaoCriarConta, JsonLd, Perguntas, schemaPerguntas } from "@/components/site/blocos";
import { FOTOS_OBRIGATORIAS } from "@/lib/vistoria";
import { obterContexto } from "@/lib/sessao";
import { contatoSuporte, ENDERECO_SITE, metadadosPagina } from "@/lib/site";
import { PERGUNTAS_INICIO } from "@/lib/conteudo/perguntas";
import { INSTAGRAM } from "@/lib/site-paginas";
import { textos } from "@/lib/textos";

export const metadata: Metadata = metadadosPagina({
  titulo: "Vistoria Rápida Digital para Oficinas | Laudo em 3 min",
  // Sem teste grátis desde 30/10/2026 (a oficina tem 1 dia para pagar pelo Pix): por isso "Comece agora."
  descricao:
    "Vistoria digital de carro pelo celular: fotos guiadas, assinatura do cliente e PDF no WhatsApp em 3 minutos. Feita para oficinas. Comece agora.",
  caminho: "/",
});

/** Página inicial (quem já está logado vai direto para o início do app). */
export default async function Inicio() {
  if (await obterContexto()) redirect("/inicio");
  const contato = await contatoSuporte();

  const vantagens = [
    { icone: <Camera aria-hidden />, titulo: "Fotos guiadas", texto: "O app mostra o ângulo certo" },
    { icone: <PenLine aria-hidden />, titulo: "Assinatura no dedo", texto: "O cliente assina na hora" },
    { icone: <MessageCircle aria-hidden />, titulo: "Direto no WhatsApp", texto: "PDF com a sua logo" },
  ];

  const descricao = "Vistoria digital de veículos pelo celular para oficinas mecânicas: fotos guiadas, avarias marcadas no desenho, assinatura do cliente e termo em PDF no WhatsApp.";
  const organizacao = {
    "@type": "Organization",
    "@id": `${ENDERECO_SITE}/#organizacao`,
    name: textos.produto.nome,
    alternateName: "Vistoria Rápida Digital",
    url: ENDERECO_SITE,
    logo: `${ENDERECO_SITE}/app-512.png`,
    description: descricao,
    areaServed: { "@type": "Country", name: "Brasil" },
    ...(contato && {
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", telephone: contato.telefoneSchema, availableLanguage: "Portuguese", areaServed: "BR" },
    }),
    sameAs: [INSTAGRAM.link],
  };
  const servico = {
    "@type": "Service",
    name: "Vistoria digital de veículos",
    serviceType: "Vistoria digital de veículos",
    description: descricao,
    provider: { "@id": `${ENDERECO_SITE}/#organizacao` },
    areaServed: { "@type": "Country", name: "Brasil" },
    audience: { "@type": "BusinessAudience", audienceType: "Oficinas mecânicas" },
    // TODO(Frederico): "offers" com o preço em BRL quando o preço puder aparecer no site.
  };

  return (
    <>
      <JsonLd dados={{ "@context": "https://schema.org", "@graph": [organizacao, servico] }} />
      <JsonLd dados={schemaPerguntas(PERGUNTAS_INICIO)} />

      <main className="flex-1">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          {/* Texto */}
          <section className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm font-bold text-acao ring-1 ring-border">
              <span className="size-2 rounded-full bg-marca-verde" /> Pagamento por Pix · sem cartão
            </span>
            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Vistoria rápida e digital <span className="text-marca-azul">para oficinas</span>
            </h1>
            <p className="max-w-xl text-xl text-muted-foreground">
              Registre o estado do carro na chegada, colha a assinatura do cliente e mande o termo de vistoria no WhatsApp em 3 minutos. Tudo pelo celular, sem
              papel e sem prancheta.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <BotaoCriarConta />
              <a
                href="#exemplo"
                className="tocavel inline-flex min-h-toque-grande items-center justify-center rounded-2xl bg-background px-7 text-xl font-bold ring-1 ring-border hover:bg-superficie"
              >
                Ver um exemplo de vistoria
              </a>
            </div>

            <ul className="mt-4 grid gap-5 sm:grid-cols-3">
              {vantagens.map((v) => (
                <li key={v.titulo} className="flex items-start gap-3 sm:flex-col">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-oficina-clara text-oficina [&_svg]:size-6">{v.icone}</span>
                  <span>
                    <span className="block text-lg font-extrabold">{v.titulo}</span>
                    <span className="block text-base text-muted-foreground">{v.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* "Foto" do produto: uma vistoria pronta */}
          <section id="exemplo" aria-label="Exemplo de vistoria digital de carro pelo celular" className="relative mx-auto w-full max-w-sm scroll-mt-6">
            <div className="rotate-[-2deg] rounded-[2rem] bg-background p-5 shadow-2xl ring-1 ring-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">Vistoria de chegada</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-acao-clara px-2.5 py-1 text-xs font-bold text-acao">
                  <Check aria-hidden className="size-3.5" strokeWidth={3} /> Concluída
                </span>
              </div>
              <p className="mt-3 font-mono text-4xl font-extrabold tracking-wider">ABC1D23</p>
              <p className="text-base text-muted-foreground">Chevrolet Onix · Prata · 45.320 km</p>

              <div className="mt-4 grid grid-cols-3 gap-1.5" role="img" aria-label="Fotos guiadas da vistoria: frente, traseira, laterais, painel e motor">
                {FOTOS_OBRIGATORIAS.map((f, i) => (
                  <div
                    key={f.categoria}
                    aria-hidden
                    className="grid aspect-square place-items-center rounded-lg text-marca-azul/70"
                    style={{
                      background: `linear-gradient(160deg, color-mix(in oklch, var(--cor-marca-azul) ${10 + (i % 4) * 5}%, white), color-mix(in oklch, var(--cor-marca-verde) ${8 + (i % 3) * 5}%, white))`,
                    }}
                  >
                    <SilhuetaCarro vista={f.vista} className="w-[85%]" />
                  </div>
                ))}
              </div>

              <ul className="mt-4 flex flex-col gap-2 text-base">
                <li className="flex items-center gap-2">
                  <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> 6 fotos com data e hora
                </li>
                <li className="flex items-center gap-2">
                  <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> 2 riscos marcados no desenho
                </li>
                <li className="flex items-center gap-2">
                  <Check aria-hidden className="size-5 text-acao" strokeWidth={3} /> Assinado pelo cliente
                </li>
              </ul>

              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#1f8f4e] px-4 py-3 text-base font-bold text-white">
                <MessageCircle aria-hidden className="size-5" /> Enviado ao cliente
              </div>
            </div>

            <div className="absolute -right-2 -bottom-5 flex rotate-[3deg] items-center gap-2 rounded-2xl bg-background px-4 py-3 shadow-xl ring-1 ring-border">
              <FileText aria-hidden className="size-6 text-perigo" />
              <span className="text-sm font-bold">termo-vistoria.pdf</span>
            </div>
          </section>
        </div>

        <div className="texto-site mx-auto w-full max-w-3xl px-5">
          <h2>Chega de ficha de papel na entrada do carro</h2>
          <p>
            Toda oficina já passou por isso: o cliente volta para buscar o carro, olha a porta, aponta um risco e diz que ele não estava lá quando deixou o veículo.
            Sem uma foto e sem a assinatura dele, a conversa vira palavra contra palavra. Quem perde é a oficina, que acaba pagando um conserto que não fez ou
            perdendo o cliente.
          </p>
          <p>
            A ficha de papel não resolve. Ela molha no pátio, rasga, fica suja de graxa e some na gaveta justo no dia em que você precisa dela. Muitas vezes nem é
            preenchida direito, porque o movimento está grande e o mecânico está com pressa.
          </p>
          <p>
            A Vistoria Rápida troca a ficha por uma vistoria digital feita no celular: fotos com data e hora, riscos e amassados marcados no desenho do carro, a
            quilometragem, os pneus, os itens do veículo e a assinatura do cliente. Tudo fica guardado e chega ao cliente em PDF, pelo WhatsApp.
          </p>

          <h2>Como funciona a vistoria digital</h2>
          <p>
            A ideia é simples: uma vistoria rápida, digital e feita por qualquer pessoa da equipe. Quem procura uma vistoria rápido digital, sem treinamento longo,
            encontra aqui um passo a passo que o próprio app vai mostrando na tela.
          </p>
          <h3>1. Fotos guiadas pelo app</h3>
          <p>
            O app mostra um desenho de cada ângulo: frente, traseira, lado esquerdo, lado direito, painel e motor com o capô aberto. Você só aponta o celular e tira
            a foto. Cada foto sai com a data, a hora e a placa gravadas na imagem.
          </p>
          <h3>2. Marque riscos e avarias no desenho</h3>
          <p>
            Encontrou um risco, um amassado ou um vidro trincado? Toque no ponto certo do desenho do carro (de frente, de trás, dos lados ou de cima) e escolha o
            tipo de avaria. Fica claro onde está cada problema, sem precisar escrever.
          </p>
          <h3>3. O cliente assina com o dedo</h3>
          <p>
            O cliente confere a vistoria na tela do celular da oficina e assina com o dedo, ali mesmo no balcão ou no pátio. Ele não precisa criar conta nem baixar
            nada. Depois, a oficina também assina e conclui.
          </p>
          <h3>4. PDF com a sua logo direto no WhatsApp</h3>
          <p>
            Ao concluir, o sistema monta o termo de vistoria em PDF com a logo da sua oficina e você envia para o WhatsApp do cliente com um toque. A vistoria
            concluída fica travada: qualquer correção depois entra como observação extra, sem apagar o que foi registrado.
          </p>
          <p>
            Quer ver cada passo em detalhe? Veja <Link href="/como-funciona">como funciona o app de vistoria veicular</Link>.
          </p>

          <h2>Por que sua oficina precisa de vistoria de entrada e saída</h2>
          <ul>
            <li>
              <strong>Menos discussão no balcão.</strong> Quando o cliente reclama de um risco, você mostra a foto com data e a assinatura dele.
            </li>
            <li>
              <strong>Mais confiança do cliente.</strong> Receber um termo organizado no WhatsApp mostra que a oficina é séria e cuida do carro dele.
            </li>
            <li>
              <strong>Equipe padronizada no mesmo checklist.</strong> Todo mundo faz a vistoria do mesmo jeito, com as mesmas fotos e os mesmos itens.
            </li>
            <li>
              <strong>Histórico de cada veículo pela placa.</strong> As vistorias ficam guardadas e você encontra qualquer uma buscando pela placa.
            </li>
            <li>
              <strong>Fim do papel.</strong> Nada de ficha molhada, prancheta perdida ou gaveta cheia.
            </li>
          </ul>
          <p>
            Veja como a <Link href="/vistoria-digital-para-oficinas">vistoria digital para oficinas</Link> organiza a entrada e a saída dos carros, e use o nosso{" "}
            <Link href="/checklist-de-entrada-de-veiculo">checklist de entrada de veículo</Link> como modelo.
          </p>

          <h2>Vistoria de carro pelo celular, sem complicação</h2>
          <p>
            Não precisa de equipamento especial. Basta um celular com câmera e internet, o mesmo que a equipe já usa todo dia. A tela tem botões grandes, letras
            fáceis de ler e pouco texto, pensada para quem está no pátio, com pressa e às vezes com a mão suja.
          </p>
          <p>
            A vistoria leva cerca de 3 minutos e funciona também para motos e caminhões. Saiba mais sobre a{" "}
            <Link href="/vistoria-de-carro-pelo-celular">vistoria de carro pelo celular</Link>.
          </p>

          <h2>Laudo de vistoria digital que vale como prova</h2>
          <p>
            O termo em PDF reúne tudo o que foi registrado: as fotos com data e hora, os riscos e amassados marcados no desenho, a quilometragem, os pneus, os itens
            do veículo, as observações e as assinaturas do cliente e da oficina.
          </p>
          <p>
            Cada vistoria tem um código de autenticidade e um QR Code. Qualquer pessoa pode <Link href="/verificar">conferir uma vistoria</Link> no site e ver se o
            documento é verdadeiro. Entenda o que vem no <Link href="/laudo-de-vistoria-digital">laudo de vistoria digital</Link>.
          </p>

          <h2>Quanto custa</h2>
          <p>
            A Vistoria Rápida é paga por mensalidade, só por Pix, sem cartão de crédito. Você paga pelo QR Code ou pelo Pix copia e cola, direto na tela do sistema.
            {/* TODO(Frederico): colocar aqui o valor da mensalidade quando o preço puder aparecer no site. */}
          </p>
          <p>
            Veja os detalhes na página de <Link href="/precos">preços</Link>.
          </p>

          <h2>Perguntas frequentes</h2>
          <Perguntas itens={PERGUNTAS_INICIO} />

          <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-oficina-clara p-6">
            <h2 className="mt-0">Comece hoje a fazer vistoria digital na sua oficina</h2>
            <p className="mt-0">Crie a conta, coloque a logo da oficina e faça a primeira vistoria em poucos minutos.</p>
            <BotaoCriarConta />
          </section>
        </div>
      </main>
    </>
  );
}
