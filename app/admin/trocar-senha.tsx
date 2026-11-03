"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { trocarSenhaAgora } from "./acoes";

/** Atendimento rápido do administrador: digita o e-mail e a senha nova da pessoa e troca na hora. */
export function TrocarSenha() {
  const [estado, acao, trocando] = useActionState(trocarSenhaAgora, {});

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-superficie p-4">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <KeyRound aria-hidden className="size-6" /> Trocar senha de alguém
      </h2>
      <form action={acao} className="flex flex-col gap-2">
        <input
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="off"
          placeholder="e-mail da pessoa"
          defaultValue={estado.email}
          aria-label="E-mail da pessoa"
          className="min-h-toque rounded-2xl border-2 border-transparent bg-background px-4 text-lg outline-none focus:border-oficina"
        />
        <input
          name="senha"
          type="text"
          autoCapitalize="none"
          autoComplete="off"
          placeholder="senha nova (6 ou mais)"
          aria-label="Senha nova"
          className="min-h-toque rounded-2xl border-2 border-transparent bg-background px-4 text-lg outline-none focus:border-oficina"
        />
        <button type="submit" disabled={trocando} className="tocavel min-h-toque rounded-2xl bg-oficina px-5 text-lg font-bold text-oficina-texto disabled:opacity-60">
          {trocando ? "Trocando…" : "Trocar senha"}
        </button>
      </form>
      {estado.erro && <p className="font-bold text-perigo">{estado.erro}</p>}
      {estado.ok && <p className="font-bold text-acao">{estado.ok}</p>}
    </section>
  );
}
