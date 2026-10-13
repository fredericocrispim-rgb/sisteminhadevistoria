"use client";

import { useRef, useState } from "react";
import { BadgeCheck, FileSearch, XCircle } from "lucide-react";
import { BotaoSecundario } from "@/components/vf";

/**
 * Confere se o PDF que a pessoa tem é o ORIGINAL: calcula a "impressão digital" (SHA-256)
 * do arquivo aqui no aparelho (o arquivo não é enviado a lugar nenhum) e compara.
 */
export function CompararPdf({ hashEsperado }: { hashEsperado: string }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [resultado, setResultado] = useState<"igual" | "diferente" | null>(null);

  async function conferir(arquivo?: File) {
    if (!arquivo) return;
    const digest = await crypto.subtle.digest("SHA-256", await arquivo.arrayBuffer());
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setResultado(hash === hashEsperado ? "igual" : "diferente");
  }

  return (
    <section className="flex flex-col gap-3">
      <input ref={entrada} type="file" accept="application/pdf" className="hidden" onChange={(e) => conferir(e.target.files?.[0])} />
      <BotaoSecundario icone={<FileSearch aria-hidden />} onClick={() => entrada.current?.click()}>
        Conferir o arquivo PDF
      </BotaoSecundario>
      {resultado === "igual" && (
        <p className="flex items-center gap-2 rounded-2xl bg-acao-clara px-4 py-3 text-lg font-bold text-acao">
          <BadgeCheck aria-hidden className="size-7 shrink-0" /> O PDF é o original, sem alterações.
        </p>
      )}
      {resultado === "diferente" && (
        <p className="flex items-center gap-2 rounded-2xl bg-perigo-clara px-4 py-3 text-lg font-bold text-perigo">
          <XCircle aria-hidden className="size-7 shrink-0" /> Este PDF não corresponde ao original.
        </p>
      )}
      <p className="text-sm break-all text-muted-foreground">Impressão digital (SHA-256): {hashEsperado}</p>
    </section>
  );
}
