"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, CampoSenha, LogoProduto, MensagemErroCampo } from "@/components/vf";
import { textos } from "@/lib/textos";
import { salvarSenhaPeloLink } from "./acoes";

const t = textos.conta;

export function FormCriarSenha({ token }: { token: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [vencido, setVencido] = useState(!token);
  const [carregando, setCarregando] = useState(false);

  async function salvar() {
    setConferir(true);
    setErro(undefined);
    if (senha.length < 6) return;
    setCarregando(true);
    try {
      const r = await salvarSenhaPeloLink(token, senha);
      if (r.ok) {
        router.replace("/inicio");
        router.refresh();
        return;
      }
      setErro(r.erro);
      if (r.vencido) setVencido(true);
    } catch {
      setErro(t.erros.falhou);
    }
    setCarregando(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-10 pb-10">
      <LogoProduto comNome />
      <h1 className="text-[2rem] leading-tight font-extrabold">{t.esqueciTitulo}</h1>
      {vencido ? (
        <div className="flex flex-col gap-4">
          <MensagemErroCampo>{t.linkVencido}</MensagemErroCampo>
          <BotaoSecundario icone={<KeyRound aria-hidden />} onClick={() => router.push("/entrar?esqueci=1")}>
            {t.pedirOutroLink}
          </BotaoSecundario>
        </div>
      ) : (
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            salvar();
          }}
        >
          <CampoSenha
            rotulo={t.novaSenha}
            dica={t.senhaDica}
            nova
            valor={senha}
            onValor={setSenha}
            erro={conferir && senha.length < 6 ? t.erros.senhaCurta : undefined}
          />
          {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
          <BotaoPrincipal type="submit" carregando={carregando} icone={<Save aria-hidden />}>
            {t.salvarSenha}
          </BotaoPrincipal>
        </form>
      )}
    </main>
  );
}
