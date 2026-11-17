"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Barcode, Check, CheckCircle2, ChevronRight, CreditCard, QrCode } from "lucide-react";
import { BarraEtapas, BotaoPrincipal, Campo, CampoTelefone, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { cnpjValido, cpfValido, formatarCpfCnpj, telefoneValido } from "@/lib/formatos";
import { formatarReais } from "@/lib/pix";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import type { FormaPagamento } from "@/lib/pagamentos/config";
import { assinar } from "./acoes";
import { CAMPOS_CARTAO, CARTAO_VAZIO, CamposCartao, type DadosCartao } from "./campos-cartao";

type Plano = { id: string; nome: string; valor: number; inclusos: number | null; video: boolean };

const TELA_FORMA = 1;
const TELA_DADOS = 2;
const TELA_CARTAO = 3;

/** Em que tela fica cada campo (para voltar nela quando o servidor acusa erro). */
function telaDoCampo(campo?: string) {
  if (campo === "forma") return TELA_FORMA;
  if (campo === "nome" || campo === "cpfCnpj" || campo === "celular") return TELA_DADOS;
  if (campo === "cartao" || CAMPOS_CARTAO.includes(campo ?? "")) return TELA_CARTAO;
  return null;
}

/**
 * Assinar, uma coisa por tela:
 * (1) como quer pagar (Pix, cartão ou boleto), (2) CPF ou CNPJ e (3) dados do cartão (só no cartão).
 * Cartão aprovado: libera na hora. Pix e boleto: vai para a tela da cobrança (QR Code ou boleto).
 */
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
  const [tela, setTela] = useState(TELA_FORMA);
  const [planoId, setPlanoId] = useState(planoInicial);
  const [forma, setForma] = useState<FormaPagamento | null>(null);
  const [nome, setNome] = useState(inicial.nome);
  const [cpfCnpj, setCpfCnpj] = useState(inicial.cpfCnpj);
  const [celular, setCelular] = useState(inicial.celular);
  const [cartao, setCartao] = useState<DadosCartao>(CARTAO_VAZIO);
  const [erro, setErro] = useState<{ campo?: string; texto: string } | null>(null);
  const [pago, setPago] = useState(false);
  const [enviando, iniciar] = useTransition();
  const plano = planos.find((p) => p.id === planoId);
  const ehCartao = forma === "CREDIT_CARD";
  const etapas = ehCartao ? [...t.etapas] : t.etapas.slice(0, 2);

  function ir(n: number) {
    setTela(n);
    window.scrollTo(0, 0);
  }

  function escolher(f: FormaPagamento) {
    setForma(f);
    setErro(null);
    ir(TELA_DADOS);
  }

  /** Confere aqui mesmo o que dá para conferir, antes de ir ao servidor. */
  function conferirDados() {
    let problema: { campo: string; texto: string } | null = null;
    if (!cpfValido(cpfCnpj) && !cnpjValido(cpfCnpj)) problema = { campo: "cpfCnpj", texto: "CPF ou CNPJ inválido. Confira os números" };
    else if (nome.trim().length < 3) problema = { campo: "nome", texto: "Coloque o nome ou a razão social" };
    else if (!telefoneValido(celular)) problema = { campo: "celular", texto: "Celular inválido. Coloque o DDD" };
    setErro(problema);
    return !problema;
  }

  function enviar() {
    if (!forma) return ir(TELA_FORMA);
    iniciar(async () => {
      const r = await assinar({ planoId, forma, nome, cpfCnpj, celular, cartao: ehCartao ? cartao : undefined });
      if (!r.ok) {
        // Cartão recusado: limpa só o código de segurança, para digitar de novo ou trocar de cartão
        if (r.campo === "cartao") setCartao((c) => ({ ...c, cvv: "" }));
        setErro({ campo: r.campo, texto: r.erro });
        const volta = telaDoCampo(r.campo);
        if (volta && volta !== tela) ir(volta);
        return;
      }
      if (r.pago) {
        setPago(true);
        setTimeout(() => {
          router.replace(r.destino);
          router.refresh();
        }, 2500);
        return;
      }
      router.push(r.destino);
    });
  }

  const erroDe = (campo: string) => (erro?.campo === campo ? erro.texto : undefined);
  // Erro sem campo (falha de internet, cartão recusado): aparece em cima do botão
  const erroGeral = erro && (!erro.campo || erro.campo === "cartao" || !telaDoCampo(erro.campo)) ? erro.texto : null;

  if (pago) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-6">
        <div role="status" className="flex items-center gap-4 rounded-3xl bg-acao-clara px-5 py-5 text-acao [&_svg]:size-10 [&_svg]:shrink-0">
          <CheckCircle2 aria-hidden />
          <div>
            <p className="text-xl font-extrabold">{t.confirmado}</p>
            <p className="text-base font-semibold">{t.confirmadoTexto}</p>
          </div>
        </div>
      </main>
    );
  }

  const formas: { valor: FormaPagamento; rotulo: string; dica: string; icone: React.ReactNode }[] = [
    { valor: "PIX", rotulo: t.pix, dica: t.dicaPix, icone: <QrCode aria-hidden /> },
    { valor: "CREDIT_CARD", rotulo: t.cartao, dica: t.dicaCartao, icone: <CreditCard aria-hidden /> },
    { valor: "BOLETO", rotulo: t.boleto, dica: t.dicaBoleto, icone: <Barcode aria-hidden /> },
  ];

  return (
    <>
      <BarraEtapas etapas={etapas} atual={tela} onVoltar={tela > TELA_FORMA ? () => ir(tela - 1) : () => router.back()} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-2 pb-6">
        {tela === TELA_FORMA && (
          <>
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
            <div role="radiogroup" aria-label={t.forma} className="flex flex-col gap-3">
              {formas.map((f) => {
                const marcado = forma === f.valor;
                return (
                  <button
                    key={f.valor}
                    type="button"
                    role="radio"
                    aria-checked={marcado}
                    onClick={() => escolher(f.valor)}
                    className={cn(
                      "tocavel flex min-h-toque-grande items-center gap-4 rounded-3xl p-4 text-left ring-2",
                      marcado ? "bg-oficina-clara ring-oficina" : "cartao ring-transparent",
                    )}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-oficina text-oficina-texto [&_svg]:size-7">
                      {marcado ? <Check aria-hidden strokeWidth={3} /> : f.icone}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-2xl font-extrabold">{f.rotulo}</span>
                      <span className="text-base font-semibold text-muted-foreground">{f.dica}</span>
                    </span>
                    <ChevronRight aria-hidden className="size-7 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
            {erroDe("forma") && <MensagemErroCampo>{erroDe("forma")}</MensagemErroCampo>}
          </>
        )}

        {tela === TELA_DADOS && (
          <>
            <Campo
              rotulo={t.cpfCnpj}
              dica={t.cpfCnpjDica}
              valor={cpfCnpj}
              onValor={(v) => setCpfCnpj(formatarCpfCnpj(v))}
              inputMode="numeric"
              autoComplete="off"
              autoFocus={!cpfCnpj}
              enterKeyHint="next"
              erro={erroDe("cpfCnpj")}
            />
            <Campo rotulo={t.nome} valor={nome} onValor={setNome} autoComplete="name" erro={erroDe("nome")} />
            <CampoTelefone rotulo={t.celular} valor={celular} onValor={setCelular} erro={erroDe("celular")} />
            {erroGeral && <MensagemErroCampo>{erroGeral}</MensagemErroCampo>}
            <BotaoPrincipal
              carregando={enviando}
              icone={<ArrowRight aria-hidden />}
              onClick={() => {
                if (!conferirDados()) return;
                if (ehCartao) ir(TELA_CARTAO);
                else enviar();
              }}
            >
              {ehCartao ? t.proximo : forma === "BOLETO" ? t.gerarBoleto : t.gerarPix}
            </BotaoPrincipal>
          </>
        )}

        {tela === TELA_CARTAO && ehCartao && (
          <>
            <CamposCartao valor={cartao} onValor={setCartao} erroDe={erroDe} />
            {erroGeral && <MensagemErroCampo>{erroGeral}</MensagemErroCampo>}
            <BotaoPrincipal fixo onClick={enviar} carregando={enviando} icone={<ArrowRight aria-hidden />}>
              {t.pagarAgora} {plano ? formatarReais(plano.valor) : ""}
            </BotaoPrincipal>
          </>
        )}
      </main>
    </>
  );
}
