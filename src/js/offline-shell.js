/**
 * 离线壳层：注册 SW + 检测本地缓存；**不阻塞**应用启动（避免有页面却白屏）
 */

import {
  CACHE_NAME,
  verifyAppShellCached,
  warmAppShellCache,
  requestPersistentStorage,
} from './local-offline.js';

export { CACHE_NAME };

let swRegistration = null;

export function getSwRegistration() {
  return swRegistration;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function showBootError(message) {
  const loader = document.getElementById('loader');
  const err = document.getElementById('boot-error');
  if (loader) loader.style.display = 'none';
  if (err) {
    err.style.display = 'flex';
    const msg = err.querySelector('[data-boot-msg]');
    if (msg && message) msg.textContent = message;
  }
}

export function hideBootError() {
  const err = document.getElementById('boot-error');
  if (err) err.style.display = 'none';
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);

  return navigator.serviceWorker
    .register(new URL('sw.js', document.baseURI).href, { updateViaCache: 'none' })
    .then((reg) => {
      swRegistration = reg;
      return reg;
    })
    .catch((err) => {
      console.error('Service Worker 注册失败:', err);
      return null;
    });
}

/**
 * 始终允许启动应用；离线能力在后台预热，仅提示不阻断
 * @returns {Promise<{ ready: boolean, shellCached: boolean }>}
 */
export async function prepareOfflineShell() {
  requestPersistentStorage();

  const registerTask = registerServiceWorker();
  await Promise.race([registerTask, delay(1500)]);

  let shellCached = await verifyAppShellCached();

  if (!shellCached && navigator.onLine) {
    await Promise.race([
      (async () => {
        await registerTask;
        await Promise.race([navigator.serviceWorker?.ready, delay(3000)]);
        shellCached = await warmAppShellCache();
        if (!shellCached) shellCached = await verifyAppShellCached();
        return shellCached;
      })(),
      delay(6000).then(() => false),
    ]);
  }

  if (!shellCached && !navigator.onLine) {
    showBootError(
      '当前离线且本地缓存不完整。请先联网打开本应用一次，看到打卡页后再断网；或删除主屏幕图标后从 8787 重新安装。'
    );
  } else {
    hideBootError();
    if (navigator.onLine) {
      registerTask.then(() => warmAppShellCache());
    }
  }

  return { ready: true, shellCached: !!shellCached };
}
