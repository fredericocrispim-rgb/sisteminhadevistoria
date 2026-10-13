import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { BotaoPrincipal, LogoProduto } from "@/components/vf";

export const metadata: Metadata = { title: "Verificar vistoria" };

async function ir(formData: FormData) {
  "use server";
  const codigo = String(formData.get("codigo") ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (codigo.length === 10) redirect(`/verificar/${codigo.slice(0, 2)}-${codigo.slice(2, 6)}-${codigo.slice(6)}`);
  redirect("/verificar?erro=1");
}

export default async function Verificar({ searchParams }: PageProps<"/verificar">) {
  const { erro } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-10">
      <LogoProduto comNome />
      <div className="flex items-center gap-3">
        <ShieldCheck aria-hidden className="size-10 text-oficina" />
        <h1 className="text-[1.75rem] leading-tight font-extrabold">Conferir uma vistoria</h1>
      </div>
      <p className="text-lg text-muted-foreground">Digite o código que aparece no termo (ex.: SV-7K3P-9Q2X).</p>
      <form action={ir} className="flex flex-col gap-4">
        <label htmlFor="codigo" className="text-lg font-bold">
          Código
        </label>
        <input
          id="codigo"
          name="codigo"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="SV-XXXX-XXXX"
          className="min-h-toque-grande rounded-2xl border-2 border-transparent bg-superficie px-4 text-center font-mono text-2xl font-bold tracking-widest uppercase outline-none focus:border-oficina"
        />
        {erro && <p className="font-bold text-perigo">Código incompleto. Confira.</p>}
        <BotaoPrincipal type="submit" icone={<ShieldCheck aria-hidden />}>
          Conferir
        </BotaoPrincipal>
      </form>
    </main>
  );
}
