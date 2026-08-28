/* 应用核心入口 — 先启动 UI，后台巩固离线缓存 */

import './css/variables.css';
import './css/style.css';
import './css/components.css';

import { prepareOfflineShell, showBootError } from './js/offline-shell.js';
import { warmAppShellCache } from './js/local-offline.js';
import { store } from './js/store.js';
import { ui } from './js/ui.js';
import { pwa } from './js/pwa.js';

async function bootstrap() {
  try {
    await prepareOfflineShell();

    store.init();
    ui.init();

    store.subscribe((state) => {
      ui.render(state);
    });

    ui.render(store.getState());
    pwa.init();

    if (navigator.onLine) {
      window.addEventListener('load', () => {
        warmAppShellCache().then((ok) => {
          if (ok) console.log('[offline] 本地壳缓存已就绪，可断网使用');
        });
      }, { once: true });
      if (document.readyState === 'complete') {
        warmAppShellCache();
      }
    }

    console.log('☘️ 小日常打卡应用已就绪');
  } catch (err) {
    console.error('应用启动失败:', err);
    showBootError('应用启动异常：' + (err?.message || '未知错误'));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => bootstrap());
} else {
  bootstrap();
}
