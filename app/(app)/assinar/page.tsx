import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { valorMensalidade } from "@/lib/cobranca";
import { formatarCpfCnpj, formatarTelefone } from "@/lib/formatos";
import { mensalidadeDaOficina } from "@/lib/mensalidade";
import { asaasLigado } from "@/lib/pagamentos/asaas";
import { PROVEDOR_ASAAS } from "@/lib/pagamentos/config";
import { FormAssinar } from "./form";

export const metadata: Metadata = { title: "Assinar" };

/** Assinar: escolher o plano e Pix ou cartão. Pede CPF/CNPJ e celular (o Asaas exige). Só o dono. */
export default async function Assinar() {
  const { empresa, papel, plano, usuario } = await exigirOficina({ permitirBloqueado: true });
  if (papel !== "dono" || !asaasLigado()) redirect("/plano");
  // Assinatura em andamento: a tela "Minha assinatura" mostra a cobrança em aberto
  if (plano.provedor === PROVEDOR_ASAAS && plano.idAssinaturaExterna && plano.status !== "cancelada" && plano.status !== "inadimplente") {
    redirect("/plano");
  }

  const admin = criarClienteAdmin();
  const [{ data: planos }, { data: dados }, m] = await Promise.all([
    admin.from("planos").select("id, nome, preco_mensal, limite_usuarios, preco_usuario_extra").eq("ativo", true).order("ordem"),
    admin.from("empresas").select("cnpj_cpf, razao_social, whatsapp").eq("id", empresa.id).single(),
    mensalidadeDaOficina(empresa.id),
  ]);

  const opcoes = (planos ?? []).map((p) => {
    const preco = { base: Number(p.preco_mensal), inclusos: p.limite_usuarios, extra: Number(p.preco_usuario_extra ?? 0) };
    return { id: p.id, nome: p.nome, valor: valorMensalidade(preco, m.usuarios), inclusos: p.limite_usuarios as number | null };
  });

  return (
    <FormAssinar
      planos={opcoes}
      planoInicial={m.planoId ?? opcoes[0]?.id ?? ""}
      usuarios={m.usuarios}
      inicial={{
        nome: dados?.razao_social || usuario.nome || empresa.nome_fantasia,
        cpfCnpj: dados?.cnpj_cpf ? formatarCpfCnpj(dados.cnpj_cpf) : "",
        celular: formatarTelefone(dados?.whatsapp || usuario.whatsapp || ""),
      }}
    />
  );
}
