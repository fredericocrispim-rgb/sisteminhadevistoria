"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { BotaoPrincipal, BotaoSecundario, Campo, CampoSenha, CampoTelefone, ConfirmacaoImportante, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { textos } from "@/lib/textos";
import { formatarTelefone, telefoneParaWhatsapp, telefoneValido } from "@/lib/formatos";
import { cadastrarUsuario, cancelarConvite, tirarDaEquipe } from "./acoes";

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

/** Cadastrar pessoa direto: nome, e-mail, senha e o que ela faz. Ela já pode entrar na hora. */
export function AdicionarPessoa({
  oficina,
  base,
  avisoPlano,
  avisoPreco,
}: {
  oficina: string;
  base: string;
  /** "Ainda cabem N pessoas no plano" (quando ainda cabe). */
  avisoPlano: string | null;
  /** "Com essa pessoa, a mensalidade passa para R$ X" (quando passa do plano). */
  avisoPreco: string | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [zap, setZap] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cupom, setCupom] = useState("");
  const [papel, setPapel] = useState<Papel>("vistoriador");
  const [conferir, setConferir] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState<{ nome: string; email: string; whatsapp: string } | null>(null);

  function recomecar() {
    setNome("");
    setZap("");
    setEmail("");
    setSenha("");
    setCupom("");
    setPapel("vistoriador");
    setConferir(false);
    setErro(undefined);
    setPronto(null);
  }

  if (pronto) {
    const primeiro = pronto.nome.split(" ")[0];
    return (
      <section className="flex flex-col gap-3 rounded-3xl bg-acao-clara p-4">
        <p className="flex items-center gap-2 text-xl font-extrabold text-acao">
          <Check aria-hidden className="size-7" /> {t.cadastrado(primeiro)}
        </p>
        <p className="text-lg font-semibold">{t.cadastradoTexto}</p>
        <p className="rounded-2xl bg-background px-4 py-3 text-lg break-all">
          <span className="block text-base text-muted-foreground">E-mail</span>
          <strong>{pronto.email}</strong>
        </p>
        <BotaoPrincipal
          nativo
          href={whatsappPara(pronto.whatsapp, t.mensagemAcesso(primeiro, oficina, base, pronto.email))}
          icone={<MessageCircle aria-hidden />}
        >
          {t.mandarAcessoPara(primeiro)}
        </BotaoPrincipal>
        <BotaoSecundario
          icone={<UserPlus aria-hidden />}
          onClick={() => {
            recomecar();
            setAberto(true);
          }}
        >
          {t.adicionar}
        </BotaoSecundario>
      </section>
    );
  }

  if (!aberto) {
    return (
      <>
        {avisoPlano && <p className="rounded-2xl bg-acao-clara px-4 py-3 text-base font-bold text-acao">{avisoPlano}</p>}
        <BotaoPrincipal icone={<UserPlus aria-hidden />} onClick={() => setAberto(true)}>
          {t.adicionar}
        </BotaoPrincipal>
      </>
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const erros = {
    nome: conferir && nome.trim().length < 2 ? "Coloque o nome da pessoa" : undefined,
    whatsapp: conferir && !telefoneValido(zap) ? (zap ? textos.erros.telefoneInvalido : textos.erros.telefoneFalta) : undefined,
    email: conferir && !emailOk ? (email ? "E-mail incompleto. Confira." : "Coloque o e-mail") : undefined,
    senha: conferir && senha.length < 6 ? "Pelo menos 6 letras ou números" : undefined,
  };

  async function cadastrar() {
    setConferir(true);
    setErro(undefined);
    if (nome.trim().length < 2 || !telefoneValido(zap) || !emailOk || senha.length < 6) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setCarregando(true);
    const r = await cadastrarUsuario({ nome, whatsapp: zap, email, senha, papel, cupom });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    setPronto({ nome: nome.trim(), email: email.trim().toLowerCase(), whatsapp: zap });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-superficie p-4">
      <h2 className="text-xl font-extrabold">{t.adicionar}</h2>
      <Campo rotulo={t.nome} autoCapitalize="words" autoComplete="off" valor={nome} onValor={setNome} erro={erros.nome} autoFocus />
      <CampoTelefone rotulo={t.whatsapp} valor={zap} onValor={(v) => setZap(formatarTelefone(v))} erro={erros.whatsapp} />
      <Campo
        rotulo={t.email}
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="off"
        valor={email}
        onValor={setEmail}
        erro={erros.email}
      />
      <CampoSenha rotulo={t.senha} dica={t.senhaDica} nova valor={senha} onValor={setSenha} erro={erros.senha} />
      <SeletorGrande
        rotulo={t.papel}
        valor={papel}
        onChange={setPapel}
        opcoes={[
          { valor: "vistoriador", rotulo: t.vistoriador },
          { valor: "gerente", rotulo: t.gerente },
        ]}
        colunas={2}
        compacto
      />
      <p className="-mt-2 text-base font-semibold text-muted-foreground">{papel === "gerente" ? t.gerenteDica : t.vistoriadorDica}</p>
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
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal carregando={carregando} icone={<Check aria-hidden />} onClick={cadastrar}>
        {t.cadastrar}
      </BotaoPrincipal>
    </section>
  );
}
