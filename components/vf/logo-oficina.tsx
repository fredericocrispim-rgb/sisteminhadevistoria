/* eslint-disable @next/next/no-img-element -- logo vem do Storage do Supabase */
import { cn } from "@/lib/utils";
import { iniciais } from "@/lib/cores";

/** Logo da oficina. Sem logo, mostra as iniciais (monograma) no azul do Sisteminha. */
export function LogoOficina({
  nome,
  url,
  tamanho = "md",
  className,
}: {
  nome: string;
  url?: string | null;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const medida = { sm: "size-10 text-base rounded-xl", md: "size-12 text-xl rounded-2xl", lg: "size-24 text-4xl rounded-3xl" }[tamanho];
  if (url) {
    return <img src={url} alt={`Logo ${nome}`} className={cn(medida, "shrink-0 bg-white object-contain", className)} />;
  }
  return (
    <div
      aria-label={`Logo ${nome}`}
      role="img"
      className={cn(medida, "grid shrink-0 place-items-center bg-oficina font-extrabold text-oficina-texto", className)}
    >
      {iniciais(nome)}
    </div>
  );
}
