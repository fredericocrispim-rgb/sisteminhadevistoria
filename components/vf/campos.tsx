"use client";

import { useId, type ComponentProps } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { formatarKm, formatarPlaca, formatarTelefone } from "@/lib/formatos";

/** Mensagem de erro no próprio campo, dizendo o que fazer. Nunca mensagem técnica. */
export function MensagemErroCampo({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-perigo-fundo px-3 py-2 text-base font-semibold text-perigo"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

type CampoBaseProps = {
  rotulo: string;
  dica?: string;
  erro?: string;
  valor: string;
  onValor: (valor: string) => void;
  grande?: boolean;
} & Omit<ComponentProps<"input">, "value" | "onChange" | "id">;

/** Campo de texto padrão: rótulo grande em cima, dica embaixo, erro no próprio campo. */
export function Campo({ rotulo, dica, erro, valor, onValor, grande, className, ...props }: CampoBaseProps) {
  const id = useId();
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-lg font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        value={valor}
        onChange={(e) => onValor(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={cn(dica && idDica, erro && idErro) || undefined}
        className={cn(
          "min-h-toque w-full rounded-xl border-[length:var(--borda)] border-input bg-card px-4 text-lg outline-none",
          "placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/30",
          grande && "py-3 text-center font-mono text-3xl font-bold tracking-widest placeholder:font-normal placeholder:text-muted-foreground/35",
          erro && "border-2 border-perigo focus:border-perigo focus:ring-perigo/30",
          className,
        )}
        {...props}
      />
      {dica && !erro && (
        <p id={idDica} className="text-base text-muted-foreground">
          {dica}
        </p>
      )}
      {erro && <MensagemErroCampo id={idErro}>{erro}</MensagemErroCampo>}
    </div>
  );
}

type CampoEspecifico = Omit<CampoBaseProps, "rotulo"> & { rotulo?: string };

/** Placa: teclado de letras maiúsculas, aceita antiga (ABC-1234) e Mercosul (ABC1D23). */
export function CampoPlaca({ rotulo = textos.campos.placa, dica = textos.campos.placaDica, onValor, ...props }: CampoEspecifico) {
  return (
    <Campo
      rotulo={rotulo}
      dica={dica}
      grande
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      maxLength={8}
      placeholder="ABC1D23"
      onValor={(v) => onValor(formatarPlaca(v))}
      {...props}
    />
  );
}

/** Telefone/WhatsApp: teclado de telefone, formata (11) 98765-4321. */
export function CampoTelefone({ rotulo = textos.campos.telefone, dica = textos.campos.telefoneDica, onValor, ...props }: CampoEspecifico) {
  return (
    <Campo
      rotulo={rotulo}
      dica={dica}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(11) 98765-4321"
      onValor={(v) => onValor(formatarTelefone(v))}
      {...props}
    />
  );
}

/** Km: teclado numérico, formata 45.320. */
export function CampoKm({ rotulo = textos.campos.km, dica = textos.campos.kmDica, onValor, ...props }: CampoEspecifico) {
  return (
    <Campo
      rotulo={rotulo}
      dica={dica}
      inputMode="numeric"
      pattern="[0-9.]*"
      autoComplete="off"
      placeholder="0"
      onValor={(v) => onValor(formatarKm(v))}
      {...props}
    />
  );
}
