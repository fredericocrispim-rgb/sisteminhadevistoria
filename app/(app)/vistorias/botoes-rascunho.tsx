"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, X } from "lucide-react";
import { avisarComDesfazer } from "@/components/vf";
import { textos } from "@/lib/textos";
import { cancelarVistoria, restaurarVistoria } from "./acoes";

/** Vistoria não concluída: continuar de onde parou ou cancelar (com "Desfazer" por 5 segundos). */
export function BotoesRascunho({ id }: { id: string }) {
  const router = useRouter();
  const [rodando, iniciar] = useTransition();

  const cancelar = () =>
    iniciar(async () => {
      const r = await cancelarVistoria(id);
      if (!r.ok) {
        toast.error(textos.vistoria.naoDeuCancelar);
        return;
      }
      router.refresh();
      avisarComDesfazer(textos.vistoria.cancelada, async () => {
        const volta = await restaurarVistoria(id);
        if (volta.ok) router.refresh();
        else toast.error(volta.erro);
      });
    });

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={cancelar}
        disabled={rodando}
        className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-background px-3 text-lg font-bold text-muted-foreground disabled:opacity-60"
      >
        <X aria-hidden className="size-6" /> {textos.vistoria.cancelar}
      </button>
      <Link
        href={`/vistorias/${id}`}
        className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-atencao-clara px-3 text-lg font-bold text-atencao-texto"
      >
        {textos.vistoria.continuar} <ArrowRight aria-hidden className="size-6" />
      </Link>
    </div>
  );
}
