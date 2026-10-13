// Torna um usuário ADMINISTRADOR da plataforma (superadmin).
// A pessoa precisa ter entrado no sistema pelo menos uma vez.
// Uso: npm run admin:tornar -- email@exemplo.com
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email.includes("@")) {
  console.log("Uso: npm run admin:tornar -- seu@email.com");
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

let usuario = null;
for (let pagina = 1; !usuario; pagina++) {
  const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
  if (error) {
    console.log("✗ Não consegui ler os usuários:", error.message);
    process.exit(1);
  }
  usuario = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break;
}
if (!usuario) {
  console.log(`✗ Não achei ${email}. Entre no sistema uma vez com esse e-mail e rode de novo.`);
  process.exit(1);
}

const { error } = await admin.from("superadmins").upsert({ user_id: usuario.id });
if (error) {
  console.log("✗ Não deu certo:", error.message);
  process.exit(1);
}
console.log(`✓ ${email} agora é administrador da plataforma.`);
