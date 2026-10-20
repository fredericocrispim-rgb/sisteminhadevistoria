"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { BotaoPrincipal, BotaoSecundario, Campo, ConfirmacaoImportante, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { textos } from "@/lib/textos";
import { cancelarConvite, criarConvite, tirarDaEquipe } from "./acoes";

const t = textos.equipe;
const whatsapp = (mensagem: string) => `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const campo = document.createElement("textarea");
    campo.value = texto;
    document.body.appendChild(campo);
    campo.select();
    document.execCommand("copy");
    campo.remove();
  }
}

export function Membro({ id, nome, papel, voce, podeTirar }: { id: string; nome: string; papel: string; voce: boolean; podeTirar: boolean }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-superficie px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-extrabold">
          {nome}
          {voce && <span className="ml-2 rounded-full bg-oficina px-2 py-0.5 text-sm font-bold text-oficina-texto">{t.voce}</span>}
        </p>
        <p className="text-base text-muted-foreground">{papel}</p>
      </div>
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

export function AdicionarPessoa({ oficina, base, avisoPreco }: { oficina: string; base: string; avisoPreco: string | null }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<Papel>("vistoriador");
  const [conferir, setConferir] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState<{ nome: string; link: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  function recomecar() {
    setNome("");
    setPapel("vistoriador");
    setConferir(false);
    setErro(undefined);
    setPronto(null);
    setCopiado(false);
  }

  if (pronto) {
    const mensagem = t.mensagem(pronto.nome.split(" ")[0], oficina, pronto.link);
    return (
      <section className="flex flex-col gap-3 rounded-3xl bg-acao-clara p-4">
        <p className="flex items-center gap-2 text-xl font-extrabold text-acao">
          <Check aria-hidden className="size-7" /> {t.conviteCriado}
        </p>
        <p className="text-lg font-semibold">{t.conviteCriadoTexto}</p>
        <BotaoPrincipal nativo href={whatsapp(mensagem)} icone={<MessageCircle aria-hidden />}>
          {t.enviarWhatsapp}
        </BotaoPrincipal>
        <BotaoSecundario
          icone={copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
          onClick={async () => {
            await copiar(pronto.link);
            setCopiado(true);
          }}
        >
          {copiado ? t.copiado : t.copiarLink}
        </BotaoSecundario>
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
      <BotaoPrincipal fixo icone={<UserPlus aria-hidden />} onClick={() => setAberto(true)}>
        {t.adicionar}
      </BotaoPrincipal>
    );
  }

  const erroNome = conferir && nome.trim().length < 2 ? "Coloque o nome da pessoa" : undefined;

  async function criar() {
    setConferir(true);
    setErro(undefined);
    if (nome.trim().length < 2) return;
    setCarregando(true);
    const r = await criarConvite({ nome, papel });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    setPronto({ nome: nome.trim(), link: `${base}/convite/${r.token}` });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-superficie p-4">
      <h2 className="text-xl font-extrabold">{t.adicionar}</h2>
      <Campo rotulo={t.nome} autoCapitalize="words" autoComplete="off" valor={nome} onValor={setNome} erro={erroNome} autoFocus />
      <SeletorGrande
        rotulo={t.papel}
        valor={papel}
        onChange={setPapel}
        opcoes={[
          { valor: "vistoriador", rotulo: `${t.vistoriador} · ${t.vistoriadorDica}` },
          { valor: "gerente", rotulo: `${t.gerente} · ${t.gerenteDica}` },
        ]}
        colunas={2}
        compacto
      />
      {avisoPreco && <p className="rounded-2xl bg-atencao-clara px-4 py-3 text-base font-bold text-atencao-texto">{avisoPreco}</p>}
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo carregando={carregando} icone={<Check aria-hidden />} onClick={criar}>
        {t.criarConvite}
      </BotaoPrincipal>
    </section>
  );
}
