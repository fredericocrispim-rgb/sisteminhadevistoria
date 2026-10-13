// Confere se as chaves do .env.local estão certas e se o banco foi criado.
// Uso: npm run banco:testar
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secreta = process.env.SUPABASE_SECRET_KEY;

const faltando = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !publica && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  !secreta && "SUPABASE_SECRET_KEY",
].filter(Boolean);
if (faltando.length) {
  console.log("✗ Falta preencher no .env.local:", faltando.join(", "));
  process.exit(1);
}

const db = createClient(url, publica);
const { data, error } = await db.from("planos").select("nome").order("ordem");
if (error) {
  if (error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message)) {
    console.log("✓ Conectou no Supabase.");
    console.log("✗ Mas as tabelas ainda não foram criadas (falta aplicar o banco).");
  } else {
    console.log("✗ Não conectou. Confira a URL e a chave publishable.", error.message);
  }
  process.exit(1);
}
const admin = createClient(url, secreta, { auth: { persistSession: false } });
const { error: erroAdmin } = await admin.from("superadmins").select("user_id").limit(1);
if (erroAdmin) {
  console.log("✗ A chave secreta (SUPABASE_SECRET_KEY) não funcionou:", erroAdmin.message);
  process.exit(1);
}
console.log("✓ Tudo certo! Banco conectado. Planos:", data.map((p) => p.nome).join(", "));
