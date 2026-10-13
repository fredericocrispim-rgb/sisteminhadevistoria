/**
 * TODOS os textos da interface ficam aqui.
 * Para trocar uma palavra no app, mude só neste arquivo.
 * Regra: frases curtas, palavras do pátio, nada técnico (Anexo B do guia).
 * Internamente: ENTRADA = "Chegada"; SAIDA = "Entrega".
 */

export const textos = {
  produto: {
    nome: "Sisteminha de Vistoria",
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

  entrar: {
    titulo: "Entrar",
    subtitulo: "Sem senha. Mandamos um código no seu e-mail.",
    email: "Seu e-mail",
    receberCodigo: "Receber código",
    codigoTitulo: "Digite o código",
    codigoEnviado: (email: string) => `Mandamos para ${email}. Olhe também no lixo eletrônico.`,
    codigo: "Código do e-mail",
    entrar: "Entrar",
    reenviar: "Mandar outro código",
    reenviarEm: (s: number) => `Mandar outro código em ${s}s`,
    trocarEmail: "Trocar e-mail",
    erros: {
      emailInvalido: "E-mail incompleto. Confira.",
      codigoIncompleto: "Digite o código inteiro",
      codigoErrado: "Código errado ou vencido. Confira ou peça outro.",
      muitasTentativas: "Muitas tentativas. Espere um pouco e tente de novo.",
      falhou: "Não deu certo. Confira a internet e tente de novo.",
    },
    sair: "Sair",
  },

  cadastro: {
    etapas: ["Você", "Sua oficina", "Sua logo", "Sua equipe"],
    voce: {
      nome: "Seu nome",
      whatsapp: "Seu WhatsApp",
      aceite: "Li e aceito os",
      termos: "Termos de Uso",
      e: "e a",
      privacidade: "Política de Privacidade",
      erroNome: "Coloque seu nome",
      erroAceite: "Marque que você aceita para continuar",
    },
    oficina: {
      documento: "CNPJ ou CPF",
      buscando: "Procurando sua empresa…",
      encontrada: "Achamos sua empresa. Confira:",
      naoEncontrada: "Não achamos. Preencha abaixo.",
      nome: "Nome da oficina",
      nomeDica: "Como os clientes conhecem",
      whatsapp: "WhatsApp da oficina",
      cep: "CEP",
      numero: "Número",
      endereco: "Endereço",
      cidade: "Cidade",
      tipo: "Tipo",
      quantas: "Vistorias por mês, mais ou menos",
      erroDocumento: "CNPJ ou CPF com número errado",
      erroNome: "Coloque o nome da oficina",
      segmentos: {
        oficina: "Oficina",
        funilaria: "Funilaria",
        autocentro: "Autocentro",
        guincho: "Guincho",
        associacao: "Associação",
        outro: "Outro",
      },
      faixas: ["até 50", "50 a 150", "150 a 500", "mais de 500"],
    },
    logo: {
      tirarFoto: "Tirar foto da logo",
      escolher: "Escolher arquivo",
      semLogo: "Não tenho logo agora",
      trocar: "Trocar logo",
      cor: "Cor da oficina",
      comoFica: "Como fica",
      processando: "Arrumando a logo…",
      erroArquivo: "Use uma imagem (foto, PNG, JPG ou SVG) de até 5 MB",
    },
    equipe: {
      explicacao: "Quem mais vai fazer vistorias? Pode pular e fazer depois.",
      nome: "Nome da pessoa",
      papel: "O que ela faz",
      vistoriador: "Vistoriador",
      vistoriadorDica: "Só faz vistorias",
      gerente: "Gerente",
      gerenteDica: "Faz tudo, menos o plano",
      criarConvite: "Criar convite",
      enviarWhatsapp: "Mandar no WhatsApp",
      mensagem: (nome: string, oficina: string, link: string) =>
        `Olá, ${nome}! Você foi convidado para fazer vistorias da ${oficina} no Sisteminha de Vistoria. Toque no link para entrar: ${link}`,
      pular: "Pular por agora",
    },
    pronto: {
      titulo: "Tudo pronto!",
      texto: "Sua oficina já está no sistema.",
      teste: (dias: number) => `Você tem ${dias} dias grátis para testar.`,
      comecar: "Ir para o início",
    },
    continuar: "Continuar",
  },

  convite: {
    titulo: "Você foi convidado",
    texto: (oficina: string, papel: string) => `${oficina} chamou você para ser ${papel}.`,
    aceitar: "Aceitar e entrar",
    invalido: "Este convite não vale mais",
    invalidoTexto: "Peça um novo convite para a oficina.",
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
