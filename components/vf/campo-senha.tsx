"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { textos } from "@/lib/textos";
import { Campo } from "./campos";

/** Campo de senha com botão grande "Mostrar" (ajuda quem digita no celular). */
export function CampoSenha({
  rotulo,
  dica,
  valor,
  onValor,
  erro,
  nova,
}: {
  rotulo: string;
  dica?: string;
  valor: string;
  onValor: (v: string) => void;
  erro?: string;
  /** Senha nova (cadastro): o celular pode sugerir uma senha. */
  nova?: boolean;
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <Campo
        rotulo={rotulo}
        dica={dica}
        type={ver ? "text" : "password"}
        autoComplete={nova ? "new-password" : "current-password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        valor={valor}
        onValor={onValor}
        erro={erro}
        className="pr-32"
      />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        className="tocavel absolute top-[2.5rem] right-1 inline-flex min-h-toque items-center gap-1.5 rounded-xl px-3 text-base font-bold text-oficina [&_svg]:size-6"
      >
        {ver ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        {ver ? textos.conta.esconder : textos.conta.mostrar}
      </button>
    </div>
  );
}
