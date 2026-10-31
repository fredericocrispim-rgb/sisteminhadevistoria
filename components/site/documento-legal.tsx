import type { ReactNode } from "react";
import type { DadosFornecedor } from "@/lib/site";

/**
 * Partes comuns dos Termos de Uso e da Política de Privacidade: seções numeradas, listas e o quadro
 * com os dados da empresa fornecedora (vindos da tabela plataforma).
 */

export function DocumentoLegal({ titulo, versao, vigencia, children }: { titulo: string; versao: string; vigencia: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 text-lg leading-relaxed">
      <header className="flex flex-col gap-1">
        <h1 className="text-[1.75rem] font-extrabold leading-tight">{titulo}</h1>
        <p className="text-base text-muted-foreground">
          Versão {versao} · em vigor desde {vigencia}
        </p>
      </header>
      {children}
    </main>
  );
}

export function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`secao-${numero}`}>
      <h2 id={`secao-${numero}`} className="text-xl font-extrabold">
        {numero}. {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-6">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function QuadroFornecedor({ dados }: { dados: DadosFornecedor }) {
  const linhas: [string, string | null][] = [
    ["Empresa", dados.razaoSocial],
    ["CNPJ", dados.cnpj],
    ["Endereço", dados.endereco],
    ["Responsável", dados.responsavel],
    ["E-mail", dados.email],
    ["WhatsApp do suporte", dados.whatsapp],
  ];
  return (
    <dl className="grid gap-x-4 gap-y-2 rounded-2xl bg-superficie p-4 text-base sm:grid-cols-[auto_1fr]">
      {linhas
        .filter(([, valor]) => valor)
        .map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt className="font-bold">{rotulo}</dt>
            <dd className="mb-2 break-words sm:mb-0">{valor}</dd>
          </div>
        ))}
    </dl>
  );
}
