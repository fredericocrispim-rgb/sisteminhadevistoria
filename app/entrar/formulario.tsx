"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LogIn, Mail, MailCheck, UserPlus } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, Campo, CampoSenha, LogoProduto, MensagemErroCampo } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { textos } from "@/lib/textos";

const t = textos.conta;
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

type Modo = "entrar" | "criar" | "esqueci" | "confirme" | "linkEnviado";

function traduzirErro(erro: { status?: number; code?: string; message?: string }): string {
  const c = erro.code ?? "";
  const m = (erro.message ?? "").toLowerCase();
  if (erro.status === 429 || c.includes("rate_limit")) return t.erros.muitasTentativas;
  if (c === "invalid_credentials" || m.includes("invalid login")) return t.erros.senhaErrada;
  if (c === "email_not_confirmed" || m.includes("not confirmed")) return t.erros.naoConfirmado;
  if (c === "user_already_exists" || m.includes("already registered")) return t.erros.jaExiste;
  if (c === "weak_password" || m.includes("password should")) return t.erros.senhaCurta;
  return t.erros.falhou;
}

export function FormularioEntrar({ destino, modoInicial, aviso }: { destino: string; modoInicial: "entrar" | "criar"; aviso?: string }) {
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
  const erroSenha = conferir && modo !== "esqueci" && senha.length < 6 ? t.erros.senhaCurta : undefined;
  const linkVolta = (para: string) => `${window.location.origin}/auth/confirmar?voltar=${encodeURIComponent(para)}`;

  function trocar(m: Modo) {
    setModo(m);
    setErro(undefined);
    setInfo(undefined);
    setConferir(false);
  }

  async function enviar() {
    setConferir(true);
    setErro(undefined);
    setInfo(undefined);
    if (!emailValido(email) || (modo !== "esqueci" && senha.length < 6)) return;
    setCarregando(true);
    const supabase = criarClienteNavegador();

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha });
      if (error) {
        setCarregando(false);
        return setErro(traduzirErro(error));
      }
      router.replace(destino);
      router.refresh();
      return;
    }

    if (modo === "criar") {
      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: { emailRedirectTo: linkVolta(destino) },
      });
      setCarregando(false);
      if (error) return setErro(traduzirErro(error));
      // E-mail que já tinha conta: o Supabase devolve um usuário "vazio"
      if (data.user && data.user.identities?.length === 0) return setErro(t.erros.jaExiste);
      if (data.session) {
        // Confirmação de e-mail desligada: já entra direto
        router.replace(destino);
        router.refresh();
        return;
      }
      return setModo("confirme");
    }

    if (modo === "esqueci") {
      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, { redirectTo: linkVolta("/nova-senha") });
      setCarregando(false);
      if (error) return setErro(traduzirErro(error));
      return setModo("linkEnviado");
    }
  }

  async function reenviarConfirmacao() {
    setCarregando(true);
    setErro(undefined);
    const { error } = await criarClienteNavegador().auth.resend({
      type: "signup",
      email: emailLimpo,
      options: { emailRedirectTo: linkVolta(destino) },
    });
    setCarregando(false);
    if (error) return setErro(traduzirErro(error));
    setInfo(t.reenviado);
  }

  const cabecalho = (
    <div className="mb-8">
      <LogoProduto comNome />
    </div>
  );

  // Telas de "olhe seu e-mail"
  if (modo === "confirme" || modo === "linkEnviado") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-10">
        {cabecalho}
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck aria-hidden className="size-20 text-oficina" />
          <h1 className="text-[2rem] leading-tight font-extrabold">{modo === "confirme" ? t.confirmeTitulo : t.linkEnviadoTitulo}</h1>
          <p className="text-xl break-words text-muted-foreground">
            {modo === "confirme" ? t.confirmeTexto(emailLimpo) : t.linkEnviadoTexto(emailLimpo)}
          </p>
          {info && <p className="font-bold text-acao">{info}</p>}
          {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
          {modo === "confirme" && (
            <BotaoSecundario icone={<Mail aria-hidden />} carregando={carregando} onClick={reenviarConfirmacao}>
              {t.reenviar}
            </BotaoSecundario>
          )}
          <BotaoSecundario icone={<ArrowLeft aria-hidden />} className="bg-transparent" onClick={() => trocar("entrar")}>
            {t.voltarEntrar}
          </BotaoSecundario>
        </div>
      </main>
    );
  }

  const titulo = modo === "entrar" ? t.entrarTitulo : modo === "criar" ? t.criarTitulo : t.esqueciTitulo;

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
        <div>
          <h1 className="text-[2rem] leading-tight font-extrabold">{titulo}</h1>
          {modo === "esqueci" && <p className="mt-1 text-lg text-muted-foreground">{t.esqueciTexto}</p>}
        </div>

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

        {modo !== "esqueci" && (
          <CampoSenha
            rotulo={modo === "criar" ? t.novaSenha : t.senha}
            dica={modo === "criar" ? t.senhaDica : undefined}
            nova={modo === "criar"}
            valor={senha}
            onValor={setSenha}
            erro={erroSenha}
          />
        )}

        {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}

        <BotaoPrincipal
          type="submit"
          carregando={carregando}
          icone={modo === "entrar" ? <LogIn aria-hidden /> : modo === "criar" ? <UserPlus aria-hidden /> : <Mail aria-hidden />}
        >
          {modo === "entrar" ? t.entrar : modo === "criar" ? t.criar : t.mandarLink}
        </BotaoPrincipal>

        <div className="flex flex-col gap-2">
          {modo === "entrar" && (
            <>
              <BotaoSecundario icone={<UserPlus aria-hidden />} onClick={() => trocar("criar")}>
                {t.naoTenhoConta}
              </BotaoSecundario>
              <BotaoSecundario className="bg-transparent text-muted-foreground" onClick={() => trocar("esqueci")}>
                {t.esqueci}
              </BotaoSecundario>
            </>
          )}
          {modo === "criar" && (
            <BotaoSecundario icone={<LogIn aria-hidden />} onClick={() => trocar("entrar")}>
              {t.jaTenhoConta}
            </BotaoSecundario>
          )}
          {modo === "esqueci" && (
            <BotaoSecundario icone={<ArrowLeft aria-hidden />} onClick={() => trocar("entrar")}>
              {t.voltarEntrar}
            </BotaoSecundario>
          )}
        </div>
      </form>
    </main>
  );
}
