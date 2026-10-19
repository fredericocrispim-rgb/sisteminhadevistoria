// Service worker do Sisteminha de Vistoria.
// Necessário para o celular oferecer "Instalar app". Não guarda páginas em cache:
// tudo vem sempre da internet. Sem internet, mostra um aviso simples.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

const SEM_INTERNET = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem internet</title></head>
<body style="font-family:system-ui,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px;margin:0">
<div><p style="font-size:28px;font-weight:800;margin:0 0 8px">Sem internet</p><p style="font-size:18px;color:#5b6474;margin:0 0 24px">Confira o Wi-Fi ou os dados do celular.</p>
<button onclick="location.reload()" style="font-size:20px;font-weight:700;padding:16px 28px;border:0;border-radius:16px;background:#13865a;color:#fff">Tentar de novo</button></div></body></html>`;

self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    fetch(e.request).catch(
      () => new Response(SEM_INTERNET, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
