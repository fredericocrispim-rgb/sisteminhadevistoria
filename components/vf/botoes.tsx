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
  /** Link comum (abre arquivo/rota do servidor, ex.: PDF), sem navegação do Next. */
  nativo?: boolean;
  className?: string;
};

type BotaoProps = BaseProps & Omit<ComponentProps<"button">, "children" | "className">;

function Conteudo({ icone, children, carregando }: Pick<BaseProps, "icone" | "children" | "carregando">) {
  return (
    <>
      {carregando ? <Loader2 aria-hidden className="animate-spin" /> : icone}
      <span>{carregando ? textos.geral.carregando : children}</span>
    </>
  );
}

const baseBotao =
  "tocavel inline-flex w-full items-center justify-center gap-3 rounded-2xl px-5 font-bold select-none " +
  "disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-7 [&_svg]:shrink-0";

function BotaoOuLink({ href, nativo, className, icone, children, carregando, ...props }: BotaoProps) {
  if (href && nativo) {
    return (
      <a href={href} className={className}>
        <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
      </Link>
    );
  }
  return (
    <button type="button" className={className} disabled={carregando || props.disabled} {...props}>
      <Conteudo icone={icone} carregando={carregando}>{children}</Conteudo>
    </button>
  );
}

/**
 * Botão da ação principal da tela. Verde, grande (64 px).
 * Use UM por tela. Com `fixo`, fica preso no rodapé, ao alcance do polegar.
 */
export function BotaoPrincipal({ className, fixo, ...props }: BotaoProps & { fixo?: boolean }) {
  const botao = (
    <BotaoOuLink
      className={cn(
        baseBotao,
        "min-h-toque-grande bg-acao text-xl text-acao-texto shadow-[0_10px_24px_-10px_rgb(19_134_90/0.7)] hover:bg-acao-escura",
        className,
      )}
      {...props}
    />
  );
  if (!fixo) return botao;
  return (
    <>
      {/* Espaço reservado para o conteúdo não ficar escondido atrás do botão */}
      <div aria-hidden className="h-24" />
      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background from-70% to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl">{botao}</div>
      </div>
    </>
  );
}

/** Botão secundário: cinza claro, sem borda. */
export function BotaoSecundario({ className, ...props }: BotaoProps) {
  return (
    <BotaoOuLink
      className={cn(baseBotao, "min-h-toque bg-superficie text-lg text-foreground hover:brightness-95", className)}
      {...props}
    />
  );
}
