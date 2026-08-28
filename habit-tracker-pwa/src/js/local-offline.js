/**
 * 纯本地离线：Cache + IndexedDB 双份壳备份，兼容不同浏览器的 Cache 键名
 */

export const CACHE_NAME = 'habit-tracker-cache-v18';
const IDB_NAME = 'habit-tracker-offline';
const IDB_STORE = 'shell';
const IDB_KEY = 'index.html';

const SHELL_PATHS = ['./', './index.html'];

function scopeBase() {
  return new URL('.', location.href).href;
}

function resolveUrl(path) {
  return new URL(path, scopeBase()).href;
}

function shellUrls() {
  const base = scopeBase();
  const urls = [];
  for (const p of SHELL_PATHS) {
    const u = new URL(p, base);
    urls.push(u.href, u.pathname);
  }
  urls.push(new URL('/', base).origin + '/');
  return urls;
}

async function matchInCache(cache, urls) {
  for (const u of urls) {
    try {
      const hit = await cache.match(u);
      if (hit) return hit;
    } catch {
      /* ignore */
    }
  }

  try {
    const indexPath = resolveUrl('./index.html');
    const rootPath = resolveUrl('./');
    const keys = await cache.keys();
    for (const req of keys) {
      const url = req.url;
      if (url === indexPath || url === rootPath) {
        const hit = await cache.match(req);
        if (hit) return hit;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function verifyAppShellCached() {
  if (!('caches' in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const htmlRes = await matchInCache(cache, shellUrls());
    if (!htmlRes) {
      const idbHtml = await readShellFromIdb();
      return !!(idbHtml && idbHtml.includes('id="app"') && idbHtml.length > 8000);
    }

    const html = await htmlRes.text();
    const jsRef = html.match(/src="(\.\/assets\/index-[^"]+\.js)"/);
    if (jsRef) {
      const jsUrl = resolveUrl(jsRef[1]);
      return !!(await cache.match(jsUrl) || await cache.match(new URL(jsUrl).pathname));
    }

    return html.includes('id="app"') && html.length > 8000;
  } catch {
    return false;
  }
}

function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
  });
}

export async function persistShellToIdb(html) {
  if (!('indexedDB' in window)) return;
  try {
    const db = await openIdb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(IDB_STORE).put(html, IDB_KEY);
    });
    db.close();
  } catch (err) {
    console.warn('[offline] IDB 备份失败', err);
  }
}

export async function readShellFromIdb() {
  if (!('indexedDB' in window)) return null;
  try {
    const db = await openIdb();
    const html = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      tx.onerror = () => reject(tx.error);
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return typeof html === 'string' ? html : null;
  } catch {
    return null;
  }
}

/** 主线程写入 Cache（不依赖 SW 已接管） */
export async function warmAppShellCache() {
  if (!('caches' in window)) return false;

  const urls = [
    ...shellUrls(),
    new URL('sw.js', location.href).href,
    new URL('manifest.json', location.href).href,
    new URL('./assets/icons/icon-192x192.png', location.href).href,
    new URL('./assets/icons/icon-512x512.png', location.href).href,
    new URL('./assets/icons/badge.png', location.href).href,
  ];

  try {
    const cache = await caches.open(CACHE_NAME);
    let ok = false;

    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (!res.ok) return;
          await cache.put(url, res.clone());
          const path = new URL(url).pathname;
          if (path) await cache.put(path, res.clone());
          const indexPath = resolveUrl('./index.html');
          const rootPath = resolveUrl('./');
          if (url === indexPath || url === rootPath || path === new URL(indexPath).pathname || path === new URL(rootPath).pathname) ok = true;
        } catch {
          /* 离线时 fetch 失败，忽略 */
        }
      })
    );

    if (navigator.onLine) {
      try {
        const pageRes = await fetch(location.href, { cache: 'reload' });
        if (pageRes.ok) {
          const html = await pageRes.text();
          if (html.includes('id="app"') && html.length > 8000) {
            for (const u of shellUrls()) {
              await cache.put(u, new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              }));
            }
            await persistShellToIdb(html);
            ok = true;
          }
        }
      } catch {
        /* ignore */
      }
    }

    return ok || (await verifyAppShellCached());
  } catch (err) {
    console.warn('[offline] 预热缓存失败', err);
    return false;
  }
}

export function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
}
