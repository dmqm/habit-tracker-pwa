import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_PORT = 8787;
const DEV_PORT = 5173;

/** 构建时生成预缓存清单（单文件 HTML 仅需缓存 index + 静态资源） */
function habitTrackerPrecache() {
  return {
    name: 'habit-tracker-precache',
    apply: 'build',
    closeBundle() {
      const distDir = path.join(rootDir, 'dist');
      const precache = new Set([
        '/',
        '/index.html',
        '/manifest.json',
        '/sw.js',
        '/sw-precache.js',
        '/assets/icons/badge.png',
        '/assets/icons/icon-192x192.png',
        '/assets/icons/icon-512x512.png',
      ]);

      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)) {
          precache.add(match[1]);
        }
        html = html.replace(
          /navigator\.serviceWorker\.register\(['"]\/sw\.js['"]/g,
          "navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href"
        );
        fs.writeFileSync(indexPath, html);
      }

      const assetsDir = path.join(distDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        for (const entry of fs.readdirSync(assetsDir, { withFileTypes: true })) {
          if (entry.isFile()) {
            precache.add(`/assets/${entry.name}`);
          } else if (entry.isDirectory() && entry.name === 'icons') {
            for (const icon of fs.readdirSync(path.join(assetsDir, 'icons'))) {
              precache.add(`/assets/icons/${icon}`);
            }
          }
        }
      }

      const sorted = [...precache].sort();
      const out = [
        '/* 构建自动生成 — 勿手动编辑 */',
        `self.PRECACHE_URLS = ${JSON.stringify(sorted)};`,
        'self.OFFLINE_CACHE_ONLY = true;',
        '',
      ].join('\n');
      fs.writeFileSync(path.join(distDir, 'sw-precache.js'), out);

      const manifestPath = path.join(distDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.start_url = './index.html';
        manifest.scope = './';
        manifest.id = 'habit-tracker-local';
        if (Array.isArray(manifest.icons)) {
          manifest.icons = manifest.icons.map((icon) => ({
            ...icon,
            src: icon.src?.startsWith('/') ? `.${icon.src}` : icon.src,
          }));
        }
        fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      }

      console.log(`[habit-tracker-precache] ${sorted.length} 个资源，预览端口请用 ${PREVIEW_PORT}`);
    },
  };
}

export default defineConfig({
  plugins: [
    viteSingleFile({ useRecommendedBuildConfig: true }),
    {
      name: 'habit-tracker-html-shell',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace('<html lang="zh-CN">', '<html lang="zh-CN" data-app-shell="singlefile">');
      },
    },
    habitTrackerPrecache(),
  ],
  server: {
    host: true,
    port: DEV_PORT,
    strictPort: true,
    https: false,
    open: false,
  },
  preview: {
    host: '0.0.0.0',
    port: PREVIEW_PORT,
    strictPort: true,
    https: false,
    open: false,
  },
});
