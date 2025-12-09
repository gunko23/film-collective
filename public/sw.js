const CACHE_NAME = "film-collective-v1"
const urlsToCache = ["/", "/globals.css"]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone()

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        // If network fails, try to return from cache
        return caches.match(event.request)
      }),
  )
})

self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192.jpg",
    badge: "/icon-192.jpg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
      notificationId: data.notificationId,
    },
    actions: [
      { action: "open", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
    tag: data.tag || "default",
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(data.title || "Film Collective", options))
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "dismiss") return

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})
