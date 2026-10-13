"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CloudOff, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

/** Tela/lista vazia que ensina o próximo passo. */
export function EstadoVazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-[length:var(--borda)] border-dashed border-input bg-card px-6 py-10 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-10">
        {icone ?? <Inbox aria-hidden />}
      </div>
      <p className="text-xl font-bold">{titulo}</p>
      {texto && <p className="max-w-sm text-lg text-muted-foreground">{texto}</p>}
      {acao && <div className="mt-2 w-full max-w-sm">{acao}</div>}
    </div>
  );
}

function assinarConexao(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** true quando o aparelho está sem internet. */
export function useSemInternet() {
  return useSyncExternalStore(
    assinarConexao,
    () => !navigator.onLine,
    () => false,
  );
}

/**
 * Faixa amarela que aparece sozinha quando a internet cai.
 * `pendentes`: quantas fotos estão esperando para enviar. `forcar`: só para a página /estilo.
 */
export function AvisoSemInternet({ pendentes = 0, forcar }: { pendentes?: number; forcar?: boolean }) {
  const semInternet = useSemInternet();
  if (!semInternet && !forcar && pendentes === 0) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border-[length:var(--borda)] border-atencao bg-atencao-fundo px-4 py-3 text-base font-semibold text-atencao-texto"
    >
      <CloudOff aria-hidden className="mt-0.5 size-6 shrink-0" />
      <div className="flex flex-col gap-0.5">
        {(semInternet || forcar) && <span>{textos.avisos.semInternet}</span>}
        {pendentes > 0 && <span>{textos.avisos.aguardandoEnvio(pendentes)}</span>}
      </div>
    </div>
  );
}

/** Esqueleto de carregamento. Nunca tela branca. */
export function Carregando({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{textos.geral.carregando}</span>
      <div className="h-36 animate-pulse rounded-xl bg-muted" />
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}
