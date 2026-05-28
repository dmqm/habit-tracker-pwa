/* PWA Service Worker — Cache 优先 + 多路径键名 */

importScripts('sw-precache.js');

const CACHE_NAME = 'habit-tracker-cache-v18';

const DEFAULT_PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './sw-precache.js',
  './assets/icons/badge.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
];

const PRECACHE_URLS = Array.isArray(self.PRECACHE_URLS) && self.PRECACHE_URLS.length > 0
  ? self.PRECACHE_URLS
  : DEFAULT_PRECACHE;

const CACHE_ONLY = self.OFFLINE_CACHE_ONLY === true;

function resolveUrl(url) {
  return new URL(url, self.registration.scope).href;
}

function pathKeys(url) {
  const u = new URL(url, self.location.origin);
  const keys = [u.href, u.pathname];
  if (u.pathname !== '/') keys.push(u.origin + '/');
  return [...new Set(keys)];
}

async function putInCache(cache, request, response) {
  if (!response || !response.ok) return;
  for (const key of pathKeys(request.url || request)) {
    try {
      await cache.put(key, response.clone());
    } catch {
      /* ignore */
    }
  }
}

async function cacheUrl(cache, url) {
  const absolute = resolveUrl(url);
  try {
    const response = await fetch(absolute, { cache: 'reload' });
    await putInCache(cache, absolute, response);
  } catch (err) {
    console.warn('[Service Worker] 预缓存跳过:', absolute, err);
  }
}

async function hasCriticalShell(cache) {
  const tryUrls = [
    './index.html', './',
  ];

  for (const u of tryUrls) {
    const hit = await cache.match(resolveUrl(u));
    if (hit) {
      const html = await hit.text();
      if (html.includes('id="app"') && html.length > 8000) return true;
    }
  }

  return false;
}

async function precacheAll() {
  const cache = await caches.open(CACHE_NAME);
  const urls = [...new Set(PRECACHE_URLS.map(resolveUrl))];
  await Promise.allSettled(urls.map((url) => cacheUrl(cache, url)));
  return hasCriticalShell(cache);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheAll().then((ok) => {
      if (ok) return self.skipWaiting();
      console.error('[Service Worker] 预缓存不完整，保留旧版本');
      throw new Error('precache incomplete');
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const newCache = await caches.open(CACHE_NAME);
      const ok = await hasCriticalShell(newCache);

      if (ok) {
        const names = await caches.keys();
        await Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        );
      }

      await self.clients.claim();
    })()
  );
});

function offlineResponse() {
  return new Response(
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小日常</title></head><body style="font-family:-apple-system,sans-serif;background:#08090d;color:#fff;padding:24px;text-align:center"><p>本地缓存未就绪</p><p style="color:#888;font-size:14px">请联网打开一次，待打卡页出现后再断网。</p><div style="margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button onclick="location.reload()" style="padding:10px 20px">重试</button><button onclick="caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}).then(function(){return navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister()}))})}).then(function(){location.reload(true)})" style="padding:10px 20px">清缓存重启</button></div></body></html>',
    {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

async function matchCached(cache, request) {
  const candidates = [
    request,
    request.url,
    ...pathKeys(request.url),
  ];

  for (const key of candidates) {
    try {
      const hit = await cache.match(key);
      if (hit) return hit;
    } catch {
      /* ignore */
    }
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    return matchCached(cache, new Request(resolveUrl('./index.html')));
  }

  return null;
}

async function respondFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  const isNavigate = request.mode === 'navigate' || request.destination === 'document';

  if (isNavigate) {
    if (!CACHE_ONLY) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await putInCache(cache, request, response);
          return response;
        }
        console.warn('[Service Worker] 网络响应异常，回退缓存:', request.url, response.status);
      } catch (err) {
        console.warn('[Service Worker] 网络请求失败，回退缓存:', request.url, err);
      }
    }
    const cached = await matchCached(cache, request);
    if (cached) return cached;
    return offlineResponse();
  }

  const cached = await matchCached(cache, request);
  if (cached) return cached;

  if (!CACHE_ONLY) {
    try {
      const response = await fetch(request);
      await putInCache(cache, request, response);
      return response;
    } catch (err) {
      console.warn('[Service Worker] 开发模式拉取失败:', request.url, err);
    }
  }

  return offlineResponse();
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(respondFromCache(event.request));
});
