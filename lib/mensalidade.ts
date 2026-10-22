import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { usuariosAMais, valorMensalidade, type PrecoPlano } from "@/lib/cobranca";

export type MensalidadeOficina = {
  planoId: string | null;
  planoNome: string;
  preco: PrecoPlano;
  /** Usuários ativos que entram na cobrança (o dono conta; quem tem cupom não). */
  usuarios: number;
  /** Usuários ativos com cupom (ex.: CORTESIA): não são cobrados. */
  cortesias: number;
  aMais: number;
  valor: number;
};

/** Plano da oficina, quantos usuários ela tem e quanto paga por mês (o Pix usa este valor). */
export async function mensalidadeDaOficina(empresaId: string): Promise<MensalidadeOficina> {
  const admin = criarClienteAdmin();
  const [{ data: assinatura }, { data: planos }, { count }, { count: cortesias }] = await Promise.all([
    admin.from("assinaturas").select("plano_id").eq("empresa_id", empresaId).maybeSingle(),
    admin.from("planos").select("id, nome, preco_mensal, limite_usuarios, preco_usuario_extra").eq("ativo", true).order("ordem"),
    admin.from("usuarios_empresa").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("ativo", true).is("cupom", null),
    admin.from("usuarios_empresa").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("ativo", true).not("cupom", "is", null),
  ]);
  const p = planos?.find((x) => x.id === assinatura?.plano_id) ?? planos?.[0];
  const preco: PrecoPlano = {
    base: Number(p?.preco_mensal ?? 0),
    inclusos: p?.limite_usuarios ?? null,
    extra: Number(p?.preco_usuario_extra ?? 0),
  };
  const usuarios = Math.max(1, count ?? 1);
  return {
    planoId: p?.id ?? null,
    planoNome: p?.nome ?? "",
    preco,
    usuarios,
    cortesias: cortesias ?? 0,
    aMais: usuariosAMais(preco, usuarios),
    valor: valorMensalidade(preco, usuarios),
  };
}
