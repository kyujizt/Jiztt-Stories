importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");
/**
 * Service Worker configuration for the Story App.
 * @module ServiceWorker
 * @version 1.0
 */

const { precaching, routing, strategies } = workbox;

// ================= CACHE NAMES =================
const CACHE_NAME = "story-app-v1";

// ================= PRECACHE ====================
// Precache file penting (dapat ditambah jika perlu)
precaching.precacheAndRoute([
  { url: "/", revision: null },
  { url: "/index.html", revision: null },
  { url: "/favicon.png", revision: null },
  { url: "/images/logo.png", revision: null },
  { url: "/images/icons/icon-192x192.png", revision: null },
  { url: "/images/icons/icon-512x512.png", revision: null },
  { url: "/manifest.json", revision: null },
]);

// ================= RUNTIME CACHING =============
routing.registerRoute(
  ({ request }) => request.destination === "image",
  new strategies.CacheFirst({
    cacheName: "story-app-images",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

routing.registerRoute(
  ({ request }) => request.destination === "script" || request.destination === "style",
  new strategies.StaleWhileRevalidate({
    cacheName: "story-app-static",
  })
);

// ✅ 🔥 **Tambahkan caching untuk API stories**
routing.registerRoute(
  ({ url }) => url.href.includes("/v1/stories"),
  new strategies.StaleWhileRevalidate({
    cacheName: "story-app-api",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50, // Maksimal 50 respons API disimpan
        maxAgeSeconds: 7 * 24 * 60 * 60, // Simpan selama 7 hari
      }),
    ],
  })
);

// ================= NOTIFICATION HANDLING ============
let lastNotifiedStoryId = null;

// Listen for story API responses to trigger notifications
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/v1/stories')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // Clone the response since we need to use it twice
          const responseClone = response.clone();
          
          try {
            const data = await responseClone.json();
            if (data && data.stories && data.stories.length > 0) {
              const latestStory = data.stories[0];
              
              // Check if this is a new story we haven't notified about
              if (latestStory.id !== lastNotifiedStoryId) {
                lastNotifiedStoryId = latestStory.id;
                
                // Cek preferensi pengguna sebelum mengirim notifikasi
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                  client.postMessage({
                    type: 'CHECK_NOTIFICATION_PREFERENCE',
                    story: {
                      id: latestStory.id,
                      name: latestStory.name,
                      description: latestStory.description,
                      photoUrl: latestStory.photoUrl
                    }
                  });
                });
              }
            }
          } catch (error) {
            console.error('Error processing story data:', error);
          }
          
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Untuk request lain, gunakan strategi caching default
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request).then((networkResponse) => {
            // Hanya cache response yang berhasil
            if (networkResponse && networkResponse.status === 200) {
              return caches.open("story-cache").then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match("/fallback.json"); // 🔥 Gunakan fallback jika semua gagal
        })
    );
  }
});

// Handle messages from the client - satu event listener untuk semua jenis pesan
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, image } = event.data;
    
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      image: image || '/images/logo.png',
      data: {
        url: url || '/'
      }
    });
  }
});

// =============== HANDLE NOTIF CLICK ============
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
