import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso" };

// TEXTO PROVISÓRIO — precisa ser revisado por advogado antes de cobrar (Prompt 23 do guia).
export default function Termos() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 text-lg">
      <h1 className="text-[1.75rem] font-extrabold">Termos de Uso</h1>
      <p className="rounded-2xl bg-atencao-clara px-4 py-3 font-semibold text-atencao-texto">Versão provisória (teste). Será revisada.</p>
      <p>O VistoriaFácil é um sistema para oficinas registrarem a vistoria de veículos com fotos, assinatura e envio ao cliente.</p>
      <p>A oficina é responsável pelos dados que cadastra e pelas vistorias que faz. As vistorias concluídas não podem ser alteradas; correções ficam registradas como observação extra (adendo).</p>
      <p>A assinatura feita na tela, junto com data, hora, localização e aparelho, é aceita pelas partes como forma de comprovar a vistoria.</p>
      <p>Durante o período de teste o uso é grátis. Depois, a mensalidade é paga por Pix. Sem pagamento, novas vistorias ficam bloqueadas, mas as antigas continuam disponíveis para consulta.</p>
    </main>
  );
}
