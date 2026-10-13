/**
 * TODOS os textos da interface ficam aqui.
 * Para trocar uma palavra no app, mude só neste arquivo.
 * Regra: frases curtas, palavras do pátio, nada técnico (Anexo B do guia).
 * Internamente: ENTRADA = "Chegada"; SAIDA = "Entrega".
 */

export const textos = {
  produto: {
    nome: "VistoriaFácil",
    slogan: "Vistoria do carro com fotos e assinatura, enviada no WhatsApp em 3 minutos.",
  },

  geral: {
    voltar: "Voltar",
    proximo: "Próximo",
    fechar: "Fechar",
    cancelar: "Cancelar",
    salvar: "Salvar",
    salvo: "Salvo",
    desfazer: "Desfazer",
    carregando: "Carregando…",
    ajuda: "Ajuda",
    verVideo: "Ver vídeo",
    sim: "Sim",
    nao: "Não",
    tentarDeNovo: "Tentar de novo",
    copiar: "Copiar",
    copiado: "Copiado!",
  },

  menu: {
    inicio: "Início",
    vistorias: "Vistorias",
    patio: "Pátio",
    mais: "Mais",
    veiculosNoPatio: "No pátio",
    equipe: "Equipe",
    minhaOficina: "Minha oficina",
    meuPlano: "Meu plano",
    ajuda: "Ajuda",
  },

  vistoria: {
    nome: "Vistoria",
    chegada: "Chegada",
    entrega: "Entrega",
    chegadaBotao: "CHEGOU CARRO",
    entregaBotao: "ENTREGAR CARRO",
    continuar: "Continuar",
    etapas: {
      veiculo: "Carro e cliente",
      fotos: "Fotos",
      avarias: "Riscos e amassados",
      pneusItens: "Pneus e itens",
      conferir: "Assinar",
    },
    concluir: "Concluir vistoria",
    enviarCliente: "Enviar para o cliente",
    termoPdf: "Termo de vistoria (PDF)",
  },

  fotos: {
    tirarFoto: "Tirar foto",
    tirarDeNovo: "Tirar de novo",
    ficouBoa: "Ficou boa",
    escolherFoto: "Escolher foto",
    faltam: (n: number) => (n === 1 ? "Falta 1 foto" : `Faltam ${n} fotos`),
    estado: {
      vazio: "Falta",
      enviando: "Enviando",
      ok: "Pronta",
      erro: "Erro. Toque de novo",
      aguardando: "Sem internet",
    },
  },

  pneus: {
    todosBons: "Todos BONS",
    dianteiroEsquerdo: "Dianteiro esquerdo",
    dianteiroDireito: "Dianteiro direito",
    traseiroEsquerdo: "Traseiro esquerdo",
    traseiroDireito: "Traseiro direito",
    estepe: "Estepe",
  },

  campos: {
    placa: "Placa",
    telefone: "WhatsApp do cliente",
    km: "Km do painel",
    combustivel: "Combustível",
  },

  combustivel: {
    vazio: "Vazio",
    umQuarto: "1/4",
    meio: "1/2",
    tresQuartos: "3/4",
    cheio: "Cheio",
  },

  estadoItem: {
    bom: "BOM",
    ruim: "RUIM",
    ausente: "NÃO TEM",
    tem: "TEM",
    naoTem: "NÃO TEM",
  },

  erros: {
    placaFalta: "Coloque a placa",
    placaInvalida: "Placa incompleta",
    telefoneFalta: "Coloque o WhatsApp",
    telefoneInvalido: "Falta número. Coloque o DDD",
    kmFalta: "Coloque o km",
    escolhaUmaOpcao: "Escolha uma opção",
  },

  avisos: {
    semInternet: "Sem internet",
    semInternetDetalhe: "Pode continuar. Envia sozinho depois.",
    aguardandoEnvio: (n: number) => (n === 1 ? "1 foto vai enviar depois" : `${n} fotos vão enviar depois`),
  },

  confirmacao: {
    concluirTitulo: "Concluir?",
    concluirTexto: "Depois não dá para mudar.",
    concluirSim: "Sim, concluir",
    excluirTitulo: "Apagar?",
    excluirSim: "Sim, apagar",
    naoVoltar: "Não, voltar",
  },

  desfazer: {
    apagado: "Apagado",
  },

  modoSol: {
    ligar: "Tela forte (sol)",
  },

  vazio: {
    nenhumaVistoria: "Nenhuma vistoria ainda",
    nenhumaVistoriaAcao: "Toque em CHEGOU CARRO para começar.",
  },

  pix: {
    titulo: "Pagar com Pix",
    valor: "Valor",
    escaneie: "Abra o app do banco e leia o QR Code",
    ou: "ou",
    copiarCodigo: "Copiar código Pix",
    copiadoDica: "Agora cole no app do banco, em Pix Copia e Cola",
    aguardando: "Assim que o pagamento cair, liberamos seu acesso.",
  },
} as const;

export type Textos = typeof textos;
