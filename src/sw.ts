/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

interface DojoPushPayload {
  title?: string;
  body?: string;
  tag?: string;
  url?: string;
}

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload: DojoPushPayload;

  try {
    payload = event.data.json() as DojoPushPayload;
  } catch {
    payload = { body: event.data.text() };
  }

  const targetUrl = payload.url?.startsWith('/') ? payload.url : '/';
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Planning du dojo', {
      body: payload.body,
      tag: payload.tag,
      icon: '/icons/dojo-icon-192.png',
      badge: '/icons/dojo-icon-32.png',
      data: { url: targetUrl },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data as { url?: string } | undefined;
  const targetPath = notificationData?.url?.startsWith('/') ? notificationData.url : '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (windowClients) => {
        const existingClient = windowClients.find((client) => client.url.startsWith(self.location.origin));

        if (existingClient) {
          await existingClient.navigate(targetUrl);
          return existingClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
