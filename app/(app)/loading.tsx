import { Carregando } from "@/components/vf";

/** Aparece NA HORA em que a pessoa toca, enquanto a próxima tela carrega (nunca tela parada). */
export default function CarregandoApp() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-6">
      <Carregando linhas={3} />
    </main>
  );
}
