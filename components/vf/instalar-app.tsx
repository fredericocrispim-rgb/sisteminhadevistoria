"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Compass, Download, Ellipsis, Share, SquarePlus, X } from "lucide-react";
import { BotaoPrincipal } from "./botoes";
import { textos } from "@/lib/textos";

const t = textos.app;

type PedidoInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// O navegador avisa UMA vez por página que dá para instalar. Guardamos o aviso aqui,
// num lugar só, para qualquer tela poder usar depois (mesmo trocando de tela).
let pedido: PedidoInstalacao | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());
const assinar = (f: () => void) => (ouvintes.add(f), () => void ouvintes.delete(f));

/** Fica no layout principal: registra o service worker e guarda o pedido de instalação. */
export function RegistrarApp() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    const aoPoder = (e: Event) => {
      e.preventDefault(); // nós mostramos o nosso botão, na hora certa
      pedido = e as PedidoInstalacao;
      avisar();
    };
    const aoInstalar = () => {
      pedido = null;
      avisar();
    };
    window.addEventListener("beforeinstallprompt", aoPoder);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoder);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);
  return null;
}

const CHAVE_FECHADO = "vf_app_fechado_em";
const DIAS_ESCONDIDO = 3;

/** O "Agora não" foi tocado nos últimos 3 dias? */
function fechadoHaPouco() {
  try {
    return Date.now() - Number(localStorage.getItem(CHAVE_FECHADO) ?? 0) < DIAS_ESCONDIDO * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * - android: o navegador deixa instalar com 1 toque;
 * - iphone: Safari (a Apple só deixa pôr na Tela de Início pelo menu Compartilhar);
 *   `tresPontos`: no iOS 26 o Compartilhar fica dentro dos 3 pontinhos;
 * - iphone_chrome: Chrome/Edge/Firefox do iPhone (Compartilhar fica lá em cima);
 * - iphone_outro: navegador de dentro de outro app (Instagram, Facebook...): não dá, tem que abrir no Safari.
 */
type Modo = "nada" | "android" | "iphone" | "iphone_tres_pontos" | "iphone_chrome" | "iphone_outro";

function modoAtual(): Modo {
  const instalado =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (instalado) return "nada";
  if (pedido) return "android";
  const ua = navigator.userAgent;
  const iphone = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!iphone) return "nada";
  if (/CriOS|FxiOS|EdgiOS/.test(ua)) return "iphone_chrome";
  const safari = /Safari\//.test(ua) && /Version\/\d+/.test(ua) && !/FBAN|FBAV|Instagram|Line\/|GSA\//.test(ua);
  if (!safari) return "iphone_outro";
  const versao = Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0);
  return versao >= 26 ? "iphone_tres_pontos" : "iphone";
}

/**
 * Cartão "Coloque o app na tela do celular".
 * Android: um toque instala. iPhone: mostra direto os passos do Safari (a Apple não deixa instalar com 1 toque).
 * Some sozinho quando o app já está instalado. Com `podeFechar`, o "Agora não" esconde por 3 dias.
 */
export function InstalarApp({ podeFechar = true }: { podeFechar?: boolean }) {
  const modo = useSyncExternalStore(assinar, modoAtual, () => "nada" as Modo);
  const escondido = useSyncExternalStore(assinar, () => podeFechar && fechadoHaPouco(), () => true);

  if (modo === "nada" || escondido) return null;

  function fechar() {
    try {
      localStorage.setItem(CHAVE_FECHADO, String(Date.now()));
    } catch {}
    avisar();
  }

  async function instalar() {
    if (!pedido) return;
    await pedido.prompt();
    await pedido.userChoice;
    pedido = null;
    avisar();
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-3xl bg-oficina-clara p-4">
      {podeFechar && (
        <button
          type="button"
          onClick={fechar}
          aria-label={t.agoraNao}
          className="tocavel absolute top-1 right-1 grid size-12 place-items-center rounded-full text-muted-foreground [&_svg]:size-6"
        >
          <X aria-hidden />
        </button>
      )}
      <div className="flex items-center gap-3 pr-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- ícone fixo do app */}
        <img src="/app-maskable-192.png" alt="" className="size-14 shrink-0 rounded-2xl" />
        <div>
          <p className="text-xl leading-tight font-extrabold">{t.titulo}</p>
          <p className="text-base font-semibold text-muted-foreground">{t.texto}</p>
        </div>
      </div>

      {modo === "android" ? (
        <BotaoPrincipal icone={<Download aria-hidden />} onClick={instalar}>
          {t.instalar}
        </BotaoPrincipal>
      ) : (
        <PassosIphone modo={modo} />
      )}
    </div>
  );
}

type Passo = { texto: string; icone: ReactNode };

const passo = {
  tresPontos: { texto: t.iphoneTresPontos, icone: <Ellipsis aria-hidden /> },
  compartilhar: { texto: t.iphoneCompartilhar, icone: <Share aria-hidden /> },
  chrome: { texto: t.iphoneChrome, icone: <Share aria-hidden /> },
  adicionar: { texto: t.iphoneAdicionar, icone: <SquarePlus aria-hidden /> },
  confirmar: { texto: t.iphoneConfirmar, icone: null },
  safari: { texto: t.iphoneAbrirSafari, icone: <Compass aria-hidden /> },
} satisfies Record<string, Passo>;

function PassosIphone({ modo }: { modo: Modo }) {
  const passos: Passo[] =
    modo === "iphone_tres_pontos"
      ? [passo.tresPontos, passo.compartilhar, passo.adicionar, passo.confirmar]
      : modo === "iphone_chrome"
        ? [passo.chrome, passo.adicionar, passo.confirmar]
        : modo === "iphone_outro"
          ? [passo.safari]
          : [passo.compartilhar, passo.adicionar, passo.confirmar];
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-background p-3">
      <p className="text-base font-bold text-muted-foreground">{t.iphoneTitulo}</p>
      <ol className="flex flex-col gap-3 text-lg font-semibold">
        {passos.map((p, i) => (
          <li key={p.texto} className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-oficina font-extrabold text-oficina-texto">{i + 1}</span>
            <span className="flex-1 leading-tight">{p.texto}</span>
            {p.icone && <span className="shrink-0 text-oficina [&_svg]:size-7">{p.icone}</span>}
          </li>
        ))}
      </ol>
      {modo === "iphone_outro" && <p className="text-base font-semibold text-muted-foreground">{t.iphoneAbrirSafariDica}</p>}
    </div>
  );
}
