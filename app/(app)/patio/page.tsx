import type { Metadata } from "next";
import { CarFront } from "lucide-react";
import { EstadoVazio } from "@/components/vf";
import { ListaPatio } from "@/components/vf/lista-patio";
import { exigirOficina } from "@/lib/sessao";
import { listarPatio } from "@/lib/patio";

export const metadata: Metadata = { title: "No pátio" };

export default async function Patio() {
  await exigirOficina();
  const carros = await listarPatio();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      <h1 className="text-[1.75rem] font-extrabold">
        No pátio {carros.length > 0 && <span className="text-muted-foreground">({carros.length})</span>}
      </h1>
      {carros.length ? (
        <>
          <p className="text-lg text-muted-foreground">Toque no carro para fazer a ENTREGA.</p>
          <ListaPatio carros={carros} />
        </>
      ) : (
        <EstadoVazio icone={<CarFront aria-hidden />} titulo="Nenhum carro no pátio" texto="Os carros aparecem aqui depois da vistoria de CHEGADA." />
      )}
    </main>
  );
}
