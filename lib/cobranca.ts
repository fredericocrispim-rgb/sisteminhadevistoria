/**
 * Valor da mensalidade conforme o tamanho da equipe.
 * Ex.: plano de R$ 49,90 com 4 usuários inclusos (dono + 3) e R$ 19,90 por usuário a mais:
 * 4 usuários = R$ 49,90 · 5 = R$ 69,80 · 6 = R$ 89,70. Usuário com cupom não entra na conta.
 */
export type PrecoPlano = {
  base: number;
  /** Usuários incluídos no preço (vazio = sem limite). */
  inclusos: number | null;
  /** Quanto custa cada usuário depois dos inclusos. */
  extra: number;
};

export function usuariosAMais(plano: PrecoPlano, usuarios: number) {
  if (plano.inclusos == null) return 0;
  return Math.max(0, usuarios - plano.inclusos);
}

export function valorMensalidade(plano: PrecoPlano, usuarios: number) {
  return Math.round((plano.base + usuariosAMais(plano, usuarios) * plano.extra) * 100) / 100;
}
