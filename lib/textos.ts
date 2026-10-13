/**
 * TODOS os textos da interface ficam aqui.
 * Para trocar uma palavra no app, mude só neste arquivo.
 * Vocabulário: linguagem do pátio, sem termos técnicos (Anexo B do guia).
 * Internamente: ENTRADA = "Chegada do veículo"; SAIDA = "Entrega do veículo".
 */

export const textos = {
  produto: {
    nome: "VistoriaFácil",
    slogan: "Vistoria de veículos com fotos, assinatura e envio pelo WhatsApp em 3 minutos.",
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
    sim: "Sim",
    nao: "Não",
    tentarDeNovo: "Tentar de novo",
    passoDe: (atual: number, total: number) => `Passo ${atual} de ${total}`,
  },

  menu: {
    inicio: "Início",
    vistorias: "Vistorias",
    patio: "Pátio",
    mais: "Mais",
    veiculosNoPatio: "Veículos no pátio",
    equipe: "Equipe",
    minhaOficina: "Minha oficina",
    meuPlano: "Meu plano",
    ajuda: "Ajuda",
  },

  vistoria: {
    nome: "Vistoria",
    chegada: "Chegada do veículo",
    entrega: "Entrega do veículo",
    chegadaBotao: "CHEGADA DE VEÍCULO",
    entregaBotao: "ENTREGA DE VEÍCULO",
    chegadaExplicacao: "O carro acabou de chegar na oficina",
    entregaExplicacao: "O carro vai sair da oficina",
    continuar: "Continuar vistoria",
    etapas: {
      veiculo: "Veículo e cliente",
      fotos: "Fotos",
      avarias: "Riscos e amassados",
      pneusItens: "Pneus e itens",
      conferir: "Conferir e assinar",
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
      vazio: "Falta tirar",
      enviando: "Enviando…",
      ok: "Foto salva",
      erro: "Não enviou. Toque de novo",
      aguardando: "Aguardando internet",
    },
  },

  campos: {
    placa: "Placa",
    placaDica: "Ex.: ABC1D23 ou ABC-1234",
    telefone: "WhatsApp do cliente",
    telefoneDica: "Com DDD. Ex.: (11) 98765-4321",
    km: "Quilometragem (km)",
    kmDica: "O número que aparece no painel",
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
    ausente: "AUSENTE",
    tem: "TEM",
    naoTem: "NÃO TEM",
  },

  erros: {
    placaFalta: "Falta a placa do veículo",
    placaInvalida: "Placa incompleta. Confira as letras e números",
    telefoneFalta: "Falta o WhatsApp do cliente",
    telefoneInvalido: "Número incompleto. Coloque o DDD e o número",
    kmFalta: "Falta a quilometragem",
    escolhaUmaOpcao: "Escolha uma das opções",
  },

  avisos: {
    semInternet: "Sem internet. Pode continuar: tudo fica salvo e envia sozinho quando a internet voltar.",
    voltouInternet: "Internet de volta. Enviando o que ficou guardado…",
    aguardandoEnvio: (n: number) =>
      n === 1 ? "1 foto aguardando internet" : `${n} fotos aguardando internet`,
  },

  confirmacao: {
    concluirTitulo: "Concluir a vistoria?",
    concluirTexto: "Depois de concluir, não dá para alterar. Se precisar corrigir, você poderá fazer uma observação extra (adendo).",
    concluirSim: "Sim, concluir",
    excluirTitulo: "Excluir?",
    excluirSim: "Sim, excluir",
    naoVoltar: "Não, voltar",
  },

  desfazer: {
    apagado: "Apagado.",
  },

  modoSol: {
    ligar: "Modo sol",
    descricao: "Deixa a tela mais forte para ver no sol",
    ligado: "Modo sol ligado",
    desligado: "Modo sol desligado",
  },

  vazio: {
    nenhumaVistoria: "Você ainda não fez nenhuma vistoria.",
    nenhumaVistoriaAcao: "Toque em CHEGADA DE VEÍCULO para começar.",
  },
} as const;

export type Textos = typeof textos;
