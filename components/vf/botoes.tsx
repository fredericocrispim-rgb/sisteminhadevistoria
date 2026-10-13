import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

type BaseProps = {
  icone?: ReactNode;
  children: ReactNode;
  carregando?: boolean;
  href?: string;
  className?: string;
};

type BotaoProps = BaseProps & Omit<ComponentProps<"button">, "children" | "className">;

function Conteudo({ icone, children, carregando }: Pick<BaseProps, "icone" | "children" | "carregando">) {
  return (
    <>
      {carregando ? <Loader2 aria-hidden className="size-6 animate-spin" /> : icone}
      <span>{carregando ? textos.geral.carregando : children}</span>
    </>
  );
}

const baseBotao =
  "inline-flex min-h-toque w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-lg font-semibold " +
  "select-none transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 " +
  "[&_svg]:size-6 [&_svg]:shrink-0";

/**
 * Botão da ação principal da tela. Verde, grande.
 * Use UM por tela. Com `fixo`, fica preso no rodapé, ao alcance do polegar.
 */
export function BotaoPrincipal({
  icone,
  children,
  carregando,
  href,
  className,
  fixo,
  ...props
}: BotaoProps & { fixo?: boolean }) {
  const classes = cn(
    baseBotao,
    "bg-acao text-acao-texto shadow-md hover:bg-acao-escura",
    className,
  );
  const botao = href ? (
    <Link href={href} className={classes}>
      <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
    </Link>
  ) : (
    <button type="button" className={classes} disabled={carregando || props.disabled} {...props}>
      <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
    </button>
  );

  if (!fixo) return botao;
  return (
    <>
      {/* Espaço reservado para o conteúdo não ficar escondido atrás do botão */}
      <div aria-hidden className="h-28" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-xl">{botao}</div>
      </div>
    </>
  );
}

/** Botão de ação secundária: contorno, fundo branco. */
export function BotaoSecundario({ icone, children, carregando, href, className, ...props }: BotaoProps) {
  const classes = cn(
    baseBotao,
    "border-[length:var(--borda)] border-input bg-card text-foreground hover:bg-muted",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
      </Link>
    );
  }
  return (
    <button type="button" className={classes} disabled={carregando || props.disabled} {...props}>
      <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
    </button>
  );
}
