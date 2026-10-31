import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Rotina diária (Vercel Cron, ver vercel.json): apaga os arquivos de vídeo com mais de
 * plataforma.dias_guardar_video (1 ano). O registro do vídeo e o código SHA-256 continuam,
 * e o termo em PDF continua válido. A Vercel manda "Authorization: Bearer CRON_SECRET".
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = criarClienteAdmin();
  const { data: plat } = await admin.from("plataforma").select("*").single();
  const dias = Number(plat?.dias_guardar_video ?? 365);
  const limite = new Date(Date.now() - dias * 86400000).toISOString();

  const { data: velhos, error } = await admin
    .from("vistoria_videos")
    .select("id, url")
    .is("apagado_em", null)
    .lt("data_hora", limite)
    .limit(500);
  if (error) return NextResponse.json({ ok: false, erro: "sem tabela de vídeos" }, { status: 200 });
  if (!velhos?.length) return NextResponse.json({ ok: true, apagados: 0 });

  const { error: erroArquivos } = await admin.storage.from("vistorias").remove(velhos.map((v) => v.url));
  if (erroArquivos) {
    console.error("Rotina de vídeos: falha ao apagar arquivos", erroArquivos);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  await admin
    .from("vistoria_videos")
    .update({ apagado_em: new Date().toISOString() })
    .in(
      "id",
      velhos.map((v) => v.id),
    );
  return NextResponse.json({ ok: true, apagados: velhos.length });
}
