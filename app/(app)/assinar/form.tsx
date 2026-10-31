"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, QrCode } from "lucide-react";
import { BotaoPrincipal, Campo, CampoTelefone, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { formatarCpfCnpj } from "@/lib/formatos";
import { formatarReais } from "@/lib/pix";
import { textos } from "@/lib/textos";
import type { FormaPagamento } from "@/lib/pagamentos/config";
import { fecharAba, levarAoPagamento, prepararAba } from "@/lib/pagamentos/abrir";
import { assinar } from "./acoes";

type Plano = { id: string; nome: string; valor: number; inclusos: number | null; video: boolean };

export function FormAssinar({
  planos,
  planoInicial,
  usuarios,
  inicial,
}: {
  planos: Plano[];
  planoInicial: string;
  usuarios: number;
  inicial: { nome: string; cpfCnpj: string; celular: string };
}) {
  const t = textos.assinatura;
  const router = useRouter();
  const [planoId, setPlanoId] = useState(planoInicial);
  const [forma, setForma] = useState<FormaPagamento | null>(null);
  const [nome, setNome] = useState(inicial.nome);
  const [cpfCnpj, setCpfCnpj] = useState(inicial.cpfCnpj);
  const [celular, setCelular] = useState(inicial.celular);
  const [erro, setErro] = useState<{ campo?: string; texto: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  const plano = planos.find((p) => p.id === planoId);

  function enviar() {
    if (!forma) return setErro({ campo: "forma", texto: "Escolha Pix ou cartão" });
    setErro(null);
    // A aba do Asaas abre já no toque (o navegador bloqueia aba aberta depois de esperar o servidor)
    const aba = prepararAba();
    iniciar(async () => {
      const r = await assinar({ planoId, forma, nome, cpfCnpj, celular });
      if (!r.ok) {
        fecharAba(aba);
        return setErro({ campo: r.campo, texto: r.erro });
      }
      if (!r.link) {
        fecharAba(aba);
        return router.push(r.destino);
      }
      // Pix ou cartão na página do Asaas (o sistema não recebe dados do cartão); aqui fica esperando a confirmação
      if (levarAoPagamento(aba, r.link)) router.push(r.destino);
    });
  }

  const erroDe = (campo: string) => (erro?.campo === campo ? erro.texto : undefined);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-6">
      <div>
        <h1 className="text-[1.75rem] font-extrabold">{t.titulo}</h1>
        <p className="text-lg text-muted-foreground">{t.subtitulo}</p>
      </div>

      {planos.length > 1 && (
        <SeletorGrande
          rotulo={t.plano}
          colunas={planos.length === 2 ? 2 : 3}
          valor={planoId}
          onChange={setPlanoId}
          opcoes={planos.map((p) => ({ valor: p.id, rotulo: p.nome }))}
        />
      )}
      {plano && (
        <div className="rounded-2xl bg-superficie px-4 py-3">
          <p className="text-lg">
            Plano <strong>{plano.nome}</strong>
          </p>
          <p className="text-3xl font-extrabold">
            {formatarReais(plano.valor)}
            <span className="text-lg font-bold text-muted-foreground"> /mês</span>
          </p>
          <p className="text-base text-muted-foreground">{t.equipe(usuarios)}</p>
          {plano.video && <p className="text-base font-bold text-oficina">{textos.planos.proTexto}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SeletorGrande
          rotulo={t.forma}
          colunas={2}
          valor={forma}
          onChange={setForma}
          erro={Boolean(erroDe("forma"))}
          opcoes={[
            { valor: "PIX", rotulo: "Pix", icone: <QrCode aria-hidden /> },
            { valor: "CREDIT_CARD", rotulo: "Cartão de crédito", icone: <CreditCard aria-hidden /> },
          ]}
        />
        {forma && <p className="text-base text-muted-foreground">{forma === "PIX" ? t.dicaPix : t.dicaCartao}</p>}
        {erroDe("forma") && <MensagemErroCampo>{erroDe("forma")}</MensagemErroCampo>}
      </div>

      <Campo rotulo={t.nome} valor={nome} onValor={setNome} autoComplete="name" erro={erroDe("nome")} />
      <Campo
        rotulo={t.cpfCnpj}
        dica={t.cpfCnpjDica}
        valor={cpfCnpj}
        onValor={(v) => setCpfCnpj(formatarCpfCnpj(v))}
        inputMode="numeric"
        autoComplete="off"
        erro={erroDe("cpfCnpj")}
      />
      <CampoTelefone rotulo={t.celular} valor={celular} onValor={setCelular} erro={erroDe("celular")} />

      {erro && !["forma", "nome", "cpfCnpj", "celular"].includes(erro.campo ?? "") && <MensagemErroCampo>{erro.texto}</MensagemErroCampo>}

      <BotaoPrincipal fixo onClick={enviar} carregando={enviando} icone={<ArrowRight aria-hidden />}>
        {t.irParaPagamento}
      </BotaoPrincipal>
    </main>
  );
}
