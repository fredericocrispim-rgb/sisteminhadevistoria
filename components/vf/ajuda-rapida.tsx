"use client";

import { CircleHelp, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { textos } from "@/lib/textos";

/**
 * Botão "Ajuda" de cada etapa: abre uma dica de 1 frase e, se houver, um vídeo curto.
 * O link do vídeo será configurável no /admin.
 */
export function AjudaRapida({ titulo, dica, videoUrl }: { titulo: string; dica: string; videoUrl?: string }) {
  return (
    <Dialog>
      <DialogTrigger className="tocavel inline-flex min-h-toque shrink-0 items-center gap-1.5 rounded-2xl px-3 text-lg font-bold text-oficina [&_svg]:size-7">
        <CircleHelp aria-hidden />
        {textos.geral.ajuda}
      </DialogTrigger>
      <DialogContent className="gap-4 rounded-3xl p-6 sm:max-w-md">
        <DialogTitle className="pr-8 text-2xl font-extrabold">{titulo}</DialogTitle>
        <DialogDescription className="text-xl text-foreground">{dica}</DialogDescription>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="tocavel inline-flex min-h-toque-grande items-center justify-center gap-2 rounded-2xl bg-oficina px-4 text-xl font-bold text-oficina-texto [&_svg]:size-7"
          >
            <PlayCircle aria-hidden />
            {textos.geral.verVideo}
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
