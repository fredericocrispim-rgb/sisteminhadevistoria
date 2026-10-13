"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, LogIn, MessageCircle, UserPlus } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, Campo, CampoSenha, LogoProduto, MensagemErroCampo } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { telefoneParaWhatsapp } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import { criarConta } from "./acoes";

const t = textos.conta;
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

type Modo = "entrar" | "criar" | "esqueci";

function traduzirErro(erro: { status?: number; code?: string; message?: string }): string {
  const c = erro.code ?? "";
  const m = (erro.message ?? "").toLowerCase();
  if (c === "invalid_credentials" || m.includes("invalid login")) return t.erros.senhaErrada;
  if (erro.status === 429 || c.includes("rate_limit")) return t.erros.muitasTentativas;
  return t.erros.falhou;
}

/**
 * Entrar com e-mail e senha. Nada de e-mail enviado:
 * criar conta é feito no servidor (já confirmada); esqueci a senha = falar com o suporte no WhatsApp.
 */
export function FormularioEntrar({
  destino,
  modoInicial,
  aviso,
  whatsappSuporte,
}: {
  destino: string;
  modoInicial: "entrar" | "criar";
  aviso?: string;
  whatsappSuporte: string | null;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [info, setInfo] = useState<string | undefined>(aviso);
  const [carregando, setCarregando] = useState(false);

  const emailLimpo = email.trim().toLowerCase();
  const erroEmail = conferir && !emailValido(email) ? t.erros.emailInvalido : undefined;
  const erroSenha = conferir && senha.length < 6 ? t.erros.senhaCurta : undefined;

  function trocar(m: Modo) {
    setModo(m);
    setErro(undefined);
    setInfo(undefined);
    setConferir(false);
  }

  async function entrarComSenha() {
    const { error } = await criarClienteNavegador().auth.signInWithPassword({ email: emailLimpo, password: senha });
    if (error) {
      setCarregando(false);
      setErro(traduzirErro(error));
      return false;
    }
    router.replace(destino);
    router.refresh();
    return true;
  }

  async function enviar() {
    setConferir(true);
    setErro(undefined);
    setInfo(undefined);
    if (!emailValido(email) || senha.length < 6) return;
    setCarregando(true);
    if (modo === "criar") {
      const r = await criarConta({ email: emailLimpo, senha });
      if (!r.ok) {
        setCarregando(false);
        return setErro(r.erro);
      }
    }
    await entrarComSenha();
  }

  const cabecalho = (
    <div className="mb-8">
      <LogoProduto comNome />
    </div>
  );

  if (modo === "esqueci") {
    const mensagem = `Olá! Esqueci minha senha do ${textos.produto.nome}. Meu e-mail é: ${emailLimpo || "(digite aqui)"}`;
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-10 pb-10">
        {cabecalho}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <KeyRound aria-hidden className="size-10 text-oficina" />
            <h1 className="text-[2rem] leading-tight font-extrabold">{t.esqueciTitulo}</h1>
          </div>
          <p className="text-xl text-muted-foreground">Fale com o suporte. Mandamos um link para você criar uma senha nova.</p>
          {whatsappSuporte ? (
            <a
              href={`https://wa.me/${telefoneParaWhatsapp(whatsappSuporte)}?text=${encodeURIComponent(mensagem)}`}
              target="_blank"
              rel="noreferrer"
              className="tocavel inline-flex min-h-toque-grande items-center justify-center gap-3 rounded-2xl bg-[#1f8f4e] px-5 text-xl font-bold text-white [&_svg]:size-7"
            >
              <MessageCircle aria-hidden /> Falar no WhatsApp
            </a>
          ) : (
            <p className="rounded-2xl bg-superficie px-4 py-3 text-lg">Peça ao responsável pelo sistema um link de senha nova.</p>
          )}
          <BotaoSecundario icone={<ArrowLeft aria-hidden />} onClick={() => trocar("entrar")}>
            {t.voltarEntrar}
          </BotaoSecundario>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-10 pb-10">
      {cabecalho}
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <h1 className="text-[2rem] leading-tight font-extrabold">{modo === "entrar" ? t.entrarTitulo : t.criarTitulo}</h1>

        {info && (
          <p className="flex items-center gap-2 rounded-2xl bg-acao-clara px-4 py-3 text-lg font-bold text-acao">
            <CheckCircle2 aria-hidden className="size-6 shrink-0" /> {info}
          </p>
        )}

        <Campo
          rotulo={t.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nome@email.com"
          valor={email}
          onValor={setEmail}
          erro={erroEmail}
        />
        <CampoSenha
          rotulo={modo === "criar" ? t.novaSenha : t.senha}
          dica={modo === "criar" ? t.senhaDica : undefined}
          nova={modo === "criar"}
          valor={senha}
          onValor={setSenha}
          erro={erroSenha}
        />

        {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}

        <BotaoPrincipal type="submit" carregando={carregando} icone={modo === "entrar" ? <LogIn aria-hidden /> : <UserPlus aria-hidden />}>
          {modo === "entrar" ? t.entrar : t.criar}
        </BotaoPrincipal>

        <div className="flex flex-col gap-2">
          {modo === "entrar" ? (
            <>
              <BotaoSecundario icone={<UserPlus aria-hidden />} onClick={() => trocar("criar")}>
                {t.naoTenhoConta}
              </BotaoSecundario>
              <BotaoSecundario className="bg-transparent text-muted-foreground" onClick={() => trocar("esqueci")}>
                {t.esqueci}
              </BotaoSecundario>
            </>
          ) : (
            <BotaoSecundario icone={<LogIn aria-hidden />} onClick={() => trocar("entrar")}>
              {t.jaTenhoConta}
            </BotaoSecundario>
          )}
        </div>
      </form>
    </main>
  );
}
