"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { BotaoPrincipal, BotaoSecundario, Campo, CampoTelefone, ConfirmacaoImportante, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { textos } from "@/lib/textos";
import { formatarTelefone, telefoneParaWhatsapp, telefoneValido } from "@/lib/formatos";
import { cadastrarUsuario, cancelarConvite, tirarDaEquipe } from "./acoes";
import { SENHA_PADRAO } from "@/lib/senha-padrao";

const t = textos.equipe;
const whatsapp = (mensagem: string) => `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
/** Abre o WhatsApp já na conversa com a pessoa, com a mensagem pronta. */
const whatsappPara = (numero: string, mensagem: string) => `https://wa.me/${telefoneParaWhatsapp(numero)}?text=${encodeURIComponent(mensagem)}`;


export function Membro({
  id,
  nome,
  papel,
  voce,
  cortesia,
  podeTirar,
  whatsappPessoa,
  mensagemAcesso,
}: {
  id: string;
  nome: string;
  papel: string;
  voce: boolean;
  cortesia?: boolean;
  podeTirar: boolean;
  /** WhatsApp da pessoa (para mandar o acesso de novo). */
  whatsappPessoa?: string | null;
  mensagemAcesso?: string;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-superficie px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-extrabold">
          {nome}
          {voce && <span className="ml-2 rounded-full bg-oficina px-2 py-0.5 text-sm font-bold text-oficina-texto">{t.voce}</span>}
        </p>
        <p className="text-base text-muted-foreground">
          {papel}
          {cortesia && <span className="ml-2 rounded-full bg-acao-clara px-2 py-0.5 text-sm font-bold text-acao">{t.cortesia}</span>}
        </p>
        <p className="text-base text-muted-foreground">{whatsappPessoa || t.semWhatsapp}</p>
      </div>
      {!voce && whatsappPessoa && mensagemAcesso && (
        <a
          href={whatsappPara(whatsappPessoa, mensagemAcesso)}
          target="_blank"
          rel="noreferrer"
          aria-label={t.mandarAcessoPara(nome)}
          className="tocavel inline-flex min-h-toque items-center gap-1.5 rounded-xl bg-[#1f8f4e] px-3 text-base font-bold text-white [&_svg]:size-5"
        >
          <MessageCircle aria-hidden /> {t.reenviar}
        </a>
      )}
      {podeTirar && (
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="tocavel inline-flex min-h-toque items-center gap-1.5 rounded-xl px-2 text-base font-bold text-perigo [&_svg]:size-5"
        >
          <UserMinus aria-hidden /> Tirar
        </button>
      )}
      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        titulo={t.tirarTitulo(nome.split(" ")[0])}
        texto={t.tirarTexto}
        textoConfirmar={t.tirar}
        onConfirmar={async () => {
          const r = await tirarDaEquipe(id);
          if (!r.ok) return toast.error(r.erro);
          router.refresh();
        }}
      />
    </li>
  );
}

export function ConvitePendente({ id, nome, papel, mensagem }: { id: string; nome: string; papel: string; mensagem: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-input px-4 py-3">
      <div>
        <p className="text-lg font-extrabold">{nome}</p>
        <p className="text-base text-muted-foreground">{papel}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={whatsapp(mensagem)}
          target="_blank"
          rel="noreferrer"
          className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-3 text-base font-bold text-white [&_svg]:size-5"
        >
          <MessageCircle aria-hidden /> WhatsApp
        </a>
        <button
          type="button"
          onClick={async () => {
            const r = await cancelarConvite(id);
            if (!r.ok) return toast.error(r.erro);
            router.refresh();
          }}
          className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-superficie px-3 text-base font-bold [&_svg]:size-5"
        >
          <X aria-hidden /> Cancelar
        </button>
      </div>
    </div>
  );
}

type Papel = "vistoriador" | "gerente";
type DadosCadastro = Parameters<typeof cadastrarUsuario>[0];


/** 1 nome · 2 WhatsApp · 3 e-mail · 4 o que faz · 5 conferir e cadastrar */
const TELAS = t.perguntas.length;

/**
 * Cadastrar pessoa direto, UMA pergunta por tela: nome, WhatsApp, e-mail, o que ela faz e conferir.
 * A senha é a padrão (SENHA_PADRAO) e vai junto na mensagem do WhatsApp: quem cadastra não inventa nada,
 * e a pessoa entra sozinha. Usado pelo dono/gerente em /equipe e pelo administrador no /admin.
 */
export function AdicionarPessoa({
  oficina,
  base,
  avisoPlano,
  avisoPreco,
  cadastrar: acaoCadastrar = cadastrarUsuario,
}: {
  oficina: string;
  base: string;
  /** "Ainda cabem N pessoas no plano" (quando ainda cabe). */
  avisoPlano: string | null;
  /** "Com essa pessoa, a mensalidade passa para R$ X" (quando passa do plano). */
  avisoPreco: string | null;
  /** Ação que cria a conta (padrão: a do dono/gerente; no /admin, a do administrador). */
  cadastrar?: (d: DadosCadastro) => Promise<{ ok: true } | { ok: false; erro: string }>;
}) {
  const router = useRouter();
  const [tela, setTela] = useState(0); // 0 = fechado
  const [nome, setNome] = useState("");
  const [zap, setZap] = useState("");
  const [email, setEmail] = useState("");
  const [cupom, setCupom] = useState("");
  const [papel, setPapel] = useState<Papel>("vistoriador");
  const [conferir, setConferir] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState<{ nome: string; email: string; whatsapp: string; senha: string } | null>(null);

  function recomecar() {
    setNome("");
    setZap("");
    setEmail("");
    setCupom("");
    setPapel("vistoriador");
    setConferir(false);
    setErro(undefined);
    setPronto(null);
    setTela(1);
  }

  if (pronto) {
    const primeiro = pronto.nome.split(" ")[0];
    return (
      <section className="flex flex-col gap-3 rounded-3xl bg-acao-clara p-4">
        <p className="flex items-center gap-2 text-xl font-extrabold text-acao">
          <Check aria-hidden className="size-7" /> {t.cadastrado(primeiro)}
        </p>
        <p className="text-lg font-semibold">{t.cadastradoTextoComSenha}</p>
        <p className="rounded-2xl bg-background px-4 py-3 text-lg break-all">
          <span className="block text-base text-muted-foreground">{t.email}</span>
          <strong>{pronto.email}</strong>
          <span className="mt-2 block text-base text-muted-foreground">{t.senha}</span>
          <strong>{pronto.senha}</strong>
        </p>
        <BotaoPrincipal
          nativo
          href={whatsappPara(pronto.whatsapp, t.mensagemAcessoComSenha(primeiro, oficina, base, pronto.email, pronto.senha))}
          icone={<MessageCircle aria-hidden />}
        >
          {t.mandarAcessoPara(primeiro)}
        </BotaoPrincipal>
        <BotaoSecundario icone={<UserPlus aria-hidden />} onClick={recomecar}>
          {t.adicionar}
        </BotaoSecundario>
      </section>
    );
  }

  if (tela === 0) {
    return (
      <>
        {avisoPlano && <p className="rounded-2xl bg-acao-clara px-4 py-3 text-base font-bold text-acao">{avisoPlano}</p>}
        <BotaoPrincipal icone={<UserPlus aria-hidden />} onClick={recomecar}>
          {t.adicionar}
        </BotaoPrincipal>
      </>
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const nomeOk = nome.trim().length >= 2;
  const zapOk = telefoneValido(zap);
  const erros = {
    nome: conferir && !nomeOk ? t.erroNome : undefined,
    whatsapp: conferir && !zapOk ? (zap ? textos.erros.telefoneInvalido : textos.erros.telefoneFalta) : undefined,
    email: conferir && !emailOk ? (email ? t.erroEmail : t.erroEmailFalta) : undefined,
  };
  const primeiro = nome.trim().split(" ")[0];

  function ir(p: number) {
    setConferir(false);
    setErro(undefined);
    setTela(p);
  }

  async function avancar() {
    setConferir(true);
    setErro(undefined);
    if (tela === 1 && !nomeOk) return;
    if (tela === 2 && !zapOk) return;
    if (tela === 3 && !emailOk) return;
    if (tela < TELAS) return ir(tela + 1);
    // Última tela: se faltou algo antes, volta até lá
    if (!nomeOk) return ir(1);
    if (!zapOk) return ir(2);
    if (!emailOk) return ir(3);
    const senha = SENHA_PADRAO;
    setCarregando(true);
    const r = await acaoCadastrar({ nome, whatsapp: zap, email, senha, papel, cupom });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    setPronto({ nome: nome.trim(), email: email.trim().toLowerCase(), whatsapp: zap, senha });
    router.refresh();
  }

  const linhaConferir = (rotulo: string, valor: string, volta: number) => (
    <li className="flex items-center gap-3 rounded-2xl bg-background px-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-base text-muted-foreground">{rotulo}</p>
        <p className="text-lg font-bold break-all">{valor}</p>
      </div>
      <button type="button" onClick={() => ir(volta)} className="tocavel min-h-toque shrink-0 px-2 text-base font-bold text-oficina underline underline-offset-4">
        {t.trocar}
      </button>
    </li>
  );

  return (
    <form
      className="flex flex-col gap-4 rounded-3xl bg-superficie p-4"
      onSubmit={(e) => {
        e.preventDefault();
        avancar();
      }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => (tela > 1 ? ir(tela - 1) : setTela(0))}
          className="tocavel inline-flex min-h-toque items-center gap-1.5 rounded-2xl pr-2 text-lg font-bold [&_svg]:size-6"
        >
          {tela > 1 ? <ArrowLeft aria-hidden /> : <X aria-hidden />}
          {tela > 1 ? textos.geral.voltar : t.fechar}
        </button>
        <span className="ml-auto rounded-full bg-oficina-clara px-3 py-0.5 text-base font-extrabold text-oficina tabular-nums" aria-live="polite">
          <span className="sr-only">Passo </span>
          {tela} de {TELAS}
        </span>
      </div>
      <h2 className="text-2xl leading-tight font-extrabold">{t.perguntas[tela - 1].replace("{nome}", primeiro || t.pessoa)}</h2>

      {tela === 1 && (
        <Campo key="nome" rotulo={t.nome} autoCapitalize="words" autoComplete="off" enterKeyHint="next" autoFocus valor={nome} onValor={setNome} erro={erros.nome} />
      )}
      {tela === 2 && (
        <CampoTelefone
          key="zap"
          rotulo={t.whatsapp}
          dica={t.whatsappDica}
          enterKeyHint="next"
          autoFocus
          valor={zap}
          onValor={(v) => setZap(formatarTelefone(v))}
          erro={erros.whatsapp}
        />
      )}
      {tela === 3 && (
        <Campo
          key="email"
          rotulo={t.email}
          dica={t.emailDica}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="next"
          autoFocus
          placeholder="nome@email.com"
          valor={email}
          onValor={setEmail}
          erro={erros.email}
        />
      )}
      {tela === 4 && (
        <>
          <SeletorGrande
            rotulo={t.papel}
            valor={papel}
            onChange={setPapel}
            opcoes={[
              { valor: "vistoriador", rotulo: t.vistoriador },
              { valor: "gerente", rotulo: t.gerente },
            ]}
            colunas={2}
          />
          <p className="-mt-2 text-base font-semibold text-muted-foreground">{papel === "gerente" ? t.gerenteDica : t.vistoriadorDica}</p>
        </>
      )}
      {tela === 5 && (
        <>
          <ul className="flex flex-col gap-2">
            {linhaConferir(t.nome, nome.trim(), 1)}
            {linhaConferir(t.whatsapp, zap, 2)}
            {linhaConferir(t.email, email.trim().toLowerCase(), 3)}
            {linhaConferir(t.papel, papel === "gerente" ? t.gerente : t.vistoriador, 4)}
          </ul>
          <p className="text-base font-semibold text-muted-foreground">{t.senhaAutomatica}</p>
          {avisoPreco ? (
            <>
              <p className="rounded-2xl bg-atencao-clara px-4 py-3 text-base font-bold text-atencao-texto">{avisoPreco}</p>
              <Campo
                rotulo={t.cupom}
                dica={t.cupomDica}
                autoCapitalize="characters"
                autoComplete="off"
                valor={cupom}
                onValor={(v) => setCupom(v.toUpperCase())}
              />
            </>
          ) : (
            avisoPlano && <p className="rounded-2xl bg-acao-clara px-4 py-3 text-base font-bold text-acao">{avisoPlano}</p>
          )}
        </>
      )}

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal type="submit" carregando={carregando} icone={tela === TELAS ? <Check aria-hidden /> : <ArrowRight aria-hidden />}>
        {tela === TELAS ? t.cadastrar : textos.cadastro.proximo}
      </BotaoPrincipal>
    </form>
  );
}
