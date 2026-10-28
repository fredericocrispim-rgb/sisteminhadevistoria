import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/** Busca a vistoria pelo link público (token). Só concluídas e com o link ativo. */
export async function vistoriaPorToken(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const admin = criarClienteAdmin();
  const { data } = await admin
    .from("vistorias")
    .select(
      `id, tipo, tipo_veiculo, numero, status, codigo_autenticidade, concluida_em, km, combustivel, observacoes, pdf_url, link_publico_ativo,
       nome_assinante_cliente, cliente_ausente_justificativa, recebido_por, liberado_por,
       empresas (nome_fantasia, whatsapp, logo_app_url),
       veiculos (placa, marca, modelo, cor), clientes (nome)`,
    )
    .eq("token_publico", token)
    .maybeSingle();
  if (!data || data.status === "rascunho" || data.status === "cancelada" || !data.link_publico_ativo) return null;
  return data;
}
