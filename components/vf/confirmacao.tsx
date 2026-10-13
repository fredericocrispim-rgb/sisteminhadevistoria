"use client";

import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

/**
 * Pede confirmação. Use SÓ para o que não dá para desfazer (concluir, excluir).
 * Para o resto, use avisarComDesfazer.
 */
export function ConfirmacaoImportante({
  aberto,
  onAberto,
  titulo,
  texto,
  textoConfirmar,
  textoCancelar = textos.confirmacao.naoVoltar,
  perigo,
  onConfirmar,
}: {
  aberto: boolean;
  onAberto: (aberto: boolean) => void;
  titulo: string;
  texto: string;
  textoConfirmar: string;
  textoCancelar?: string;
  /** Vermelho (excluir). Sem isso, verde (concluir). */
  perigo?: boolean;
  onConfirmar: () => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={onAberto}>
      <DialogContent showCloseButton={false} className="gap-4 p-5 sm:max-w-md">
        <div className={cn("grid size-14 place-items-center rounded-full", perigo ? "bg-perigo-fundo text-perigo" : "bg-atencao-fundo text-atencao-texto")}>
          <AlertTriangle aria-hidden className="size-8" />
        </div>
        <DialogTitle className="text-2xl font-bold">{titulo}</DialogTitle>
        <DialogDescription className="text-lg text-foreground">{texto}</DialogDescription>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onConfirmar();
              onAberto(false);
            }}
            className={cn(
              "min-h-toque rounded-xl px-4 text-lg font-bold",
              perigo ? "bg-perigo text-white" : "bg-acao text-acao-texto",
            )}
          >
            {textoConfirmar}
          </button>
          <button
            type="button"
            onClick={() => onAberto(false)}
            className="min-h-toque rounded-xl border-[length:var(--borda)] border-input bg-card px-4 text-lg font-semibold"
          >
            {textoCancelar}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Mostra um aviso por 5 segundos com o botão "Desfazer". */
export function avisarComDesfazer(mensagem: string, onDesfazer: () => void) {
  toast(mensagem, {
    duration: 5000,
    action: { label: textos.geral.desfazer, onClick: onDesfazer },
  });
}
