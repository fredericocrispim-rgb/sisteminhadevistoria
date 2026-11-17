"use client";

import { Lock } from "lucide-react";
import { Campo } from "@/components/vf";
import { textos } from "@/lib/textos";
import { formatarCep, formatarNumeroCartao, formatarValidade } from "@/lib/pagamentos/cartao";

export type DadosCartao = {
  nomeNoCartao: string;
  numero: string;
  validade: string;
  cvv: string;
  cep: string;
  numeroEndereco: string;
};

export const CARTAO_VAZIO: DadosCartao = { nomeNoCartao: "", numero: "", validade: "", cvv: "", cep: "", numeroEndereco: "" };

export const CAMPOS_CARTAO = Object.keys(CARTAO_VAZIO);

/**
 * Dados do cartão, digitados no próprio sistema. Vão para o servidor só para seguir ao Asaas:
 * nada fica gravado no navegador nem no banco (só o token que o Asaas devolve).
 */
export function CamposCartao({
  valor,
  onValor,
  erroDe,
}: {
  valor: DadosCartao;
  onValor: (v: DadosCartao) => void;
  erroDe: (campo: string) => string | undefined;
}) {
  const t = textos.assinatura;
  const muda = (campo: keyof DadosCartao) => (v: string) => onValor({ ...valor, [campo]: v });

  return (
    <fieldset className="flex flex-col gap-4 rounded-3xl bg-superficie/60 p-4">
      <legend className="sr-only">{t.cartaoTitulo}</legend>
      <p className="flex items-start gap-2 text-base font-semibold text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-5 shrink-0" /> {t.cartaoSeguro}
      </p>
      <Campo
        rotulo={t.numeroCartao}
        valor={valor.numero}
        onValor={(v) => muda("numero")(formatarNumeroCartao(v))}
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        erro={erroDe("numero")}
      />
      <Campo
        rotulo={t.nomeNoCartao}
        valor={valor.nomeNoCartao}
        onValor={(v) => muda("nomeNoCartao")(v.toUpperCase())}
        autoComplete="cc-name"
        autoCapitalize="characters"
        erro={erroDe("nomeNoCartao")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo={t.validade}
          valor={valor.validade}
          onValor={(v) => muda("validade")(formatarValidade(v))}
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="08/30"
          erro={erroDe("validade")}
        />
        <Campo
          rotulo={t.cvv}
          dica={t.cvvDica}
          valor={valor.cvv}
          onValor={(v) => muda("cvv")(v.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="123"
          erro={erroDe("cvv")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo={t.cep}
          valor={valor.cep}
          onValor={(v) => muda("cep")(formatarCep(v))}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="75800-000"
          erro={erroDe("cep")}
        />
        <Campo
          rotulo={t.numeroEndereco}
          valor={valor.numeroEndereco}
          onValor={muda("numeroEndereco")}
          inputMode="numeric"
          autoComplete="off"
          erro={erroDe("numeroEndereco")}
        />
      </div>
    </fieldset>
  );
}
