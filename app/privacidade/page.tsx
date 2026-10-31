import type { Metadata } from "next";
import Link from "next/link";
import { DocumentoLegal, Lista, QuadroFornecedor, Secao } from "@/components/site/documento-legal";
import { dadosFornecedor } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Vistoria Rápida trata os dados das oficinas e dos clientes delas, conforme a LGPD.",
  alternates: { canonical: "/privacidade" },
};

// Atualiza os dados da empresa (tabela plataforma) a cada hora.
export const revalidate = 3600;

// Texto longo do documento legal fica na própria página (como as páginas do site).
export default async function Privacidade() {
  const f = await dadosFornecedor();
  const contato = [f.whatsapp && `WhatsApp ${f.whatsapp}`, f.email && `e-mail ${f.email}`].filter(Boolean).join(" ou ");

  return (
    <DocumentoLegal titulo="Política de Privacidade" versao={f.versaoPrivacidade} vigencia="31/10/2026">
      <p>
        Esta Política explica quais dados o <strong>Vistoria Rápida</strong> guarda, para quê, com quem compartilha e como protege, conforme
        a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Ela faz parte dos{" "}
        <Link href="/termos" className="font-bold text-oficina underline">
          Termos de Uso
        </Link>
        .
      </p>

      <Secao numero={1} titulo="Quem cuida dos dados">
        <QuadroFornecedor dados={f} />
        <p>
          Encarregado de proteção de dados (DPO): {f.responsavel ?? "o responsável acima"}
          {contato ? `, pelo ${contato}` : ""}.
        </p>
      </Secao>

      <Secao numero={2} titulo="Quem decide sobre cada dado">
        <Lista
          itens={[
            <>
              <strong>Dados dos clientes e veículos vistoriados:</strong> a oficina é a <strong>controladora</strong> (decide o que registrar
              e para quê). Nós somos a <strong>operadora</strong>: guardamos e processamos esses dados só para a oficina, seguindo as
              instruções dela e esta Política.
            </>,
            <>
              <strong>Dados da conta da oficina e da equipe:</strong> nós somos os controladores.
            </>,
          ]}
        />
      </Secao>

      <Secao numero={3} titulo="Quais dados guardamos">
        <p className="font-bold">Da oficina e da equipe</p>
        <Lista
          itens={[
            "Nome, WhatsApp e e-mail de cada usuário, papel na equipe e senha (guardada embaralhada: ninguém consegue lê-la, nem nós).",
            "Nome da oficina, logo e, para a cobrança, nome ou razão social e CPF ou CNPJ.",
            "Pagamentos: forma (Pix ou cartão), valores, datas e identificadores do Asaas. Não recebemos nem guardamos número, validade ou código do cartão.",
            "Aceite dos Termos e desta Política: data, hora, IP e versão.",
          ]}
        />
        <p className="font-bold">Da vistoria (dados que a oficina registra)</p>
        <Lista
          itens={[
            "Cliente: nome, CPF ou CNPJ, WhatsApp e e-mail.",
            "Veículo: tipo, placa, marca, modelo, ano, cor, chassi, km, combustível, objetos deixados e observações.",
            "Fotos do veículo (podem mostrar placas, pessoas ou objetos que estavam no local), mapa de riscos e amassados, pneus e itens.",
            "Assinatura desenhada na tela, nome e documento de quem assinou, data, hora e localização (só quando o aparelho permite).",
            "Envios do termo (WhatsApp ou e-mail) e aberturas do link público (data, IP e navegador).",
          ]}
        />
        <p className="font-bold">Técnicos</p>
        <Lista
          itens={[
            "Registros de acesso e de ações no sistema (quem fez o quê e quando), para segurança e prova.",
            "Cookies e dados guardados no aparelho, explicados na seção 9.",
          ]}
        />
      </Secao>

      <Secao numero={4} titulo="Para que usamos e com qual base legal">
        <Lista
          itens={[
            "Prestar o serviço: fazer a vistoria, gerar o termo, enviar ao cliente e permitir a conferência (execução de contrato, art. 7º, V).",
            "Cobrar a mensalidade e emitir registros de pagamento (execução de contrato e cumprimento de obrigação legal, art. 7º, II e V).",
            "Provar o que foi registrado, em caso de discussão ou processo (exercício regular de direitos, art. 7º, VI).",
            "Manter o sistema seguro, evitar fraudes e cumprir o Marco Civil da Internet (obrigação legal e legítimo interesse, art. 7º, II e IX).",
            "Avisar sobre o serviço, pagamentos e mudanças, pelo sistema, WhatsApp ou e-mail (execução de contrato).",
          ]}
        />
        <p>
          Nos dados dos clientes da oficina, a base legal é definida pela oficina, normalmente a execução do serviço contratado e o
          exercício regular de direitos. <strong>Não vendemos dados, não fazemos propaganda com eles e não os usamos para outros fins.</strong>
        </p>
      </Secao>

      <Secao numero={5} titulo="Com quem compartilhamos">
        <Lista
          itens={[
            "Supabase: banco de dados e guarda das fotos, em servidores na região de São Paulo.",
            "Vercel: hospedagem do site e do sistema.",
            "Asaas: cobrança da mensalidade (só dados da oficina, nunca dos clientes dela).",
            "WhatsApp e e-mail: o termo é enviado a partir do aparelho da oficina, que escolhe para quem enviar.",
            "Quem tiver o link do termo ou o código de autenticidade pode ver o termo. A oficina decide com quem compartilhar.",
            "Autoridades públicas, quando houver ordem judicial ou obrigação legal.",
          ]}
        />
        <p>
          Alguns desses fornecedores podem tratar dados fora do Brasil. Nesses casos, escolhemos empresas com proteção adequada e cláusulas
          contratuais, como pede a LGPD (art. 33).
        </p>
      </Secao>

      <Secao numero={6} titulo="Como protegemos">
        <Lista
          itens={[
            "Conexão criptografada (HTTPS) em todas as telas.",
            "Cada oficina só vê os próprios dados (isolamento no banco de dados). O vistoriador vê só as vistorias que fez.",
            "Fotos em área privada, abertas só por links temporários.",
            "Vistoria concluída travada no banco de dados, com código de autenticidade e resumo SHA-256.",
            "Registro das ações importantes e acesso administrativo restrito.",
          ]}
        />
        <p>
          Nenhum sistema é 100% invulnerável. Se acontecer um incidente de segurança que possa causar risco ou dano, avisaremos a oficina e a
          Autoridade Nacional de Proteção de Dados (ANPD), como manda a lei.
        </p>
      </Secao>

      <Secao numero={7} titulo="Por quanto tempo guardamos">
        <Lista
          itens={[
            "Dados da conta: enquanto a conta existir e, depois, pelo prazo necessário para cumprir a lei e defender direitos.",
            "Termos de vistoria concluídos: até 5 anos depois da conclusão, para servirem de prova à oficina e ao cliente.",
            "Registros de acesso: pelo menos 6 meses (Marco Civil da Internet).",
            "Dados de pagamento: pelo prazo das leis fiscais.",
            "Depois disso, os dados são apagados ou anonimizados (sem identificar a pessoa).",
          ]}
        />
      </Secao>

      <Secao numero={8} titulo="Seus direitos">
        <p>Pela LGPD (art. 18), qualquer pessoa pode pedir:</p>
        <Lista
          itens={[
            "confirmação de que tratamos seus dados e acesso a eles;",
            "correção de dados errados ou desatualizados;",
            "anonimização, bloqueio ou exclusão de dados desnecessários ou tratados fora da lei;",
            "portabilidade e informação sobre com quem os dados foram compartilhados;",
            "revogação do consentimento, quando ele for a base legal.",
          ]}
        />
        <p>
          <strong>Cliente de oficina:</strong> fale primeiro com a oficina que fez a vistoria, que é quem decide sobre seus dados. Se
          precisar, fale com a gente e encaminharemos o pedido. Alguns dados podem ser mantidos quando a lei exigir ou para provar a vistoria.
          Respondemos em até 15 dias. Você também pode reclamar na ANPD.
        </p>
      </Secao>

      <Secao numero={9} titulo="Cookies e dados no aparelho">
        <p>Usamos só o necessário para o sistema funcionar. Não usamos cookies de propaganda nem de rastreamento.</p>
        <Lista
          itens={[
            "Login: mantém a pessoa conectada.",
            "Avisos: lembram se um aviso de pagamento ou de instalar o app já foi mostrado.",
            "Indicação: guarda o código de quem indicou o sistema, para a comissão.",
            "No aparelho: modo sol e o rascunho da vistoria, para não perder o que foi feito sem internet.",
          ]}
        />
      </Secao>

      <Secao numero={10} titulo="Menores de idade">
        <p>O sistema é para empresas e não deve ser usado por menores de 18 anos.</p>
      </Secao>

      <Secao numero={11} titulo="Mudanças nesta Política">
        <p>
          Podemos atualizar esta Política. A versão e a data ficam no topo da página, e mudanças importantes serão avisadas no sistema ou
          pelo WhatsApp cadastrado.
        </p>
      </Secao>

      <Secao numero={12} titulo="Fale com a gente">
        <p>Pedidos sobre dados pessoais, dúvidas ou reclamações: {contato || "fale com o suporte"}.</p>
      </Secao>
    </DocumentoLegal>
  );
}
