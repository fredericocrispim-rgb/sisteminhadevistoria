/**
 * Desenhos ORIGINAIS em linha do carro, usados como guia nas fotos.
 * Simples de propósito: só para mostrar o ângulo certo.
 */

export type VistaFoto =
  | "frente"
  | "traseira"
  | "lateral-esquerda"
  | "lateral-direita"
  | "diagonal-dianteira-esquerda"
  | "diagonal-traseira-direita"
  | "painel"
  | "placa";

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Lateral() {
  return (
    <g {...traco}>
      <path d="M12 70 L14 56 Q16 50 24 48 L46 44 L64 28 Q68 25 76 25 L118 25 Q126 25 132 30 L148 44 L172 48 Q184 50 186 58 L188 70 Z" />
      <path d="M68 44 L80 31 L104 31 L104 44 Z M110 31 L124 31 Q128 31 131 34 L140 44 L110 44 Z" />
      <circle cx="48" cy="72" r="13" />
      <circle cx="152" cy="72" r="13" />
      <circle cx="48" cy="72" r="5" />
      <circle cx="152" cy="72" r="5" />
    </g>
  );
}

function Frente({ traseira }: { traseira?: boolean }) {
  return (
    <g {...traco}>
      <path d="M50 78 L48 52 Q50 44 58 42 L68 22 Q70 18 76 18 L124 18 Q130 18 132 22 L142 42 Q150 44 152 52 L150 78 Z" />
      <path d="M72 24 L128 24 L136 40 L64 40 Z" />
      {traseira ? (
        <>
          <rect x="56" y="50" width="20" height="9" rx="2" />
          <rect x="124" y="50" width="20" height="9" rx="2" />
          <rect x="84" y="62" width="32" height="10" rx="1" />
        </>
      ) : (
        <>
          <ellipse cx="66" cy="54" rx="9" ry="6" />
          <ellipse cx="134" cy="54" rx="9" ry="6" />
          <path d="M82 52 L118 52 L116 62 L84 62 Z" />
          <rect x="86" y="66" width="28" height="8" rx="1" />
        </>
      )}
      <rect x="54" y="78" width="16" height="10" rx="3" />
      <rect x="130" y="78" width="16" height="10" rx="3" />
    </g>
  );
}

function Diagonal() {
  return (
    <g {...traco}>
      <path d="M20 72 L22 56 Q24 50 34 48 L50 44 L66 28 Q70 25 78 25 L120 25 Q128 25 134 30 L150 44 L172 50 Q182 54 182 62 L180 72 Z" />
      <path d="M150 44 L176 46 Q186 48 188 58 L186 70 L180 72" />
      <circle cx="52" cy="74" r="12" />
      <circle cx="148" cy="74" r="12" />
      <circle cx="176" cy="72" r="8" />
    </g>
  );
}

function Painel() {
  return (
    <g {...traco}>
      <rect x="20" y="14" width="160" height="70" rx="14" />
      <circle cx="70" cy="50" r="26" />
      <path d="M70 50 L86 36" />
      <circle cx="140" cy="50" r="20" />
      <path d="M128 60 Q140 34 152 60" />
      <path d="M140 50 L132 40" />
      <rect x="54" y="62" width="32" height="10" rx="2" />
    </g>
  );
}

function Placa() {
  return (
    <g>
      <rect x="30" y="22" width="140" height="56" rx="6" {...traco} />
      <rect x="30" y="22" width="140" height="12" rx="4" fill="currentColor" opacity="0.25" />
      <text x="100" y="66" textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="monospace" fill="currentColor">
        ABC1D23
      </text>
    </g>
  );
}

export function SilhuetaCarro({ vista, className }: { vista: VistaFoto; className?: string }) {
  let desenho: React.ReactNode;
  let espelhar = false;
  switch (vista) {
    case "frente":
      desenho = <Frente />;
      break;
    case "traseira":
      desenho = <Frente traseira />;
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
      espelhar = true;
      break;
    case "diagonal-traseira-direita":
      desenho = <Diagonal />;
      break;
    case "painel":
      desenho = <Painel />;
      break;
    case "placa":
      desenho = <Placa />;
      break;
  }
  return (
    <svg viewBox="0 0 200 96" className={className} aria-hidden>
      <g transform={espelhar ? "translate(200 0) scale(-1 1)" : undefined}>{desenho}</g>
    </svg>
  );
}
