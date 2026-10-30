import "server-only";
/* eslint-disable jsx-a11y/alt-text -- Image do react-pdf não tem "alt" (é PDF, não HTML) */
import { Circle, Document, Ellipse, G, Image, Page, Path, Rect, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { iniciais } from "@/lib/cores";
import { ALTURA, LARGURA, desenhosDo, VISTAS, corDoTipo, nomeDaVista, nomeDoTipo, type Forma, type VistaAvaria } from "@/lib/desenhos-carro";
import { NOMES_COMBUSTIVEL, dataHoraBR, nomeVeiculo, pneusDoVeiculo, mascararDocumento, ordemFoto, placaParaMostrar, tituloFoto } from "@/lib/vistoria";
import { formatarTelefone } from "@/lib/formatos";

type Img = { data: Buffer; format: "png" | "jpg" };

const cinza = "#5b6474";
const borda = "#d5dbe3";

const s = StyleSheet.create({
  pagina: { paddingTop: 28, paddingBottom: 48, paddingHorizontal: 30, fontSize: 9, fontFamily: "Helvetica", color: "#0b1220" },
  cabecalho: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 90, height: 48, objectFit: "contain" },
  monograma: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  oficina: { flex: 1, fontSize: 8, color: cinza, lineHeight: 1.35 },
  oficinaNome: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0b1220", marginBottom: 2 },
  titulo: { alignItems: "flex-end" },
  tituloTexto: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  tipo: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2 },
  faixa: { height: 4, marginTop: 10, marginBottom: 12, borderRadius: 2 },
  secao: { marginBottom: 12 },
  secaoTitulo: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: borda },
  grade: { flexDirection: "row", flexWrap: "wrap" },
  campo: { width: "33.33%", paddingVertical: 3, paddingRight: 6 },
  rotulo: { fontSize: 7, color: cinza, textTransform: "uppercase" },
  valor: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 1 },
  linha: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: borda, paddingVertical: 3 },
  vistas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vista: { width: 170 },
  vistaNome: { fontSize: 7, color: cinza, textAlign: "center", marginTop: 2 },
  marca: { position: "absolute", width: 12, height: 12, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  marcaTexto: { fontSize: 6.5, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  fotos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  foto: { width: 258 },
  // 4:3, igual à foto do celular: não corta o carimbo (data, hora, placa) que fica embaixo
  fotoImg: { width: 258, height: 193.5, objectFit: "cover", borderRadius: 4 },
  legenda: { fontSize: 7.5, color: cinza, marginTop: 2 },
  assinaturas: { flexDirection: "row", gap: 16 },
  assinatura: { flex: 1, alignItems: "center" },
  assinaturaImg: { width: 200, height: 70, objectFit: "contain" },
  assinaturaLinha: { width: "100%", borderTopWidth: 1, borderTopColor: "#0b1220", marginTop: 2, paddingTop: 3, alignItems: "center" },
  aceite: { fontSize: 8.5, lineHeight: 1.4, marginBottom: 10, padding: 8, backgroundColor: "#f1f3f6", borderRadius: 4 },
  evidencias: { flexDirection: "row", gap: 12, marginTop: 12, padding: 8, borderWidth: 1, borderColor: borda, borderRadius: 4 },
  rodape: { position: "absolute", bottom: 18, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: cinza },
});

function Desenho({ formas, espelhar, cor }: { formas: Forma[]; espelhar?: boolean; cor: string }) {
  const traco = { stroke: cor, strokeWidth: 2.5, fill: "none" };
  return (
    <G transform={espelhar ? `translate(${LARGURA} 0) scale(-1 1)` : undefined}>
      {formas.map((f, i) => {
        if (f.t === "path") return <Path key={i} d={f.d} {...traco} />;
        if (f.t === "circle") return <Circle key={i} cx={f.cx} cy={f.cy} r={f.r} {...traco} />;
        if (f.t === "ellipse") return <Ellipse key={i} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} {...traco} />;
        return <Rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.rx ?? 0} {...traco} />;
      })}
    </G>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <View style={s.campo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text style={s.valor}>{valor || "—"}</Text>
    </View>
  );
}

async function baixar(caminho: string | null | undefined, formato: "png" | "jpg"): Promise<Img | null> {
  if (!caminho) return null;
  const { data } = await criarClienteAdmin().storage.from("vistorias").download(caminho);
  return data ? { data: Buffer.from(await data.arrayBuffer()), format: formato } : null;
}

/** Gera o Termo de Vistoria (PDF A4). `base` é o endereço do site, para o QR Code de verificação. */
export async function gerarTermoPdf(vistoriaId: string, base: string): Promise<Buffer> {
  const admin = criarClienteAdmin();
  const { data: v, error } = await admin
    .from("vistorias")
    .select(
      `*, empresas (nome_fantasia, razao_social, cnpj_cpf, logradouro, numero, bairro, cidade, uf, whatsapp, telefone, site, logo_pdf_url),
       veiculos (placa, marca, modelo, ano, cor), clientes (nome, whatsapp, cpf_cnpj)`,
    )
    .eq("id", vistoriaId)
    .single();
  if (error || !v) throw new Error("vistoria não encontrada");

  const [{ data: fotos }, { data: avarias }, { data: pneus }, { data: itens }, { data: adendos }, { data: plat }] = await Promise.all([
    admin.from("vistoria_fotos").select("categoria, url, data_hora").eq("vistoria_id", vistoriaId).order("criado_em"),
    admin.from("vistoria_avarias").select("numero, vista, x, y, tipo, descricao, nova_na_saida").eq("vistoria_id", vistoriaId).order("numero"),
    admin.from("vistoria_pneus").select("posicao, estado").eq("vistoria_id", vistoriaId),
    admin.from("vistoria_itens").select("item_nome, tem").eq("vistoria_id", vistoriaId),
    admin.from("vistoria_adendos").select("texto, autor_nome, data_hora").eq("vistoria_id", vistoriaId).order("data_hora"),
    admin.from("plataforma").select("nome_produto, fornecedor_site").single(),
  ]);

  const e = v.empresas as unknown as Record<string, string | null>;
  const carro = v.veiculos as unknown as { placa: string; marca: string | null; modelo: string | null; ano: number | null; cor: string | null };
  const cliente = v.clientes as unknown as { nome: string; whatsapp: string | null; cpf_cnpj: string | null } | null;
  const cor = "#2563eb"; // azul do Vistoria Rápida (todas as oficinas usam as cores do sistema)
  const chegada = v.tipo === "ENTRADA";

  // Imagens (logo, fotos, assinaturas)
  let logo: Img | null = null;
  if (e.logo_pdf_url) {
    try {
      const r = await fetch(e.logo_pdf_url, { signal: AbortSignal.timeout(8000) });
      if (r.ok) logo = { data: Buffer.from(await r.arrayBuffer()), format: "png" };
    } catch {
      logo = null;
    }
  }
  const fotosOrdenadas = [...(fotos ?? [])].sort((a, b) => ordemFoto(a.categoria) - ordemFoto(b.categoria));
  const [imagensFotos, assinCliente, assinResp] = await Promise.all([
    Promise.all(fotosOrdenadas.map((f) => baixar(f.url, "jpg"))),
    baixar(v.assinatura_cliente_url, "png"),
    baixar(v.assinatura_responsavel_url, "png"),
  ]);
  const linkVerificar = `${base}/verificar/${v.codigo_autenticidade}`;
  const qr = await QRCode.toDataURL(linkVerificar, { margin: 0, width: 240 });

  const endereco = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join("/"),
  ]
    .filter(Boolean)
    .join(" – ");
  const doc = e.cnpj_cpf ? (e.cnpj_cpf.length === 14 ? `CNPJ ${mascararDocumento(e.cnpj_cpf)}` : "") : "";
  const contato = [e.whatsapp && `WhatsApp ${e.whatsapp}`, e.telefone && e.telefone !== e.whatsapp && `Tel. ${e.telefone}`, e.site]
    .filter(Boolean)
    .join(" · ");
  const ipParcial = v.ip_conclusao ? String(v.ip_conclusao).replace(/(\d+)\.(\d+)$/, "*.*").replace(/:[0-9a-f]+:[0-9a-f]+$/i, ":*:*") : "—";
  const local = v.latitude != null && v.longitude != null ? `${Number(v.latitude).toFixed(3)}, ${Number(v.longitude).toFixed(3)}` : "Não permitida";
  const textoAceite = chegada
    ? "Declaro que conferi as fotos, as marcações e as informações deste termo, que mostram o estado do veículo no momento em que ele foi deixado na oficina."
    : "Declaro que conferi as fotos, as marcações e as informações deste termo, que mostram o estado do veículo no momento em que ele foi retirado da oficina.";
  const nomeProduto = plat?.nome_produto ?? "Vistoria Rápida";

  const documento = (
    <Document title={`Termo de Vistoria ${v.numero} - ${carro.placa}`} author={e.nome_fantasia ?? ""} creator={nomeProduto} language="pt-BR">
      <Page size="A4" style={s.pagina}>
        {/* Cabeçalho */}
        <View style={s.cabecalho}>
          {logo ? (
            <Image src={logo} style={s.logo} />
          ) : (
            <View style={[s.monograma, { backgroundColor: cor }]}>
              <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" }}>{iniciais(e.nome_fantasia ?? "?")}</Text>
            </View>
          )}
          <View style={s.oficina}>
            <Text style={s.oficinaNome}>{e.nome_fantasia}</Text>
            {doc ? <Text>{doc}</Text> : null}
            {endereco ? <Text>{endereco}</Text> : null}
            {contato ? <Text>{contato}</Text> : null}
          </View>
          <View style={s.titulo}>
            <Text style={s.tituloTexto}>TERMO DE VISTORIA</Text>
            <Text style={[s.tipo, { color: cor }]}>{chegada ? "CHEGADA DO VEÍCULO" : "ENTREGA DO VEÍCULO"}</Text>
            <Text style={{ marginTop: 3 }}>Nº {v.numero}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{v.codigo_autenticidade}</Text>
          </View>
        </View>
        <View style={[s.faixa, { backgroundColor: cor }]} />

        {/* Veículo e cliente */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Veículo e cliente</Text>
          <View style={s.grade}>
            <Campo rotulo="Veículo" valor={nomeVeiculo(v.tipo_veiculo ?? "carro")} />
            <Campo rotulo="Placa" valor={placaParaMostrar(carro.placa)} />
            <Campo rotulo="Marca / modelo" valor={[carro.marca, carro.modelo].filter(Boolean).join(" ")} />
            <Campo rotulo="Cor" valor={carro.cor} />
            <Campo rotulo="Km" valor={v.km != null ? Number(v.km).toLocaleString("pt-BR") : null} />
            <Campo rotulo="Combustível" valor={v.combustivel ? NOMES_COMBUSTIVEL[v.combustivel] : null} />
            <Campo rotulo="Data e hora" valor={dataHoraBR(v.concluida_em ?? v.iniciada_em)} />
            <Campo rotulo="Cliente" valor={cliente?.nome} />
            <Campo rotulo="WhatsApp do cliente" valor={cliente?.whatsapp ? formatarTelefone(cliente.whatsapp) : null} />
            <Campo rotulo={chegada ? "Recebido por" : "Entregue por"} valor={chegada ? v.recebido_por : v.liberado_por} />
            {v.chegou_guincho ? (
              <>
                <Campo rotulo="Chegou de guincho" valor="Sim" />
                <Campo rotulo="Placa do guincho" valor={v.placa_guincho ? placaParaMostrar(v.placa_guincho) : null} />
                <Campo rotulo="Motorista / prestador" valor={v.prestador_guincho} />
              </>
            ) : null}
          </View>
        </View>

        {/* Riscos e amassados */}
        <View style={s.secao} wrap={false}>
          <Text style={s.secaoTitulo}>Riscos e amassados</Text>
          <View style={s.vistas}>
            {VISTAS.map(({ id }) => {
              const desenho = desenhosDo(v.tipo_veiculo)[id as VistaAvaria];
              const marcas = (avarias ?? []).filter((a) => a.vista === id);
              return (
                <View key={id} style={s.vista}>
                  <View style={{ position: "relative", width: 170, height: (170 * ALTURA) / LARGURA }}>
                    <Svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} style={{ width: 170, height: (170 * ALTURA) / LARGURA }}>
                      <Desenho formas={desenho.formas} espelhar={desenho.espelhar} cor="#9aa3b2" />
                    </Svg>
                    {marcas.map((a) => (
                      <View
                        key={a.numero}
                        style={[s.marca, { left: (Number(a.x) / 100) * 170 - 6, top: (Number(a.y) / 100) * ((170 * ALTURA) / LARGURA) - 6, backgroundColor: corDoTipo(a.tipo) }]}
                      >
                        <Text style={s.marcaTexto}>{a.numero}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={s.vistaNome}>{nomeDaVista(id)}</Text>
                </View>
              );
            })}
          </View>
          {avarias && avarias.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {avarias.map((a) => (
                <View key={a.numero} style={s.linha}>
                  <Text style={{ width: 20, fontFamily: "Helvetica-Bold" }}>{a.numero}</Text>
                  <Text style={{ width: 80 }}>{nomeDaVista(a.vista)}</Text>
                  <Text style={{ width: 70, fontFamily: "Helvetica-Bold", color: corDoTipo(a.tipo) }}>{nomeDoTipo(a.tipo)}</Text>
                  <Text style={{ flex: 1 }}>{a.descricao ?? ""}</Text>
                  {a.nova_na_saida ? <Text style={{ color: "#c81e1e", fontFamily: "Helvetica-Bold" }}>NOVA</Text> : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 6 }}>Nenhum risco ou amassado registrado.</Text>
          )}
        </View>

        {/* Pneus e itens */}
        <View style={[s.secao, { flexDirection: "row", gap: 16 }]} wrap={false}>
          <View style={{ width: 170 }}>
            <Text style={s.secaoTitulo}>Pneus</Text>
            {pneusDoVeiculo(v.tipo_veiculo).map((p) => {
              const estado = pneus?.find((x) => x.posicao === p.posicao)?.estado;
              return (
                <View key={p.posicao} style={s.linha}>
                  <Text style={{ flex: 1 }}>{p.nome}</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: estado === "ruim" ? "#c81e1e" : "#0b1220" }}>
                    {estado === "bom" ? "BOM" : estado === "ruim" ? "RUIM" : estado === "ausente" ? "NÃO TEM" : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.secaoTitulo}>Itens do veículo</Text>
            <View style={s.grade}>
              {(itens ?? []).map((i) => (
                <View key={i.item_nome} style={[s.linha, { width: "50%", paddingRight: 8 }]}>
                  <Text style={{ flex: 1 }}>{i.item_nome}</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: i.tem ? "#0b1220" : "#c81e1e" }}>{i.tem ? "TEM" : "NÃO TEM"}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {v.observacoes ? (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Observações</Text>
            <Text style={{ lineHeight: 1.4 }}>{v.observacoes}</Text>
          </View>
        ) : null}

        {/* Fotos */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo} minPresenceAhead={200}>
            Fotos
          </Text>
          <View style={s.fotos}>
            {fotosOrdenadas.map((f, i) => {
              const img = imagensFotos[i];
              const titulo = tituloFoto(f.categoria);
              return (
                <View key={f.url} style={s.foto} wrap={false}>
                  {img ? <Image src={img} style={s.fotoImg} /> : <View style={[s.fotoImg, { backgroundColor: "#f1f3f6" }]} />}
                  <Text style={s.legenda}>
                    {titulo} · {dataHoraBR(f.data_hora)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {adendos && adendos.length > 0 ? (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Adendos (correções depois de concluir)</Text>
            {adendos.map((a, i) => (
              <Text key={i} style={{ marginBottom: 3 }}>
                {dataHoraBR(a.data_hora)} – {a.autor_nome ?? ""}: {a.texto}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Assinaturas e evidências */}
        <View style={s.secao} wrap={false}>
          <Text style={s.secaoTitulo}>Assinaturas</Text>
          <Text style={s.aceite}>{textoAceite}</Text>
          <View style={s.assinaturas}>
            <View style={s.assinatura}>
              {assinCliente ? <Image src={assinCliente} style={s.assinaturaImg} /> : <View style={{ height: 70 }} />}
              <View style={s.assinaturaLinha}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {v.assinatura_cliente_url ? v.nome_assinante_cliente : "Cliente não estava presente"}
                </Text>
                <Text style={{ color: cinza }}>
                  {v.assinatura_cliente_url
                    ? `Cliente${v.documento_assinante ? ` · Doc. ${mascararDocumento(v.documento_assinante) || v.documento_assinante}` : ""}`
                    : `Motivo: ${v.cliente_ausente_justificativa ?? ""}`}
                </Text>
              </View>
            </View>
            <View style={s.assinatura}>
              {assinResp ? <Image src={assinResp} style={s.assinaturaImg} /> : <View style={{ height: 70 }} />}
              <View style={s.assinaturaLinha}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{chegada ? v.recebido_por : v.liberado_por}</Text>
                <Text style={{ color: cinza }}>Responsável · {e.nome_fantasia}</Text>
              </View>
            </View>
          </View>

          <View style={s.evidencias}>
            <Image src={qr} style={{ width: 62, height: 62 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>Evidências do registro</Text>
              <Text>Concluída em: {v.concluida_em ? dataHoraBR(v.concluida_em) : "—"} (horário de Brasília)</Text>
              <Text>Localização aproximada: {local}</Text>
              <Text>Endereço de internet (parcial): {ipParcial}</Text>
              <Text>Código de autenticidade: {v.codigo_autenticidade}</Text>
              <Text>Confira se este documento é original: {linkVerificar}</Text>
            </View>
          </View>
        </View>

        <View style={s.rodape} fixed>
          <Text>
            {v.codigo_autenticidade} · Gerado em {dataHoraBR(new Date())} · Vistoria digital por {nomeProduto}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(documento);
}
