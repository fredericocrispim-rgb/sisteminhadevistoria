"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
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

type Modo = "nada" | "android" | "iphone";

function modoAtual(): Modo {
  const instalado =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (instalado) return "nada";
  if (pedido) return "android";
  const ua = navigator.userAgent;
  const iphone = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // No iPhone só o Safari consegue pôr na tela de início
  if (iphone && !/CriOS|FxiOS|EdgiOS/.test(ua)) return "iphone";
  return "nada";
}

/**
 * Cartão "Coloque o app na tela do celular".
 * Android: um toque instala. iPhone: mostra os 2 toques no Safari.
 * Some sozinho quando o app já está instalado. Com `podeFechar`, o "Agora não" esconde por 3 dias.
 */
export function InstalarApp({ podeFechar = true }: { podeFechar?: boolean }) {
  const modo = useSyncExternalStore(assinar, modoAtual, () => "nada" as Modo);
  const escondido = useSyncExternalStore(assinar, () => podeFechar && fechadoHaPouco(), () => true);
  const [verPassos, setVerPassos] = useState(false);

  if (modo === "nada" || escondido) return null;

  function fechar() {
    try {
      localStorage.setItem(CHAVE_FECHADO, String(Date.now()));
    } catch {}
    avisar();
  }

  async function instalar() {
    if (modo === "iphone") return setVerPassos(true);
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

      {verPassos ? (
        <ol className="flex flex-col gap-2 rounded-2xl bg-background p-3 text-lg font-semibold">
          <li className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-oficina font-extrabold text-oficina-texto">1</span>
            {t.iphone1} <Share aria-label="Compartilhar" className="size-6 shrink-0 text-oficina" />
          </li>
          <li className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-oficina font-extrabold text-oficina-texto">2</span>
            {t.iphone2} <SquarePlus aria-hidden className="size-6 shrink-0 text-oficina" />
          </li>
        </ol>
      ) : (
        <BotaoPrincipal icone={<Download aria-hidden />} onClick={instalar}>
          {t.instalar}
        </BotaoPrincipal>
      )}
    </div>
  );
}
