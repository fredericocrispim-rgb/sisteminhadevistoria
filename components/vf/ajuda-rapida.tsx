"use client";

import { CircleHelp, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { textos } from "@/lib/textos";

/**
 * Botão "? Ajuda" de cada etapa: abre uma dica de 1 frase e, se houver, um vídeo curto.
 * O link do vídeo será configurável no /admin.
 */
export function AjudaRapida({ titulo, dica, videoUrl }: { titulo: string; dica: string; videoUrl?: string }) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex min-h-toque shrink-0 items-center gap-1.5 rounded-xl border-[length:var(--borda)] border-input bg-card px-3 text-base font-semibold hover:bg-muted [&_svg]:size-6">
        <CircleHelp aria-hidden />
        {textos.geral.ajuda}
      </DialogTrigger>
      <DialogContent className="gap-4 p-5 sm:max-w-md">
        <DialogTitle className="pr-8 text-xl font-bold">{titulo}</DialogTitle>
        <DialogDescription className="text-lg text-foreground">{dica}</DialogDescription>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-toque items-center justify-center gap-2 rounded-xl bg-oficina px-4 text-lg font-semibold text-oficina-texto [&_svg]:size-6"
          >
            <PlayCircle aria-hidden />
            Ver vídeo (30 s)
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
