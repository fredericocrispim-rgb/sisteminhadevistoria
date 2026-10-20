"use client";

import type { MouseEvent } from "react";
import { ALTURA, LARGURA, corDoTipo, desenhosDo, type Forma, type VistaAvaria } from "@/lib/desenhos-carro";
import { cn } from "@/lib/utils";

export type MarcaAvaria = { id: string; numero: number; x: number; y: number; tipo: string; antiga?: boolean };

function Formas({ formas }: { formas: Forma[] }) {
  return (
    <>
      {formas.map((f, i) => {
        if (f.t === "path") return <path key={i} d={f.d} />;
        if (f.t === "circle") return <circle key={i} cx={f.cx} cy={f.cy} r={f.r} />;
        if (f.t === "ellipse") return <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} />;
        return <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} />;
      })}
    </>
  );
}

/**
 * Desenho do veículo em uma vista, com as marcações numeradas.
 * Toque no desenho = nova marcação (onToque recebe x, y em %). Toque na marcação = editar.
 */
export function DesenhoCarro({
  vista,
  veiculo,
  marcas,
  onToque,
  onMarca,
  className,
}: {
  vista: VistaAvaria;
  /** carro (padrão), moto ou caminhao. */
  veiculo?: string | null;
  marcas: MarcaAvaria[];
  onToque?: (x: number, y: number) => void;
  onMarca?: (m: MarcaAvaria) => void;
  className?: string;
}) {
  const desenho = desenhosDo(veiculo)[vista];

  function tocar(e: MouseEvent<HTMLDivElement>) {
    if (!onToque) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    onToque(Math.min(100, Math.max(0, Math.round(x * 100) / 100)), Math.min(100, Math.max(0, Math.round(y * 100) / 100)));
  }

  return (
    <div
      className={cn("relative w-full touch-manipulation select-none", onToque && "cursor-crosshair", className)}
      style={{ aspectRatio: `${LARGURA} / ${ALTURA}` }}
      onClick={tocar}
      role={onToque ? "button" : undefined}
      aria-label={onToque ? "Toque no lugar do risco ou amassado" : undefined}
    >
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="absolute inset-0 size-full text-muted-foreground" aria-hidden>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={desenho.espelhar ? `translate(${LARGURA} 0) scale(-1 1)` : undefined}
        >
          <Formas formas={desenho.formas} />
        </g>
      </svg>
      {marcas.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!m.antiga) onMarca?.(m);
          }}
          aria-label={`Marcação ${m.numero}`}
          className={cn(
            "absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-sm font-extrabold text-white shadow-md",
            m.antiga && "opacity-45",
          )}
          style={{ left: `${m.x}%`, top: `${m.y}%`, backgroundColor: m.antiga ? "#6b7280" : corDoTipo(m.tipo) }}
        >
          {m.numero}
        </button>
      ))}
    </div>
  );
}
