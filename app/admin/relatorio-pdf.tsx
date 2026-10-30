import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

/** Uma linha do relatório, já em texto (montada pelo painel com os filtros da tela). */
export type LinhaRelatorio = {
  nome: string;
  cidade: string | null;
  responsavel: string;
  whatsapp: string;
  situacao: string;
  pagamento: string;
  ultimoUso: string;
  vistorias: string;
  valor: string;
  cadastro: string;
  vendedor: string;
};

const cinza = "#5b6474";
const borda = "#d5dbe3";

const s = StyleSheet.create({
  pagina: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 28, fontSize: 8, fontFamily: "Helvetica", color: "#0b1220" },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 },
  titulo: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 8, color: cinza, marginTop: 2 },
  faixa: { height: 3, backgroundColor: "#2563eb", borderRadius: 2, marginBottom: 10 },
  filtros: { fontSize: 7.5, color: cinza, marginBottom: 10, lineHeight: 1.4 },
  resumo: { flexDirection: "row", borderWidth: 0.5, borderColor: borda, borderRadius: 4, marginBottom: 12 },
  numero: { flex: 1, padding: 8, borderRightWidth: 0.5, borderRightColor: borda },
  numeroRotulo: { fontSize: 7, color: cinza, textTransform: "uppercase" },
  numeroValor: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 2 },
  cabecalho: { flexDirection: "row", backgroundColor: "#f1f4f8", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: borda },
  linha: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: borda },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: cinza, textTransform: "uppercase", paddingHorizontal: 4 },
  td: { paddingHorizontal: 4 },
  forte: { fontFamily: "Helvetica-Bold" },
  miudo: { fontSize: 7, color: cinza, marginTop: 1 },
  rodape: { position: "absolute", bottom: 18, left: 28, right: 28, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: cinza },
});

// Larguras das colunas (somam 100%)
const COL = { oficina: "22%", responsavel: "17%", situacao: "13%", pagamento: "11%", uso: "10%", vistorias: "8%", valor: "9%", cadastro: "10%" } as const;

/** PDF com a lista de oficinas que está na tela do administrador. */
export function RelatorioOficinasPdf({
  produto,
  filtros,
  oficinas,
  resumo,
}: {
  produto: string;
  filtros: string[];
  oficinas: LinhaRelatorio[];
  resumo: { oficinas: number; mensalidades: string; vistoriasMes: number };
}) {
  const geradoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Document title={`Oficinas - ${produto}`} author={produto}>
      <Page size="A4" orientation="landscape" style={s.pagina}>
        <View style={s.topo}>
          <View>
            <Text style={s.titulo}>Relatório de oficinas</Text>
            <Text style={s.sub}>{produto}</Text>
          </View>
          <Text style={s.sub}>Gerado em {geradoEm}</Text>
        </View>
        <View style={s.faixa} />
        <Text style={s.filtros}>{filtros.join("   ·   ")}</Text>

        <View style={s.resumo}>
          <View style={s.numero}>
            <Text style={s.numeroRotulo}>Oficinas na lista</Text>
            <Text style={s.numeroValor}>{resumo.oficinas}</Text>
          </View>
          <View style={s.numero}>
            <Text style={s.numeroRotulo}>Mensalidades (pagantes)</Text>
            <Text style={s.numeroValor}>{resumo.mensalidades}</Text>
          </View>
          <View style={[s.numero, { borderRightWidth: 0 }]}>
            <Text style={s.numeroRotulo}>Vistorias no mês</Text>
            <Text style={s.numeroValor}>{resumo.vistoriasMes}</Text>
          </View>
        </View>

        <View style={s.cabecalho} fixed>
          <Text style={[s.th, { width: COL.oficina }]}>Oficina</Text>
          <Text style={[s.th, { width: COL.responsavel }]}>Responsável</Text>
          <Text style={[s.th, { width: COL.situacao }]}>Situação</Text>
          <Text style={[s.th, { width: COL.pagamento }]}>Pagamento</Text>
          <Text style={[s.th, { width: COL.uso }]}>Último uso</Text>
          <Text style={[s.th, { width: COL.vistorias, textAlign: "right" }]}>Vistorias</Text>
          <Text style={[s.th, { width: COL.valor, textAlign: "right" }]}>Mensal</Text>
          <Text style={[s.th, { width: COL.cadastro }]}>Cadastro</Text>
        </View>
        {oficinas.map((o, i) => (
          <View key={i} style={s.linha} wrap={false}>
            <View style={[s.td, { width: COL.oficina }]}>
              <Text style={s.forte}>{o.nome}</Text>
              {o.cidade ? <Text style={s.miudo}>{o.cidade}</Text> : null}
            </View>
            <View style={[s.td, { width: COL.responsavel }]}>
              <Text>{o.responsavel || "sem nome"}</Text>
              {o.whatsapp ? <Text style={s.miudo}>{o.whatsapp}</Text> : null}
            </View>
            <Text style={[s.td, { width: COL.situacao }]}>{o.situacao}</Text>
            <Text style={[s.td, { width: COL.pagamento }]}>{o.pagamento}</Text>
            <Text style={[s.td, { width: COL.uso }]}>{o.ultimoUso}</Text>
            <Text style={[s.td, { width: COL.vistorias, textAlign: "right" }]}>{o.vistorias}</Text>
            <Text style={[s.td, s.forte, { width: COL.valor, textAlign: "right" }]}>{o.valor}</Text>
            <View style={[s.td, { width: COL.cadastro }]}>
              <Text>{o.cadastro}</Text>
              {o.vendedor ? <Text style={s.miudo}>Vend.: {o.vendedor}</Text> : null}
            </View>
          </View>
        ))}

        <View style={s.rodape} fixed>
          <Text>{produto} · Relatório interno</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Uma linha do relatório de comissões, já em texto. */
export type LinhaComissao = {
  vendedor: string;
  oficina: string;
  recebidoEm: string;
  valorRecebido: string;
  percentual: string;
  valor: string;
  situacao: string;
  pagaEm: string;
};

const COL_C = { vendedor: "18%", oficina: "24%", recebidoEm: "11%", valorRecebido: "12%", percentual: "6%", valor: "11%", situacao: "9%", pagaEm: "9%" } as const;

/** PDF com as comissões que estão na tela (aba Comissões do administrador). */
export function RelatorioComissoesPdf({
  produto,
  filtros,
  comissoes,
  resumo,
}: {
  produto: string;
  filtros: string[];
  comissoes: LinhaComissao[];
  resumo: { quantidade: number; total: string; aPagar: string; pagas: string };
}) {
  const geradoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Document title={`Comissões - ${produto}`} author={produto}>
      <Page size="A4" orientation="landscape" style={s.pagina}>
        <View style={s.topo}>
          <View>
            <Text style={s.titulo}>Relatório de comissões</Text>
            <Text style={s.sub}>{produto}</Text>
          </View>
          <Text style={s.sub}>Gerado em {geradoEm}</Text>
        </View>
        <View style={s.faixa} />
        <Text style={s.filtros}>{filtros.join("   ·   ")}</Text>

        <View style={s.resumo}>
          <View style={s.numero}>
            <Text style={s.numeroRotulo}>Comissões na lista</Text>
            <Text style={s.numeroValor}>{resumo.quantidade}</Text>
          </View>
          <View style={s.numero}>
            <Text style={s.numeroRotulo}>Total</Text>
            <Text style={s.numeroValor}>{resumo.total}</Text>
          </View>
          <View style={s.numero}>
            <Text style={s.numeroRotulo}>A pagar</Text>
            <Text style={s.numeroValor}>{resumo.aPagar}</Text>
          </View>
          <View style={[s.numero, { borderRightWidth: 0 }]}>
            <Text style={s.numeroRotulo}>Já pagas</Text>
            <Text style={s.numeroValor}>{resumo.pagas}</Text>
          </View>
        </View>

        <View style={s.cabecalho} fixed>
          <Text style={[s.th, { width: COL_C.vendedor }]}>Vendedor</Text>
          <Text style={[s.th, { width: COL_C.oficina }]}>Oficina</Text>
          <Text style={[s.th, { width: COL_C.recebidoEm }]}>Recebido em</Text>
          <Text style={[s.th, { width: COL_C.valorRecebido, textAlign: "right" }]}>Valor recebido</Text>
          <Text style={[s.th, { width: COL_C.percentual, textAlign: "right" }]}>%</Text>
          <Text style={[s.th, { width: COL_C.valor, textAlign: "right" }]}>Comissão</Text>
          <Text style={[s.th, { width: COL_C.situacao }]}>Situação</Text>
          <Text style={[s.th, { width: COL_C.pagaEm }]}>Paga em</Text>
        </View>
        {comissoes.map((c, i) => (
          <View key={i} style={s.linha} wrap={false}>
            <Text style={[s.td, s.forte, { width: COL_C.vendedor }]}>{c.vendedor}</Text>
            <Text style={[s.td, { width: COL_C.oficina }]}>{c.oficina}</Text>
            <Text style={[s.td, { width: COL_C.recebidoEm }]}>{c.recebidoEm}</Text>
            <Text style={[s.td, { width: COL_C.valorRecebido, textAlign: "right" }]}>{c.valorRecebido}</Text>
            <Text style={[s.td, { width: COL_C.percentual, textAlign: "right" }]}>{c.percentual}</Text>
            <Text style={[s.td, s.forte, { width: COL_C.valor, textAlign: "right" }]}>{c.valor}</Text>
            <Text style={[s.td, { width: COL_C.situacao }]}>{c.situacao}</Text>
            <Text style={[s.td, { width: COL_C.pagaEm }]}>{c.pagaEm}</Text>
          </View>
        ))}

        <View style={s.rodape} fixed>
          <Text>{produto} · Relatório interno</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
