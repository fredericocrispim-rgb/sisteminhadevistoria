import { Video } from "lucide-react";
import { formatarDuracao } from "@/lib/formatos";
import { textos } from "@/lib/textos";

/**
 * Vídeo da vistoria para assistir (página do cliente e página de verificar).
 * preload="none": só baixa quando a pessoa toca em assistir (a página abre rápido).
 */
export function VideoVistoria({ src, tipo, duracao, apagado }: { src: string | null; tipo: string; duracao: number | null; apagado: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <Video aria-hidden className="size-6" /> {textos.video.titulo}
        {duracao != null && <span className="text-base font-bold text-muted-foreground">· {formatarDuracao(duracao)}</span>}
      </h2>
      {apagado || !src ? (
        <p className="rounded-2xl bg-superficie px-4 py-3 text-base text-muted-foreground">{textos.video.apagado}</p>
      ) : (
        <video controls playsInline preload="none" className="aspect-video w-full rounded-2xl bg-black">
          <source src={src} type={tipo} />
        </video>
      )}
    </section>
  );
}
