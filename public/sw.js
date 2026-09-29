/* Rotation Board offline shell — Safari-safe (no redirected responses). */
const CACHE = "rotation-board-v2";
const PRECACHE = [
  "/lineups",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
];

/** Rebuild Response so Safari won't reject redirected:true navigations. */
async function cleanResponse(response) {
  if (!response || !response.redirected) return response;
  const body = await response.clone().blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        for (const url of PRECACHE) {
          try {
            const res = await fetch(url, { redirect: "follow" });
            if (!res.ok) continue;
            await cache.put(url, await cleanResponse(res));
          } catch {
            // Precache is best-effort; skip failed URLs.
          }
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, strip redirect flag for Safari.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await cleanResponse(await fetch(request));
          if (network && network.ok) {
            const cache = await caches.open(CACHE);
            // Cache under the final path when possible; never store "/" redirect.
            const key =
              url.pathname === "/" ? "/lineups" : url.pathname + url.search;
            void cache.put(key, network.clone());
          }
          return network;
        } catch {
          const cache = await caches.open(CACHE);
          const fallback =
            (await cache.match(url.pathname + url.search)) ||
            (await cache.match("/lineups")) ||
            (await cache.match(request));
          if (fallback) return fallback;
          return new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const network = await cleanResponse(await fetch(request));
        if (network && network.ok) {
          const cache = await caches.open(CACHE);
          void cache.put(request, network.clone());
        }
        return network;
      } catch {
        return (
          cached ||
          new Response("", { status: 504, statusText: "Offline" })
        );
      }
    })(),
  );
});
