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
      <DialogContent showCloseButton={false} className="gap-4 rounded-3xl p-6 sm:max-w-md">
        <div className={cn("icone-chip grid size-16 place-items-center rounded-[1.25rem]", perigo ? "bg-perigo-clara text-perigo" : "bg-atencao-clara text-atencao-texto")}>
          <AlertTriangle aria-hidden className="size-9" />
        </div>
        <DialogTitle className="text-2xl font-extrabold">{titulo}</DialogTitle>
        <DialogDescription className="text-xl text-foreground">{texto}</DialogDescription>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onConfirmar();
              onAberto(false);
            }}
            className={cn(
              "tocavel min-h-toque-grande rounded-2xl px-4 text-xl font-bold",
              perigo ? "brilho bg-perigo text-white shadow-[0_14px_28px_-12px_rgb(200_30_30/0.7)]" : "brilho bg-acao text-acao-texto shadow-[0_14px_28px_-12px_rgb(19_134_90/0.75)]",
            )}
          >
            {textoConfirmar}
          </button>
          <button type="button" onClick={() => onAberto(false)} className="tocavel cartao min-h-toque rounded-2xl px-4 text-lg font-bold">
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
