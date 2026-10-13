import { ClipboardCheck, Palette } from "lucide-react";
import { BotaoSecundario } from "@/components/vf";
import { textos } from "@/lib/textos";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="grid size-14 place-items-center rounded-2xl bg-oficina text-oficina-texto">
          <ClipboardCheck aria-hidden className="size-8" />
        </div>
        <h1 className="text-3xl font-bold">{textos.produto.nome}</h1>
      </div>
      <p className="text-xl text-muted-foreground">{textos.produto.slogan}</p>
      <p className="rounded-xl bg-atencao-fundo px-4 py-3 text-base font-semibold text-atencao-texto">
        Sistema em construção. Por enquanto, veja o padrão visual das telas.
      </p>
      <BotaoSecundario href="/estilo" icone={<Palette aria-hidden />}>
        Ver o padrão visual
      </BotaoSecundario>
    </main>
  );
}
