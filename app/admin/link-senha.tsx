"use client";

import { useActionState, useState } from "react";
import { Copy, KeyRound, MessageCircle } from "lucide-react";
import { gerarLinkSenha } from "./acoes";

/** Ferramenta do administrador: link de senha nova para quem esqueceu (sem mandar e-mail). */
export function LinkSenha() {
  const [estado, acao, gerando] = useActionState(gerarLinkSenha, {});
  const [copiado, setCopiado] = useState(false);
  const mensagem = estado.link
    ? `Olá! Toque neste link para criar sua senha nova no Vistoria Rápida (vale por 1 hora, só uma vez): ${estado.link}`
    : "";

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-superficie p-4">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <KeyRound aria-hidden className="size-6" /> Senha nova para alguém
      </h2>
      <p className="text-base text-muted-foreground">Quem esqueceu a senha fala com você no WhatsApp. Gere o link aqui e mande para a pessoa.</p>
      <form action={acao} className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="e-mail da pessoa"
          defaultValue={estado.email}
          aria-label="E-mail da pessoa"
          className="min-h-toque flex-1 rounded-2xl border-2 border-transparent bg-background px-4 text-lg outline-none focus:border-oficina"
        />
        <button type="submit" disabled={gerando} className="tocavel min-h-toque rounded-2xl bg-oficina px-5 text-lg font-bold text-oficina-texto disabled:opacity-60">
          {gerando ? "Gerando…" : "Gerar link"}
        </button>
      </form>
      {estado.erro && <p className="font-bold text-perigo">{estado.erro}</p>}
      {estado.link && (
        <div className="flex flex-col gap-2">
          <p className="text-sm break-all text-muted-foreground">{estado.link}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(mensagem);
                setCopiado(true);
              }}
              className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-background px-3 text-base font-bold"
            >
              <Copy aria-hidden className="size-5" /> {copiado ? "Copiado!" : "Copiar"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
              target="_blank"
              rel="noreferrer"
              className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-3 text-base font-bold text-white"
            >
              <MessageCircle aria-hidden className="size-5" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
