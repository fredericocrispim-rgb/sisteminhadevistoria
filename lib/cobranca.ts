/**
 * Valor da mensalidade conforme o tamanho da equipe.
 * Ex.: plano de R$ 49,90 com 5 usuários inclusos (dono + 4) e R$ 19,90 por usuário a mais:
 * 5 usuários = R$ 49,90 · 6 = R$ 69,80 · 7 = R$ 89,70.
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
