"use client";

import { useId, type ComponentProps } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { formatarKm, formatarPlaca, formatarTelefone } from "@/lib/formatos";

/** Mensagem de erro no próprio campo, dizendo o que fazer. Nunca mensagem técnica. */
export function MensagemErroCampo({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-2 text-base font-bold text-perigo">
      <AlertCircle aria-hidden className="size-5 shrink-0" />
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

/** Campo de texto padrão: rótulo em cima, fundo cinza claro, erro logo embaixo. */
export function Campo({ rotulo, dica, erro, valor, onValor, grande, className, ...props }: CampoBaseProps) {
  const id = useId();
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-bold">
        {rotulo}
      </label>
      <input
        id={id}
        value={valor}
        onChange={(e) => onValor(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={cn(dica && idDica, erro && idErro) || undefined}
        className={cn(
          "min-h-toque-grande w-full rounded-2xl border-2 border-transparent bg-superficie px-4 text-xl font-semibold outline-none",
          "placeholder:font-normal placeholder:text-muted-foreground/50 focus:border-oficina focus:bg-background focus:shadow-[0_0_0_4px_rgb(37_99_235/0.15)]",
          grande && "text-center font-mono text-[2rem] font-extrabold tracking-[0.15em] uppercase",
          erro && "border-perigo bg-perigo-clara focus:border-perigo",
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
export function CampoPlaca({ rotulo = textos.campos.placa, onValor, ...props }: CampoEspecifico) {
  return (
    <Campo
      rotulo={rotulo}
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
export function CampoTelefone({ rotulo = textos.campos.telefone, onValor, ...props }: CampoEspecifico) {
  return (
    <Campo
      rotulo={rotulo}
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
export function CampoKm({ rotulo = textos.campos.km, onValor, ...props }: CampoEspecifico) {
  return (
    <Campo
      rotulo={rotulo}
      inputMode="numeric"
      pattern="[0-9.]*"
      autoComplete="off"
      placeholder="0"
      onValor={(v) => onValor(formatarKm(v))}
      {...props}
    />
  );
}
