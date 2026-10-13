import { Hammer } from "lucide-react";
import { BotaoSecundario, EstadoVazio } from "@/components/vf";

/** Tela provisória para as partes que ainda vamos construir. */
export function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4">
      <EstadoVazio
        icone={<Hammer aria-hidden />}
        titulo={titulo}
        texto={texto}
        acao={<BotaoSecundario href="/inicio">Voltar ao início</BotaoSecundario>}
      />
    </main>
  );
}
