import { desenhosDo, type Forma, type VistaAvaria } from "@/lib/desenhos-carro";

/**
 * Desenhos ORIGINAIS do carro, usados como guia nas fotos.
 * Moto e caminhão usam os desenhos do mapa de avarias (lib/desenhos-carro), com o mesmo estilo.
 * Estilo: carrinho arredondado, traço na cor do texto (currentColor), carroceria e vidros
 * levemente preenchidos e rodas cheias. Área de desenho: 200 x 96.
 */

export type VistaFoto =
  | "frente"
  | "traseira"
  | "lateral-esquerda"
  | "lateral-direita"
  | "diagonal-dianteira-esquerda"
  | "diagonal-traseira-direita"
  | "painel"
  | "placa"
  | "extra";

const traco = {
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const lataria = { ...traco, fill: "currentColor", fillOpacity: 0.1 };
const vidro = { ...traco, fill: "currentColor", fillOpacity: 0.22, strokeWidth: 2.5 };
const linha = { ...traco, fill: "none", strokeWidth: 2.2, strokeOpacity: 0.7 };
const cheio = { fill: "currentColor" };

function Roda({ cx, cy, r = 14 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} {...cheio} />
      <circle cx={cx} cy={cy} r={r * 0.48} fill="#fff" />
      <circle cx={cx} cy={cy} r={r * 0.16} {...cheio} />
    </g>
  );
}

/** Carrinho visto de lado, frente para a esquerda. */
function Lateral() {
  return (
    <g>
      <path
        d="M16 62 Q14 52 22 48 Q30 45 52 43 L66 27 Q72 20 84 20 L124 20 Q136 20 144 28 L157 42 Q176 44 183 49 Q187 53 186 60 L185 66 Q184 69 180 69 L160 69 A17 17 0 0 0 126 69 L74 69 A17 17 0 0 0 40 69 L20 69 Q16 69 16 62 Z"
        {...lataria}
      />
      <path d="M70 41 L80 29 Q84 25 90 25 L101 25 L101 41 Z" {...vidro} />
      <path d="M107 25 L123 25 Q131 25 136 30 L147 41 L107 41 Z" {...vidro} />
      <path d="M104 46 L104 64" {...linha} />
      <path d="M86 50 L94 50 M116 50 L124 50" {...linha} />
      <path d="M62 41 Q60 36 66 36 L68 40" {...traco} fill="currentColor" fillOpacity={0.35} strokeWidth={2} />
      <rect x="18" y="50" width="11" height="6" rx="3" fill="#fff" {...traco} strokeWidth={2} />
      <rect x="178" y="50" width="6" height="8" rx="2" {...cheio} fillOpacity={0.55} />
      <Roda cx={57} cy={69} />
      <Roda cx={143} cy={69} />
    </g>
  );
}

/** Carrinho de frente (ou de trás). */
function Frontal({ traseira }: { traseira?: boolean }) {
  return (
    <g>
      <rect x="44" y="72" width="20" height="16" rx="5" {...cheio} />
      <rect x="136" y="72" width="20" height="16" rx="5" {...cheio} />
      <path
        d="M40 74 L40 56 Q40 45 52 43 L62 24 Q66 17 75 17 L125 17 Q134 17 138 24 L148 43 Q160 45 160 56 L160 74 Q160 79 155 79 L45 79 Q40 79 40 74 Z"
        {...lataria}
      />
      <path d="M71 23 L129 23 Q133 23 135 27 L142 40 L58 40 L65 27 Q67 23 71 23 Z" {...vidro} />
      <path d="M47 43 L37 41 Q33 41 34 45 L46 47" {...lataria} fillOpacity={0.35} strokeWidth={2.5} />
      <path d="M153 43 L163 41 Q167 41 166 45 L154 47" {...lataria} fillOpacity={0.35} strokeWidth={2.5} />
      {traseira ? (
        <>
          <rect x="47" y="50" width="24" height="9" rx="4" {...cheio} fillOpacity={0.6} />
          <rect x="129" y="50" width="24" height="9" rx="4" {...cheio} fillOpacity={0.6} />
          <path d="M60 46 L140 46" {...linha} />
          <rect x="84" y="58" width="32" height="12" rx="3" fill="#fff" {...traco} strokeWidth={2} />
        </>
      ) : (
        <>
          <circle cx="58" cy="55" r="7" fill="#fff" {...traco} strokeWidth={2.5} />
          <circle cx="142" cy="55" r="7" fill="#fff" {...traco} strokeWidth={2.5} />
          <rect x="78" y="50" width="44" height="11" rx="5" {...cheio} fillOpacity={0.3} />
          <rect x="88" y="64" width="24" height="8" rx="2" fill="#fff" {...traco} strokeWidth={2} />
        </>
      )}
    </g>
  );
}

/**
 * Visto de quina (3/4): frente (ou traseira) à esquerda, lateral para a direita.
 * A roda da frente fica maior (mais perto). O espelho é feito por quem usa.
 */
function Diagonal({ traseira }: { traseira?: boolean }) {
  return (
    <g>
      <path
        d="M14 66 L13 56 Q13 50 20 48 L44 46 L62 43 L77 26 Q80 22 87 22 L136 22 Q146 22 152 30 L162 42 Q181 45 186 51 Q188 55 187 61 L186 66 Q185 69 181 69 L166 69 A15 15 0 0 0 136 69 L100 69 A17 17 0 0 0 66 71 L18 71 Q14 71 14 66 Z"
        {...lataria}
      />
      <path d="M44 46 L48 70" {...linha} />
      <path d="M66 41 L79 27 Q82 24 87 24 L98 24 L97 41 Z" {...vidro} />
      <path d="M103 24 L119 24 L119 41 L102 41 Z" {...vidro} />
      <path d="M125 24 L134 24 Q142 24 147 30 L155 41 L125 41 Z" {...vidro} />
      <path d="M122 45 L122 64 M106 49 L113 49 M131 49 L138 49" {...linha} />
      <path d="M60 41 Q58 36 64 36 L66 40" {...traco} fill="currentColor" fillOpacity={0.35} strokeWidth={2} />
      {traseira ? (
        <rect x="17" y="51" width="16" height="7" rx="3" {...cheio} fillOpacity={0.6} />
      ) : (
        <ellipse cx="23" cy="55" rx="6.5" ry="4.5" fill="#fff" {...traco} strokeWidth={2.2} />
      )}
      <rect x="24" y="61" width="14" height="5" rx="2" fill="#fff" {...traco} strokeWidth={1.8} />
      <Roda cx={83} cy={71} r={15} />
      <Roda cx={151} cy={69} r={13} />
    </g>
  );
}

function Painel() {
  return (
    <g>
      <rect x="18" y="12" width="164" height="70" rx="20" {...lataria} />
      {/* velocímetro */}
      <circle cx="72" cy="47" r="26" fill="#fff" {...traco} />
      {[-120, -80, -40, 0, 40, 80, 120].map((a) => {
        const r1 = 20;
        const r2 = 24;
        const rad = ((a - 90) * Math.PI) / 180;
        return (
          <path
            key={a}
            d={`M${72 + r1 * Math.cos(rad)} ${47 + r1 * Math.sin(rad)} L${72 + r2 * Math.cos(rad)} ${47 + r2 * Math.sin(rad)}`}
            {...traco}
            strokeWidth={2}
          />
        );
      })}
      <path d="M72 47 L86 33" {...traco} strokeWidth={3.5} />
      <circle cx="72" cy="47" r="3.5" {...cheio} />
      <rect x="58" y="58" width="28" height="9" rx="3" {...cheio} fillOpacity={0.25} />
      {/* combustível */}
      <circle cx="140" cy="47" r="20" fill="#fff" {...traco} />
      <path d="M126 52 A15 15 0 0 1 154 52" {...linha} />
      <path d="M140 47 L131 37" {...traco} strokeWidth={3} />
      <circle cx="140" cy="47" r="3" {...cheio} />
      <path d="M135 58 L135 54 L140 54 L140 58 Z" {...cheio} fillOpacity={0.5} />
    </g>
  );
}

function Placa() {
  return (
    <g>
      <rect x="24" y="18" width="152" height="60" rx="8" fill="#fff" {...traco} />
      <path d="M24 34 L24 26 Q24 18 32 18 L168 18 Q176 18 176 26 L176 34 Z" {...cheio} fillOpacity={0.85} />
      <text x="100" y="30" textAnchor="middle" fontSize="9" fontWeight="800" fontFamily="system-ui, Arial, sans-serif" fill="#fff" letterSpacing="2">
        BRASIL
      </text>
      <text x="100" y="65" textAnchor="middle" fontSize="27" fontWeight="800" fontFamily="ui-monospace, Consolas, monospace" fill="currentColor" letterSpacing="1">
        ABC1D23
      </text>
    </g>
  );
}

/** Desenha formas do mapa de avarias no estilo do guia (rodas cheias, vidros preenchidos). */
function DeFormas({ formas }: { formas: Forma[] }) {
  return (
    <g>
      {formas.map((f, i) => {
        const estilo = f.p === "roda" ? cheio : f.p === "cubo" ? { fill: "#fff" } : f.p === "vidro" ? vidro : lataria;
        if (f.t === "path") return <path key={i} d={f.d} {...estilo} />;
        if (f.t === "circle") return <circle key={i} cx={f.cx} cy={f.cy} r={f.r} {...estilo} />;
        if (f.t === "ellipse") return <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} {...estilo} />;
        return <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx} {...estilo} />;
      })}
    </g>
  );
}

const VISTA_DO_MAPA: Partial<Record<VistaFoto, VistaAvaria>> = {
  frente: "frente",
  traseira: "traseira",
  "lateral-esquerda": "lateral_esquerda",
  "lateral-direita": "lateral_direita",
};

/** Foto extra (opcional): câmera com um sinal de mais. */
function Extra() {
  return (
    <g>
      <path d="M62 30 L74 30 L81 20 L119 20 L126 30 L138 30 Q148 30 148 40 L148 74 Q148 84 138 84 L62 84 Q52 84 52 74 L52 40 Q52 30 62 30 Z" {...lataria} />
      <circle cx="100" cy="56" r="17" fill="#fff" {...traco} />
      <path d="M100 48 L100 64 M92 56 L108 56" {...traco} strokeWidth={3.5} />
      <circle cx="136" cy="40" r="3" {...cheio} />
    </g>
  );
}

export function SilhuetaCarro({ vista, veiculo = "carro", className }: { vista: VistaFoto; veiculo?: string; className?: string }) {
  let desenho: React.ReactNode;
  let espelhar = false;
  const doMapa = veiculo !== "carro" ? VISTA_DO_MAPA[vista] : undefined;
  if (doMapa) {
    const d = desenhosDo(veiculo)[doMapa];
    return (
      <svg viewBox="0 0 200 96" className={className} aria-hidden>
        <g transform={d.espelhar ? "translate(200 0) scale(-1 1)" : undefined}>
          <DeFormas formas={d.formas} />
        </g>
      </svg>
    );
  }
  switch (vista) {
    case "frente":
      desenho = <Frontal />;
      break;
    case "traseira":
      desenho = <Frontal traseira />;
      break;
    case "lateral-esquerda":
      desenho = <Lateral />;
      break;
    case "lateral-direita":
      desenho = <Lateral />;
      espelhar = true;
      break;
    case "diagonal-dianteira-esquerda":
      desenho = <Diagonal />;
      break;
    case "diagonal-traseira-direita":
      desenho = <Diagonal traseira />;
      espelhar = true;
      break;
    case "painel":
      desenho = <Painel />;
      break;
    case "placa":
      desenho = <Placa />;
      break;
    case "extra":
      desenho = <Extra />;
      break;
  }
  return (
    <svg viewBox="0 0 200 96" className={className} aria-hidden>
      <g transform={espelhar ? "translate(200 0) scale(-1 1)" : undefined}>{desenho}</g>
    </svg>
  );
}
