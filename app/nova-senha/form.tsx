"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { BotaoPrincipal, CampoSenha, LogoProduto, MensagemErroCampo } from "@/components/vf";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { textos } from "@/lib/textos";

const t = textos.conta;

export function FormNovaSenha({ email }: { email: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function salvar() {
    setConferir(true);
    if (senha.length < 6) return;
    setCarregando(true);
    const { error } = await criarClienteNavegador().auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) return setErro(error.code === "same_password" ? "Use uma senha diferente da antiga" : t.erros.falhou);
    router.replace("/inicio");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-10">
      <LogoProduto comNome />
      <div>
        <h1 className="text-[2rem] leading-tight font-extrabold">{t.esqueciTitulo}</h1>
        <p className="mt-1 text-lg break-words text-muted-foreground">{email}</p>
      </div>
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
    </main>
  );
}
