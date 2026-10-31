/**
 * Abre a página de pagamento do Asaas numa aba nova, sem tirar a pessoa do sistema:
 * a aba do sistema fica na tela "Esperando o pagamento" e libera sozinha quando o pagamento cai.
 * Só no navegador.
 */

/**
 * Abre a aba vazia JÁ no toque (antes de esperar o servidor), senão o navegador bloqueia como "pop-up".
 * Depois, `levarAoPagamento` coloca o endereço do Asaas nela.
 */
export function prepararAba(): Window | null {
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

/** Coloca a página do Asaas na aba preparada. Se o navegador não deixou abrir aba, abre aqui mesmo. */
export function levarAoPagamento(aba: Window | null, link: string) {
  if (aba && !aba.closed) {
    aba.opener = null;
    aba.location.href = link;
    return true;
  }
  window.location.href = link;
  return false;
}

export function fecharAba(aba: Window | null) {
  try {
    aba?.close();
  } catch {
    // já fechada
  }
}
