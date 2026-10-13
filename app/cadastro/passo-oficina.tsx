"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, Loader2, MapPin, Pencil } from "lucide-react";
import { BotaoPrincipal, Campo, CampoTelefone, MensagemErroCampo, SeletorGrande } from "@/components/vf";
import { cnpjValido, cpfValido, formatarCep, formatarCpfCnpj, formatarTelefone, soNumeros, telefoneValido } from "@/lib/formatos";
import { textos } from "@/lib/textos";
import { buscarCep, buscarCnpj, criarOficina, type DadosOficina } from "./acoes";
import type { EmpresaCadastro } from "./assistente";

const t = textos.cadastro.oficina;
const RASCUNHO = "vf-cadastro-oficina";

type Segmento = "oficina" | "funilaria" | "autocentro" | "guincho" | "associacao" | "outro";
type Form = Omit<DadosOficina, "segmento"> & { segmento: Segmento | null };

const vazio: Form = {
  documento: "",
  nome: "",
  whatsapp: "",
  segmento: null,
  faixa: null,
  razao_social: null,
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  telefone: null,
  email: null,
};

function lerRascunho(): Partial<Form> {
  try {
    return JSON.parse(localStorage.getItem(RASCUNHO) ?? "{}");
  } catch {
    return {};
  }
}

export function PassoOficina({
  whatsappUsuario,
  aoTerminar,
}: {
  whatsappUsuario: string;
  aoTerminar: (e: EmpresaCadastro) => void;
}) {
  const [f, setF] = useState<Form>(() => ({ ...vazio, whatsapp: whatsappUsuario, ...lerRascunho() }));
  const [busca, setBusca] = useState<"buscando" | "achou" | "nao" | null>(null);
  const [editarEndereco, setEditarEndereco] = useState(false);
  const [conferir, setConferir] = useState(false);
  const [erro, setErro] = useState<string>();
  const [carregando, setCarregando] = useState(false);
  const ultimoCnpj = useRef("");
  const ultimoCep = useRef("");

  const muda = (parcial: Partial<Form>) => setF((atual) => ({ ...atual, ...parcial }));

  // Salva sozinho enquanto digita (se fechar o app, não perde)
  useEffect(() => {
    try {
      localStorage.setItem(RASCUNHO, JSON.stringify(f));
    } catch {
      /* sem armazenamento: segue sem rascunho */
    }
  }, [f]);

  // CNPJ completo → busca os dados da empresa
  useEffect(() => {
    const d = soNumeros(f.documento);
    if (d.length !== 14 || !cnpjValido(d) || ultimoCnpj.current === d) return;
    ultimoCnpj.current = d;
    setBusca("buscando");
    buscarCnpj(d).then((r) => {
      if (!r) return setBusca("nao");
      setBusca("achou");
      if (r.cep) ultimoCep.current = soNumeros(r.cep);
      setF((a) => ({
        ...a,
        nome: a.nome || r.nome_fantasia || r.razao_social || "",
        razao_social: r.razao_social,
        cep: r.cep ? formatarCep(r.cep) : a.cep,
        logradouro: r.logradouro ?? a.logradouro,
        numero: r.numero ?? a.numero,
        complemento: r.complemento ?? a.complemento,
        bairro: r.bairro ?? a.bairro,
        cidade: r.cidade ?? a.cidade,
        uf: r.uf ?? a.uf,
        telefone: r.telefone ? formatarTelefone(r.telefone) : a.telefone,
        email: r.email ?? a.email,
      }));
    });
  }, [f.documento]);

  // CEP completo → busca o endereço
  useEffect(() => {
    const d = soNumeros(f.cep ?? "");
    if (d.length !== 8 || ultimoCep.current === d) return;
    ultimoCep.current = d;
    buscarCep(d).then((r) => {
      if (!r) return setEditarEndereco(true);
      setF((a) => ({ ...a, logradouro: r.logradouro ?? "", bairro: r.bairro ?? "", cidade: r.cidade ?? "", uf: r.uf ?? "" }));
    });
  }, [f.cep]);

  const docOk = cnpjValido(f.documento) || cpfValido(f.documento);
  const erros = {
    documento: conferir && !docOk ? (f.documento ? t.erroDocumento : "Coloque o CNPJ ou CPF") : undefined,
    nome: conferir && f.nome.trim().length < 2 ? t.erroNome : undefined,
    whatsapp: conferir && !telefoneValido(f.whatsapp) ? textos.erros.telefoneInvalido : undefined,
    segmento: conferir && !f.segmento,
  };
  const temEndereco = Boolean(f.logradouro && f.cidade);

  async function continuar() {
    setConferir(true);
    if (!docOk || f.nome.trim().length < 2 || !telefoneValido(f.whatsapp) || !f.segmento) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.scrollIntoView({ block: "center" }));
      return;
    }
    setCarregando(true);
    const r = await criarOficina({ ...f, segmento: f.segmento });
    setCarregando(false);
    if (!r.ok) return setErro(r.erro);
    try {
      localStorage.removeItem(RASCUNHO);
    } catch {}
    aoTerminar({ id: r.empresaId, nome: f.nome.trim(), cor: "#1d4ed8", logo: null });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        continuar();
      }}
    >
      <div className="flex flex-col gap-2">
        <Campo
          rotulo={t.documento}
          inputMode="numeric"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          valor={f.documento}
          onValor={(v) => muda({ documento: formatarCpfCnpj(v) })}
          erro={erros.documento}
        />
        {busca === "buscando" && (
          <p className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
            <Loader2 aria-hidden className="size-5 animate-spin" /> {t.buscando}
          </p>
        )}
        {busca === "achou" && (
          <p className="flex items-center gap-2 rounded-2xl bg-acao-clara px-4 py-3 text-base font-bold text-acao">
            <Building2 aria-hidden className="size-6 shrink-0" /> {t.encontrada}
          </p>
        )}
        {busca === "nao" && <p className="text-base font-semibold text-muted-foreground">{t.naoEncontrada}</p>}
      </div>

      <Campo
        rotulo={t.nome}
        dica={t.nomeDica}
        autoCapitalize="words"
        valor={f.nome}
        onValor={(v) => muda({ nome: v })}
        erro={erros.nome}
      />
      <CampoTelefone rotulo={t.whatsapp} valor={f.whatsapp} onValor={(v) => muda({ whatsapp: v })} erro={erros.whatsapp} />

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Campo
          rotulo={t.cep}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          valor={f.cep ?? ""}
          onValor={(v) => muda({ cep: formatarCep(v) })}
        />
        <Campo rotulo={t.numero} inputMode="numeric" valor={f.numero ?? ""} onValor={(v) => muda({ numero: v })} />
      </div>

      {temEndereco && !editarEndereco ? (
        <div className="-mt-2 flex items-center gap-3 rounded-2xl bg-superficie px-4 py-3">
          <MapPin aria-hidden className="size-6 shrink-0 text-muted-foreground" />
          <p className="flex-1 text-base font-semibold">
            {f.logradouro}
            {f.numero ? `, ${f.numero}` : ""}
            {f.bairro ? ` – ${f.bairro}` : ""}
            <br />
            {f.cidade}/{f.uf}
          </p>
          <button
            type="button"
            onClick={() => setEditarEndereco(true)}
            className="tocavel inline-flex min-h-toque items-center gap-1 rounded-xl px-2 text-base font-bold text-oficina"
          >
            <Pencil aria-hidden className="size-5" /> Mudar
          </button>
        </div>
      ) : (
        (editarEndereco || soNumeros(f.cep ?? "").length === 8) && (
          <div className="flex flex-col gap-4">
            <Campo rotulo={t.endereco} valor={f.logradouro ?? ""} onValor={(v) => muda({ logradouro: v })} />
            <Campo rotulo="Bairro" valor={f.bairro ?? ""} onValor={(v) => muda({ bairro: v })} />
            <div className="grid grid-cols-[1fr_5.5rem] gap-3">
              <Campo rotulo={t.cidade} valor={f.cidade ?? ""} onValor={(v) => muda({ cidade: v })} />
              <Campo
                rotulo="UF"
                maxLength={2}
                autoCapitalize="characters"
                valor={f.uf ?? ""}
                onValor={(v) => muda({ uf: v.replace(/[^a-z]/gi, "").toUpperCase() })}
              />
            </div>
          </div>
        )
      )}

      <div className="flex flex-col gap-2">
        <SeletorGrande
          rotulo={t.tipo}
          valor={f.segmento}
          onChange={(v) => muda({ segmento: v })}
          colunas={2}
          compacto
          erro={erros.segmento}
          opcoes={(Object.entries(t.segmentos) as [Segmento, string][]).map(([valor, rotulo]) => ({ valor, rotulo }))}
        />
        {erros.segmento && <MensagemErroCampo>{textos.erros.escolhaUmaOpcao}</MensagemErroCampo>}
      </div>

      <SeletorGrande
        rotulo={t.quantas}
        valor={(f.faixa as string | null) ?? null}
        onChange={(v) => muda({ faixa: v })}
        colunas={2}
        compacto
        opcoes={t.faixas.map((x) => ({ valor: x, rotulo: x }))}
      />

      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <BotaoPrincipal fixo type="submit" carregando={carregando} icone={<ArrowRight aria-hidden />}>
        {textos.cadastro.continuar}
      </BotaoPrincipal>
    </form>
  );
}
