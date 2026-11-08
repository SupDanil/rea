// Push notification handler for shit кофе PWA

self.addEventListener('push', (event) => {
  let data = {
    title: 'shit кофе',
    body: 'Новое уведомление о вашем заказе',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    url: '/',
    tag: 'order-status',
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch {
      const text = event.data.text()
      if (text) data.body = text
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-96.png',
    tag: data.tag || 'order-status',
    renotify: true,
    data: {
      url: data.url || '/',
    },
    vibrate: [150, 80, 150],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const rawUrl = event.notification.data?.url || '/'
  const targetUrl = new URL(rawUrl, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      // 1. Try to find a client that is already on the target URL
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }

      // 2. Focus any client belonging to our origin, navigate and postMessage
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          const focusedClient = await client.focus()
          if (focusedClient) {
            try {
              focusedClient.postMessage({ type: 'PUSH_NAVIGATE', url: targetUrl })
            } catch {}
            if ('navigate' in focusedClient && focusedClient.url !== targetUrl) {
              await focusedClient.navigate(targetUrl)
            }
          }
          return focusedClient
        }
      }

      // 3. If no window is currently open, open a new window in PWA scope
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
