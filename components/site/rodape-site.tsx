import Link from "next/link";
import { AtSign, MessageCircle } from "lucide-react";
import { LogoProduto } from "@/components/vf";
import { contatoSuporte } from "@/lib/site";
import { INSTAGRAM, RODAPE_SITE } from "@/lib/site-paginas";
import { textos } from "@/lib/textos";

/** Rodapé das páginas públicas: links de todas as páginas, WhatsApp do suporte e Entrar. */
export async function RodapeSite() {
  const contato = await contatoSuporte();
  return (
    <footer className="mt-16 border-t bg-background/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <LogoProduto comNome pequeno />
          <p className="text-base text-muted-foreground">Vistoria digital de veículos pelo celular, feita para oficinas.</p>
          {contato && (
            <a
              href={contato.link}
              target="_blank"
              rel="noopener"
              className="tocavel inline-flex min-h-toque w-fit items-center gap-2 rounded-2xl bg-acao px-5 text-lg font-bold text-acao-texto hover:bg-acao-escura"
            >
              <MessageCircle aria-hidden className="size-5" /> Falar no WhatsApp
            </a>
          )}
          <a href={INSTAGRAM.link} target="_blank" rel="noopener" className="inline-flex min-h-11 w-fit items-center gap-2 text-base font-bold text-muted-foreground hover:text-foreground">
            <AtSign aria-hidden className="size-5" /> Instagram {INSTAGRAM.usuario}
          </a>
        </div>
        <nav aria-label="Páginas do site">
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {RODAPE_SITE.map((item) => (
              <li key={item.caminho}>
                <Link href={item.caminho} className="inline-flex min-h-11 items-center text-base font-bold text-muted-foreground hover:text-foreground">
                  {item.nome}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/entrar" className="inline-flex min-h-11 items-center text-base font-bold text-oficina">
                Entrar
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto w-full max-w-6xl px-5 pb-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {textos.produto.nome}
        {textos.produto.sufixo}
      </p>
    </footer>
  );
}
