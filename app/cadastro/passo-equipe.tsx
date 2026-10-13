"use client";

import { useState } from "react";
import { ArrowRight, MessageCircle, UserPlus } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, Campo, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { textos } from "@/lib/textos";
import { criarConvite } from "./acoes";
import type { EmpresaCadastro } from "./assistente";

const t = textos.cadastro.equipe;
type Papel = "vistoriador" | "gerente";

export function PassoEquipe({ empresa, aoTerminar }: { empresa: EmpresaCadastro; aoTerminar: () => void }) {
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<Papel>("vistoriador");
  const [convites, setConvites] = useState<{ nome: string; papel: Papel; link: string }[]>([]);
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function convidar() {
    if (nome.trim().length < 2) return setErro("Coloque o nome da pessoa");
    setErro(undefined);
    setCarregando(true);
    const r = await criarConvite({ nome, papel });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    setConvites((c) => [{ nome: nome.trim(), papel, link: r.link }, ...c]);
    setNome("");
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg text-muted-foreground">{t.explicacao}</p>

      {convites.map((c) => (
        <div key={c.link} className="flex flex-col gap-2 rounded-2xl bg-acao-clara p-4">
          <p className="text-lg font-bold">
            {c.nome} <span className="font-semibold text-muted-foreground">· {c.papel === "gerente" ? t.gerente : t.vistoriador}</span>
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(t.mensagem(c.nome, empresa.nome, c.link))}`}
            target="_blank"
            rel="noreferrer"
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-4 text-lg font-bold text-white [&_svg]:size-6"
          >
            <MessageCircle aria-hidden /> {t.enviarWhatsapp}
          </a>
        </div>
      ))}

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          convidar();
        }}
      >
        <Campo rotulo={t.nome} autoCapitalize="words" valor={nome} onValor={setNome} />
        <SeletorGrande
          rotulo={t.papel}
          valor={papel}
          onChange={setPapel}
          colunas={2}
          compacto
          opcoes={[
            { valor: "vistoriador", rotulo: t.vistoriador },
            { valor: "gerente", rotulo: t.gerente },
          ]}
        />
        <p className="-mt-3 text-base text-muted-foreground">{papel === "gerente" ? t.gerenteDica : t.vistoriadorDica}</p>
        {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
        <BotaoSecundario type="submit" carregando={carregando} icone={<UserPlus aria-hidden />}>
          {t.criarConvite}
        </BotaoSecundario>
      </form>

      <BotaoPrincipal fixo icone={<ArrowRight aria-hidden />} onClick={aoTerminar}>
        {convites.length ? textos.cadastro.continuar : t.pular}
      </BotaoPrincipal>
    </div>
  );
}
