/* Black Pater member space: notifications only (no caching, no network
 * interception). Scope: /espace-client. A notification never carries the
 * content; a tap opens (or focuses) the right page of the space. */
'use strict';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function safePath(url) {
  return typeof url === 'string' && /^\/espace-client(\?view=[a-z]+)?$/.test(url) ? url : '/espace-client';
}

self.addEventListener('push', function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  var title = typeof data.title === 'string' && data.title ? data.title.slice(0, 80) : 'Black Pater';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body.slice(0, 200) : '',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-96x96.png',
      tag: typeof data.tag === 'string' ? data.tag.slice(0, 40) : 'bp',
      renotify: true,
      data: { url: safePath(data.url) }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = new URL(safePath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(self.location.origin + '/espace-client') === 0 && 'focus' in c) {
          if ('navigate' in c) c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
