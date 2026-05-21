/* PWA 生命周期与核心能力控制中心 (Service Worker, Install, Notifications) */

import { store } from './store.js';
import { getSwRegistration } from './offline-shell.js';

const APP_ICON = '/assets/icons/icon-192x192.png';

let deferredInstallPrompt = null;

export const pwa = {
  init() {
    this.listenForSwUpdates();

    // 1. 监听安装事件
    this.listenToInstallPrompt();

    // 3. 初始化设置页面的安装按钮状态
    this.initInstallUI();

    // 4. 监听系统通知授权状态
    this.initNotificationUI();
  },

  listenForSwUpdates() {
    const attach = (reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (!navigator.onLine) return;
            if (confirm('应用有新版本可用，是否立即刷新更新？')) {
              window.location.reload();
            }
          }
        });
      });
    };

    const reg = getSwRegistration();
    if (reg) {
      attach(reg);
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(attach).catch(() => {});
    }
  },

  // 监听浏览器安装提示事件 (beforeinstallprompt)
  listenToInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止浏览器默认弹窗，由我们在应用中受控显示
      e.preventDefault();
      deferredInstallPrompt = e;
      
      // 在设置页面显示“安装应用”按钮
      this.updateInstallBtnVisibility(true);
    });

    window.addEventListener('appinstalled', (e) => {
      console.log('应用已被成功安装到桌面/主屏幕！');
      deferredInstallPrompt = null;
      this.updateInstallBtnVisibility(false);
    });
  },

  // 更新安装按钮的显示状态
  updateInstallBtnVisibility(visible) {
    const installRow = document.getElementById('install-row');
    if (installRow) {
      installRow.style.display = visible ? 'flex' : 'none';
    }
  },

  initInstallUI() {
    const btnInstall = document.getElementById('btn-install');
    if (btnInstall) {
      btnInstall.addEventListener('click', () => {
        if (!deferredInstallPrompt) {
          alert('当前环境无法弹出安装对话框。若尚未安装，请在浏览器菜单中选择「添加到主屏幕」或「安装应用」。');
          return;
        }
        
        deferredInstallPrompt.prompt();
        
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('用户接受了 PWA 安装提示');
          } else {
            console.log('用户拒绝了 PWA 安装提示');
          }
          deferredInstallPrompt = null;
          this.updateInstallBtnVisibility(false);
        });
      });
    }

    // 默认隐藏安装按钮，仅当 beforeinstallprompt 触发时才展示
    if (window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches) {
      this.updateInstallBtnVisibility(false);
    }
  },

  // 初始化消息通知逻辑
  initNotificationUI() {
    const switchNotify = document.getElementById('switch-notifications');
    const state = store.getState();
    
    // 如果本地数据存储为开启状态，需要检测实际授权情况
    if (switchNotify) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted' && state.notifications) {
          switchNotify.classList.add('active');
        } else {
          switchNotify.classList.remove('active');
          if (state.notifications) {
            // 权限实际不存在，强制重置状态
            store.setNotifications(false);
          }
        }
      } else {
        // 浏览器完全不支持
        const notifyRow = document.getElementById('notify-row');
        if (notifyRow) {
          notifyRow.style.opacity = '0.5';
          notifyRow.querySelector('.settings-item-desc').textContent = '您的浏览器/设备不支持推送通知';
        }
      }

      // 点击切换开关
      switchNotify.addEventListener('click', () => {
        if (!('Notification' in window)) {
          alert('非常抱歉，当前浏览器或环境不支持系统通知。');
          return;
        }

        const isCurrentlyActive = switchNotify.classList.contains('active');

        if (!isCurrentlyActive) {
          // 请求授权
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              switchNotify.classList.add('active');
              store.setNotifications(true);
              
              // 触发一个成功的提示通知
              this.showTestNotification();
            } else {
              alert('您拒绝了系统通知权限，请在浏览器或系统设置中手动开启通知。');
            }
          });
        } else {
          // 关闭通知
          switchNotify.classList.remove('active');
          store.setNotifications(false);
        }
      });
    }
  },

  // 发送一条测试打卡提示通知
  showTestNotification() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification('小日常打卡开启成功！', {
          body: '每天我都会按时提醒您进行习惯打卡哦 🌱',
          icon: APP_ICON,
          badge: '/assets/icons/badge.png',
          vibrate: [200, 100, 200],
          tag: 'habit-welcome',
          renotify: true
        });
      });
    }
  }
};
