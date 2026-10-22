// Service worker mínimo: si una navegación falla por falta de red, sirve la
// página "Sin conexión" (`app/offline`) en vez del error del navegador.
// No cachea páginas: con red, todo va a la red como siempre.
// Cambiar CACHE al tocar este archivo o la página offline para renovarla.
const CACHE = "maranatha-offline-v1";
const OFFLINE_URL = "/offline";

// Guarda la página offline y los assets que cita (CSS, JS, fuentes y la
// marca de `public/brand/`): sin ellos se vería en blanco, porque la
// animación de entrada depende del JS.
async function precacheOffline() {
  const cache = await caches.open(CACHE);
  const res = await fetch(OFFLINE_URL, { cache: "reload" });
  if (!res.ok) throw new Error(`offline page: ${res.status}`);
  const html = await res.clone().text();
  const assets = new Set(html.match(/\/(?:_next\/static|brand)\/[^"'\s)\\]+/g) ?? []);
  await cache.addAll([...assets]);
  await cache.put(OFFLINE_URL, res);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheOffline().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL, { cacheName: CACHE })
          .then((cached) => cached || Response.error()),
      ),
    );
    return;
  }

  // Assets con hash (CSS, JS, fuentes) y la marca: casi nunca cambian. Se
  // guardan al pasar para que la página offline tenga estilos sin red.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/")
  ) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            }),
        ),
      ),
    );
  }
});
