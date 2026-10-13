"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export type AssinaturaRef = { imagem: () => string | null; limpar: () => void };

/** Quadro grande para assinar com o dedo. `imagem()` devolve PNG (ou null se ninguém assinou). */
export const AssinaturaDedo = forwardRef<AssinaturaRef, { rotulo: string; erro?: boolean; onMudou?: (assinado: boolean) => void }>(
  function AssinaturaDedo({ rotulo, erro, onMudou }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const desenhando = useRef(false);
    const ultimo = useRef<{ x: number; y: number } | null>(null);
    const [assinado, setAssinado] = useState(false);

    useEffect(() => {
      const c = canvas.current!;
      const ajustar = () => {
        const r = c.getBoundingClientRect();
        const escala = window.devicePixelRatio || 1;
        c.width = Math.round(r.width * escala);
        c.height = Math.round(r.height * escala);
        const ctx = c.getContext("2d")!;
        ctx.scale(escala, escala);
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0b1220";
        setAssinado(false);
      };
      ajustar();
      window.addEventListener("resize", ajustar);
      return () => window.removeEventListener("resize", ajustar);
    }, []);

    useImperativeHandle(ref, () => ({
      imagem: () => (assinado ? canvas.current!.toDataURL("image/png") : null),
      limpar,
    }));

    function ponto(e: React.PointerEvent) {
      const r = canvas.current!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function limpar() {
      const c = canvas.current!;
      c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
      setAssinado(false);
      onMudou?.(false);
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{rotulo}</span>
          <button
            type="button"
            onClick={limpar}
            className="tocavel inline-flex min-h-toque items-center gap-1.5 rounded-xl px-3 text-base font-bold text-muted-foreground [&_svg]:size-5"
          >
            <Eraser aria-hidden /> Limpar
          </button>
        </div>
        <div className={cn("relative rounded-2xl border-2 border-dashed bg-white", erro ? "border-perigo" : "border-input")}>
          <canvas
            ref={canvas}
            aria-label={rotulo}
            className="block h-48 w-full touch-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              desenhando.current = true;
              ultimo.current = ponto(e);
            }}
            onPointerMove={(e) => {
              if (!desenhando.current || !ultimo.current) return;
              const p = ponto(e);
              const ctx = canvas.current!.getContext("2d")!;
              ctx.beginPath();
              ctx.moveTo(ultimo.current.x, ultimo.current.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
              ultimo.current = p;
              if (!assinado) {
                setAssinado(true);
                onMudou?.(true);
              }
            }}
            onPointerUp={() => {
              desenhando.current = false;
              ultimo.current = null;
            }}
            onPointerCancel={() => {
              desenhando.current = false;
            }}
          />
          {!assinado && (
            <span className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-lg text-muted-foreground/60">Assine aqui com o dedo</span>
          )}
          <div className="pointer-events-none absolute inset-x-6 bottom-8 border-b-2 border-muted-foreground/30" />
        </div>
      </div>
    );
  },
);
