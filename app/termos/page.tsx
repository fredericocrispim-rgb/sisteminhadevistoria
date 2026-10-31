import type { Metadata } from "next";
import Link from "next/link";
import { DocumentoLegal, Lista, QuadroFornecedor, Secao } from "@/components/site/documento-legal";
import { dadosFornecedor } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso do Vistoria Rápida: o que o sistema faz, pagamento, cancelamento, validade da vistoria e responsabilidades.",
  alternates: { canonical: "/termos" },
};

// Atualiza os dados da empresa (tabela plataforma) a cada hora.
export const revalidate = 3600;

// Texto longo do documento legal fica na própria página (como as páginas do site).
export default async function Termos() {
  const f = await dadosFornecedor();
  const dia = (n: number) => (n === 1 ? "1 dia" : `${n} dias`);

  return (
    <DocumentoLegal titulo="Termos de Uso" versao={f.versaoTermos} vigencia="31/10/2026">
      <p>
        Estes Termos explicam as regras para usar o <strong>Vistoria Rápida</strong> (vistoriarapida.digital). Leia com atenção. Ao criar a
        conta e marcar a caixa de aceite, a oficina concorda com tudo o que está aqui e com a{" "}
        <Link href="/privacidade" className="font-bold text-oficina underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <Secao numero={1} titulo="Quem oferece o serviço">
        <p>O Vistoria Rápida é um sistema oferecido por:</p>
        <QuadroFornecedor dados={f} />
        <p>Neste documento, chamamos essa empresa de &quot;Vistoria Rápida&quot; ou &quot;nós&quot;.</p>
      </Secao>

      <Secao numero={2} titulo="Palavras usadas aqui">
        <Lista
          itens={[
            <>
              <strong>Oficina:</strong> a empresa que contrata o sistema (oficina, funilaria, autocentro, guincho, associação ou outro
              negócio que recebe veículos).
            </>,
            <>
              <strong>Usuário:</strong> cada pessoa da oficina com login (dono, gerente ou vistoriador).
            </>,
            <>
              <strong>Cliente da oficina:</strong> o dono ou responsável pelo veículo vistoriado.
            </>,
            <>
              <strong>Vistoria:</strong> o registro do estado do veículo na chegada (CHEGOU CARRO) ou na entrega (ENTREGAR CARRO).
            </>,
            <>
              <strong>Termo de vistoria:</strong> o documento em PDF gerado ao concluir a vistoria.
            </>,
          ]}
        />
      </Secao>

      <Secao numero={3} titulo="Aceite e cadastro">
        <Lista
          itens={[
            "Quem faz o cadastro declara ter 18 anos ou mais e poder representar a oficina.",
            "O aceite fica registrado com data, hora, endereço de internet (IP) e a versão destes Termos.",
            "Os dados do cadastro devem ser verdadeiros e mantidos atualizados. Dados falsos permitem o bloqueio da conta.",
            "O sistema é feito para empresas usarem no seu trabalho, não para uso pessoal.",
          ]}
        />
      </Secao>

      <Secao numero={4} titulo="O que o sistema faz">
        <p>O Vistoria Rápida substitui a ficha de vistoria em papel. Hoje, ele oferece:</p>
        <Lista
          itens={[
            "Vistoria de carro, moto ou caminhão, na chegada e na entrega, em passos guiados.",
            "Dados do veículo e do cliente: placa, marca, modelo, ano, cor, chassi, km, combustível, objetos deixados e observações.",
            "Fotos guiadas pelo celular (frente, traseira, laterais, painel e motor), mais fotos extras.",
            "Mapa de riscos e amassados em várias vistas do veículo.",
            "Conferência de pneus e itens do veículo.",
            "Assinatura na tela do cliente e da oficina, com nome, documento, data, hora e, se o aparelho permitir, a localização.",
            "Termo de vistoria em PDF com a logo da oficina, código de autenticidade, resumo digital (SHA-256) e QR Code.",
            "Envio do termo ao cliente pelo WhatsApp ou e-mail, link seguro para o cliente ver o termo e página Verificar para conferir se o documento é verdadeiro.",
            "Correção de vistoria concluída só por adendo (observação extra com data e autor). O original nunca muda.",
            "Lista de veículos no pátio, histórico de vistorias e busca.",
            "Equipe com papéis: dono (tudo), gerente (tudo, menos plano e pagamento) e vistoriador (só faz vistorias e vê as suas).",
            "Funciona com internet fraca: o que foi feito fica guardado no aparelho e é enviado quando a conexão voltar.",
            "Assinatura mensal por Pix ou cartão de crédito, na tela Minha assinatura.",
          ]}
        />
        <p>
          Podemos melhorar, mudar ou retirar funções para manter o sistema seguro e útil. Se uma mudança tirar uma função importante,
          avisaremos antes.
        </p>
      </Secao>

      <Secao numero={5} titulo="Conta, senha e equipe">
        <Lista
          itens={[
            "Cada pessoa deve ter o próprio login. Não compartilhe a senha.",
            "A oficina responde por tudo o que é feito com os logins da sua equipe.",
            "O dono pode cadastrar e retirar pessoas da equipe a qualquer momento. Retire na hora quem saiu da oficina.",
            "Se suspeitar que alguém usou sua senha, troque a senha e avise o suporte.",
          ]}
        />
      </Secao>

      <Secao numero={6} titulo="Preço e pagamento">
        <Lista
          itens={[
            "O serviço é pago por mês. O valor do plano, quantas pessoas ele inclui e o valor de cada pessoa a mais aparecem na tela Minha assinatura antes de assinar.",
            "Formas de pagamento: Pix ou cartão de crédito. Não aceitamos boleto.",
            "No cartão, a cobrança é automática todo mês (recorrente), até a oficina cancelar.",
            "Os pagamentos são processados pelo Asaas, instituição de pagamento autorizada. Os dados do cartão são digitados só na página do Asaas. O Vistoria Rápida nunca vê nem guarda os dados do cartão.",
            "O acesso é liberado só depois que o Asaas confirma o pagamento.",
            `Depois do cadastro, a oficina tem ${dia(f.diasTeste)} para pagar a primeira mensalidade. Sem esse pagamento, o acesso é bloqueado.`,
            `Nas mensalidades seguintes há tolerância de ${dia(f.diasCarencia)} depois do vencimento. Passado esse prazo, o acesso é bloqueado até o pagamento.`,
            "Estorno, contestação no cartão (chargeback) ou devolução do pagamento bloqueiam o acesso do período correspondente.",
            "O valor pode ser reajustado. Avisaremos com pelo menos 30 dias de antecedência, e a oficina pode cancelar se não concordar.",
            "Cortesias, cupons e descontos valem só enquanto informado e podem ser encerrados com aviso.",
          ]}
        />
      </Secao>

      <Secao numero={7} titulo="Cancelamento">
        <Lista
          itens={[
            "A oficina pode cancelar quando quiser, na tela Minha assinatura ou pelo suporte, sem multa.",
            "Depois de cancelar, a oficina continua usando até o fim do período já pago. Não há devolução de mês já iniciado.",
            "Quando a lei garantir o direito de arrependimento, a oficina pode desistir em até 7 dias do primeiro pagamento e receber o valor de volta.",
            "Antes de cancelar, baixe os termos de vistoria que quiser guardar.",
          ]}
        />
      </Secao>

      <Secao numero={8} titulo="Bloqueio e encerramento da conta">
        <p>Podemos bloquear ou encerrar a conta, com aviso quando possível, se houver:</p>
        <Lista
          itens={[
            "falta de pagamento, nos prazos da seção 6;",
            "uso para fraude, para enganar clientes, seguradoras ou autoridades, ou para qualquer fim ilegal;",
            "tentativa de invadir, copiar, sobrecarregar ou descobrir o código do sistema;",
            "dados de cadastro falsos ou descumprimento destes Termos.",
          ]}
        />
        <p>
          Mesmo com a conta bloqueada, os termos já enviados aos clientes continuam valendo e podem ser conferidos pelo link e pela página
          Verificar.
        </p>
      </Secao>

      <Secao numero={9} titulo="Deveres da oficina">
        <Lista
          itens={[
            "Registrar a vistoria com fotos reais, do próprio veículo, no momento da vistoria, e descrever com honestidade o que viu.",
            "Conferir o termo com o cliente antes de pedir a assinatura e antes de concluir.",
            "Informar o cliente de que os dados dele, as fotos e a assinatura serão registrados, e para quê (veja a Política de Privacidade).",
            "Usar os dados dos clientes só para a vistoria e o serviço do veículo, respeitando a Lei Geral de Proteção de Dados (LGPD).",
            "Atender os pedidos dos seus clientes sobre os dados deles (acesso, correção, exclusão). Nós ajudamos no que for preciso.",
            "Não enviar conteúdo ilegal, ofensivo ou de terceiros sem autorização (inclusive na logo).",
            "Guardar uma cópia dos termos que forem importantes para a oficina.",
          ]}
        />
      </Secao>

      <Secao numero={10} titulo="Validade da vistoria e da assinatura">
        <Lista
          itens={[
            "A assinatura feita na tela é uma assinatura eletrônica. A oficina e o cliente aceitam essa forma de assinar como válida para comprovar a vistoria, conforme a Medida Provisória 2.200-2/2001 (art. 10, § 2º) e a Lei 14.063/2020.",
            "Cada termo guarda provas do registro: data e hora, nome e documento de quem assinou, localização (quando o aparelho permite), código de autenticidade, resumo digital SHA-256 e QR Code.",
            "Depois de concluída, a vistoria fica travada: ninguém pode alterar fotos, avarias, pneus ou itens. Correções entram só como adendo, com data e autor.",
            "Qualquer pessoa com o código pode conferir na página Verificar se o termo é verdadeiro e se não foi alterado.",
          ]}
        />
      </Secao>

      <Secao numero={11} titulo="Limites da nossa responsabilidade">
        <Lista
          itens={[
            "O Vistoria Rápida é uma ferramenta para registrar a vistoria. Quem faz a vistoria e responde pelo conteúdo (fotos, avarias, observações, km, itens) é a oficina.",
            "Não somos parte da relação entre a oficina e o cliente dela. Não respondemos por danos, furtos, consertos, valores cobrados ou discussões sobre o veículo.",
            "O termo não substitui perícia, laudo técnico, vistoria cautelar ou vistoria de órgãos de trânsito e seguradoras.",
            "Não garantimos que o termo será aceito como prova em todo caso. Isso depende de cada situação e de quem analisa.",
            "Trabalhamos para o sistema ficar no ar o tempo todo, mas pode haver paradas para manutenção ou falhas de internet, do aparelho ou de serviços de terceiros (hospedagem, banco de dados, Asaas, WhatsApp, operadoras). Nesses casos, faremos o possível para resolver rápido.",
            "Fotos e dados feitos sem internet ficam só no aparelho até serem enviados. Se o aparelho for perdido, formatado ou o navegador for limpo antes do envio, eles podem ser perdidos.",
            "Não respondemos por perdas causadas por senha compartilhada, aparelho sem segurança ou uso fora destes Termos.",
            "Não respondemos por lucros que deixaram de ser ganhos nem por danos indiretos.",
            "Quando a lei permitir, nossa responsabilidade total fica limitada ao valor pago pela oficina nos 12 meses anteriores ao problema.",
          ]}
        />
      </Secao>

      <Secao numero={12} titulo="Propriedade do sistema e dos dados">
        <Lista
          itens={[
            "O sistema, a marca Vistoria Rápida, o visual, os desenhos e o código pertencem a nós. Não é permitido copiar, revender ou criar sistema parecido a partir dele.",
            "Os dados, fotos e a logo que a oficina coloca no sistema continuam sendo da oficina. Ela nos autoriza a guardar e mostrar esse conteúdo só para fazer o sistema funcionar (por exemplo, a logo no termo).",
            "Os termos de vistoria e o link do cliente mostram, com discrição, que foram feitos pelo Vistoria Rápida.",
          ]}
        />
      </Secao>

      <Secao numero={13} titulo="Privacidade e proteção de dados">
        <p>
          Nos dados dos clientes e veículos que a oficina registra, a oficina é a <strong>controladora</strong> e nós somos a{" "}
          <strong>operadora</strong>: tratamos esses dados só para prestar o serviço, conforme a LGPD (Lei 13.709/2018). Nos dados da conta
          da oficina e da equipe, somos controladores. Tudo está explicado na{" "}
          <Link href="/privacidade" className="font-bold text-oficina underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </Secao>

      <Secao numero={14} titulo="Dados depois do cancelamento">
        <Lista
          itens={[
            "Os termos de vistoria concluídos ficam guardados por até 5 anos depois da conclusão, para servirem de prova à oficina e ao cliente, e continuam conferíveis pela página Verificar.",
            "Registros de acesso são guardados por pelo menos 6 meses, como exige o Marco Civil da Internet (Lei 12.965/2014).",
            "Dados de pagamento são guardados pelo prazo exigido pelas leis fiscais.",
            "Depois desses prazos, os dados podem ser apagados ou anonimizados. A oficina pode pedir a exclusão antes, pelo suporte, respeitando o que a lei manda guardar.",
          ]}
        />
      </Secao>

      <Secao numero={15} titulo="Mudanças nestes Termos">
        <p>
          Podemos atualizar estes Termos. A versão e a data ficam no topo da página. Mudanças importantes serão avisadas no sistema ou pelo
          WhatsApp cadastrado com pelo menos 15 dias de antecedência. Se a oficina continuar usando depois disso, aceita a nova versão. Se
          não concordar, pode cancelar sem multa.
        </p>
      </Secao>

      <Secao numero={16} titulo="Avisos, lei e foro">
        <Lista
          itens={[
            "Os avisos são enviados pelo sistema, pelo WhatsApp ou pelo e-mail cadastrados. Mantenha-os atualizados.",
            "Se uma parte destes Termos for considerada inválida, o restante continua valendo.",
            "Estes Termos seguem as leis do Brasil.",
            "Fica escolhido o foro de Goiânia/GO para resolver qualquer questão, salvo quando a lei garantir à oficina o direito de usar o foro do seu endereço.",
          ]}
        />
      </Secao>

      <Secao numero={17} titulo="Fale com a gente">
        <p>
          Dúvidas, pedidos ou reclamações: fale com o suporte{f.whatsapp ? ` pelo WhatsApp ${f.whatsapp}` : ""}
          {f.email ? `${f.whatsapp ? " ou" : ""} pelo e-mail ${f.email}` : ""}. Respondemos em dias úteis. Antes de buscar a Justiça, as
          partes tentarão resolver a questão por conversa.
        </p>
      </Secao>
    </DocumentoLegal>
  );
}
