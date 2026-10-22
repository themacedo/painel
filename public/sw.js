// Service worker só do push dos avisos de sync: não guarda nada do painel no aparelho (sem cache, sem fetch).
// O aviso chega só com "Sync concluído"; o detalhe fica no painel, atrás do login.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {}; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Sync concluído", {
    body: d.corpo || "Toque para ver", tag: d.tag || "sync", renotify: true,
    icon: "/icones/icone-192.png", badge: "/icones/icone-192.png", data: { url: d.url || "/movimentos" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/movimentos", self.location.origin).href;
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const aberta = abertas.find((c) => c.url.startsWith(self.location.origin));
    if (aberta) { await aberta.focus(); return aberta.navigate(url); }
    return self.clients.openWindow(url);
  })());
});
