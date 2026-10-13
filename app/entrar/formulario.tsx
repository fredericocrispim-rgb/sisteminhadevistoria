"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LogIn, Mail } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, Campo, LogoProduto } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { textos } from "@/lib/textos";

const t = textos.entrar;
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

function mensagemDeErro(erro: { status?: number; code?: string } | null): string {
  if (!erro) return t.erros.falhou;
  if (erro.status === 429 || erro.code?.includes("rate_limit")) return t.erros.muitasTentativas;
  if (erro.code === "otp_expired" || erro.status === 403 || erro.status === 401) return t.erros.codigoErrado;
  return t.erros.falhou;
}

export function FormularioEntrar({ destino }: { destino: string }) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  async function enviarCodigo() {
    if (!emailValido(email)) return setErro(t.erros.emailInvalido);
    setErro(undefined);
    setCarregando(true);
    const { error } = await criarClienteNavegador().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setCarregando(false);
    if (error) return setErro(mensagemDeErro(error));
    setCodigo("");
    setEtapa("codigo");
    setEspera(60);
  }

  async function confirmarCodigo() {
    if (codigo.length < 6) return setErro(t.erros.codigoIncompleto);
    setErro(undefined);
    setCarregando(true);
    const { error } = await criarClienteNavegador().auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codigo,
      type: "email",
    });
    if (error) {
      setCarregando(false);
      return setErro(mensagemDeErro(error));
    }
    router.replace(destino);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-10">
      <div className="mb-8">
        <LogoProduto comNome />
      </div>

      {etapa === "email" ? (
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            enviarCodigo();
          }}
        >
          <div>
            <h1 className="text-[2rem] leading-tight font-extrabold">{t.titulo}</h1>
            <p className="mt-1 text-lg text-muted-foreground">{t.subtitulo}</p>
          </div>
          <Campo
            rotulo={t.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nome@email.com"
            valor={email}
            onValor={(v) => {
              setEmail(v);
              setErro(undefined);
            }}
            erro={erro}
            autoFocus
          />
          <BotaoPrincipal type="submit" carregando={carregando} icone={<Mail aria-hidden />}>
            {t.receberCodigo}
          </BotaoPrincipal>
        </form>
      ) : (
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            confirmarCodigo();
          }}
        >
          <div>
            <h1 className="text-[2rem] leading-tight font-extrabold">{t.codigoTitulo}</h1>
            <p className="mt-1 text-lg break-words text-muted-foreground">{t.codigoEnviado(email.trim())}</p>
          </div>
          <Campo
            rotulo={t.codigo}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="000000"
            grande
            valor={codigo}
            onValor={(v) => {
              setCodigo(v.replace(/\D/g, "").slice(0, 8));
              setErro(undefined);
            }}
            erro={erro}
            autoFocus
          />
          <BotaoPrincipal type="submit" carregando={carregando} icone={<LogIn aria-hidden />}>
            {t.entrar}
          </BotaoPrincipal>
          <div className="flex flex-col gap-2">
            <BotaoSecundario icone={<ArrowRight aria-hidden />} disabled={espera > 0 || carregando} onClick={enviarCodigo}>
              {espera > 0 ? t.reenviarEm(espera) : t.reenviar}
            </BotaoSecundario>
            <BotaoSecundario
              icone={<ArrowLeft aria-hidden />}
              className="bg-transparent"
              onClick={() => {
                setEtapa("email");
                setErro(undefined);
              }}
            >
              {t.trocarEmail}
            </BotaoSecundario>
          </div>
        </form>
      )}
    </main>
  );
}
