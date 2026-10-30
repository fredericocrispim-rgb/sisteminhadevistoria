/* eslint-disable @next/next/no-img-element -- fotos com link temporário do Storage */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { FileText, MessageCircle, XCircle } from "lucide-react";
import { BotaoPrincipal, DesenhoCarro, EstadoVazio, LogoOficina, LogoProduto } from "@/components/vf";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { vistoriaPorToken } from "@/lib/vistoria-publica";
import { NOMES_COMBUSTIVEL, dataHoraBR, pneusDoVeiculo, ordemFoto, placaParaMostrar, tituloFoto } from "@/lib/vistoria";
import { VISTAS, corDoTipo, nomeDaVista, nomeDoTipo, type VistaAvaria } from "@/lib/desenhos-carro";
import { telefoneParaWhatsapp } from "@/lib/formatos";
import { textos } from "@/lib/textos";

export const metadata: Metadata = {
  title: "Vistoria do veículo",
  robots: { index: false },
  // Prévia do link que o cliente recebe no WhatsApp (sem o texto de propaganda da página inicial)
  openGraph: { title: "Vistoria do seu veículo", description: "Fotos e termo de vistoria assinado." },
  twitter: { title: "Vistoria do seu veículo", description: "Fotos e termo de vistoria assinado." },
};

export default async function VistoriaPublica({ params }: PageProps<"/v/[token]">) {
  const { token } = await params;
  const v = await vistoriaPorToken(token);
  if (!v) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4">
        <EstadoVazio icone={<XCircle aria-hidden />} titulo="Vistoria não encontrada" texto="O link pode estar errado ou foi desativado pela oficina." />
      </main>
    );
  }

  const admin = criarClienteAdmin();
  const [{ data: fotos }, { data: avarias }, { data: pneus }] = await Promise.all([
    admin.from("vistoria_fotos").select("categoria, url, data_hora").eq("vistoria_id", v.id),
    admin.from("vistoria_avarias").select("numero, vista, x, y, tipo, descricao, nova_na_saida").eq("vistoria_id", v.id).order("numero"),
    admin.from("vistoria_pneus").select("posicao, estado").eq("vistoria_id", v.id),
  ]);
  const { data: assinadas } = fotos?.length
    ? await admin.storage.from("vistorias").createSignedUrls(fotos.map((f) => f.url), 60 * 60)
    : { data: [] as { path: string | null; signedUrl: string }[] };

  // Registra a visualização (sem guardar nada do visitante além do IP e do navegador)
  const h = await headers();
  await admin.from("visualizacoes_publicas").insert({
    vistoria_id: v.id,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    agente: (h.get("user-agent") ?? "").slice(0, 200),
  });

  const e = v.empresas as unknown as { nome_fantasia: string; whatsapp: string | null; logo_app_url: string | null };
  const carro = v.veiculos as unknown as { placa: string; marca: string | null; modelo: string | null; cor: string | null };
  const chegada = v.tipo === "ENTRADA";
  const listaFotos = (fotos ?? [])
    .map((f) => ({
      ...f,
      titulo: tituloFoto(f.categoria),
      src: assinadas?.find((a) => a.path === f.url)?.signedUrl,
    }))
    .sort((a, b) => ordemFoto(a.categoria) - ordemFoto(b.categoria));
  const vistasComAvaria = VISTAS.filter((vi) => avarias?.some((a) => a.vista === vi.id));

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-6 pb-32">
        <header className="flex items-center gap-3">
          <LogoOficina nome={e.nome_fantasia} url={e.logo_app_url} />
          <div>
            <p className="text-xl leading-tight font-extrabold">{e.nome_fantasia}</p>
            <p className="text-base text-muted-foreground">Vistoria de {chegada ? "chegada" : "entrega"}</p>
          </div>
        </header>

        <section className="rounded-3xl bg-superficie p-5">
          <p className="font-mono text-3xl font-extrabold tracking-wider">{placaParaMostrar(carro.placa)}</p>
          <p className="text-lg font-semibold">{[carro.marca, carro.modelo, carro.cor].filter(Boolean).join(" · ")}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-base">
            <div>
              <dt className="text-muted-foreground">Data</dt>
              <dd className="font-bold">{v.concluida_em ? dataHoraBR(v.concluida_em) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Km</dt>
              <dd className="font-bold">{v.km != null ? Number(v.km).toLocaleString("pt-BR") : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Combustível</dt>
              <dd className="font-bold">{v.combustivel ? NOMES_COMBUSTIVEL[v.combustivel] : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-bold">{v.codigo_autenticidade}</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">Fotos</h2>
          <div className="grid grid-cols-2 gap-2">
            {listaFotos.map((f) => (
              <a key={f.url} href={f.src ?? undefined} target="_blank" rel="noreferrer" className="flex flex-col gap-1">
                {f.src ? <img src={f.src} alt={f.titulo} className="aspect-[4/3] w-full rounded-xl object-cover" /> : null}
                <span className="text-sm font-bold">{f.titulo}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">Riscos e amassados</h2>
          {avarias?.length ? (
            <>
              {vistasComAvaria.map((vi) => (
                <div key={vi.id} className="rounded-2xl bg-superficie p-3">
                  <p className="mb-1 text-sm font-bold text-muted-foreground">{vi.nome}</p>
                  <DesenhoCarro
                    vista={vi.id as VistaAvaria}
                    veiculo={v.tipo_veiculo}
                    marcas={(avarias ?? [])
                      .filter((a) => a.vista === vi.id)
                      .map((a) => ({ id: String(a.numero), numero: a.numero, x: Number(a.x), y: Number(a.y), tipo: a.tipo }))}
                  />
                </div>
              ))}
              <ul className="flex flex-col gap-1">
                {avarias.map((a) => (
                  <li key={a.numero} className="flex items-center gap-2 text-base">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: corDoTipo(a.tipo) }}>
                      {a.numero}
                    </span>
                    <span>
                      <strong>{nomeDoTipo(a.tipo)}</strong> · {nomeDaVista(a.vista)}
                      {a.descricao ? ` · ${a.descricao}` : ""}
                      {a.nova_na_saida ? " · NOVA" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-lg">Nenhum risco ou amassado registrado.</p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold">Pneus</h2>
          <ul className="grid grid-cols-2 gap-2 text-base">
            {pneusDoVeiculo(v.tipo_veiculo).map((p) => {
              const estado = pneus?.find((x) => x.posicao === p.posicao)?.estado;
              return (
                <li key={p.posicao} className="rounded-xl bg-superficie px-3 py-2">
                  <span className="block text-muted-foreground">{p.nome}</span>
                  <strong className={estado === "ruim" ? "text-perigo" : ""}>{estado === "bom" ? "BOM" : estado === "ruim" ? "RUIM" : estado === "ausente" ? "NÃO TEM" : "—"}</strong>
                </li>
              );
            })}
          </ul>
        </section>

        {v.observacoes && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold">Observações</h2>
            <p className="text-lg whitespace-pre-line">{v.observacoes}</p>
          </section>
        )}

        <p className="text-base text-muted-foreground">
          Assinado por {v.nome_assinante_cliente ?? "—"} (cliente) e {chegada ? v.recebido_por : v.liberado_por} ({e.nome_fantasia}).
        </p>

        {e.whatsapp && (
          <a
            href={`https://wa.me/${telefoneParaWhatsapp(e.whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="tocavel inline-flex min-h-toque items-center justify-center gap-2 rounded-2xl bg-superficie px-4 text-lg font-bold [&_svg]:size-6"
          >
            <MessageCircle aria-hidden /> Falar com a oficina
          </a>
        )}

        <footer className="mt-4 flex flex-col items-center gap-2 border-t pt-5 text-center">
          <LogoProduto className="size-8" />
          <p className="text-sm text-muted-foreground">Vistoria digital por {textos.produto.nome}</p>
          <a href={`/verificar/${v.codigo_autenticidade}`} className="text-sm font-bold text-oficina underline underline-offset-4">
            Conferir se este documento é original
          </a>
        </footer>
      </main>

      {v.pdf_url && (
        <BotaoPrincipal fixo nativo href={`/v/${token}/pdf`} icone={<FileText aria-hidden />}>
          Baixar termo (PDF)
        </BotaoPrincipal>
      )}
    </div>
  );
}
