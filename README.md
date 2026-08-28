# PWA Suite — 个人 PWA 工具集

将多个本地优先的 Progressive Web App 聚合在一个 monorepo 中，统一部署到 GitHub Pages。

## 在线访问

部署后：

| 入口 | 地址 |
|------|------|
| **应用中心（门户）** | https://dmqm.github.io/pwa-suite/ |
| 小日常打卡 | https://dmqm.github.io/pwa-suite/habit-tracker-pwa/ |
| 我的物品 | https://dmqm.github.io/pwa-suite/my-things-pwa/ |
| ImageHub | https://dmqm.github.io/pwa-suite/image-hub-pwa/ |

## 包含的应用

| 应用 | 目录 | 说明 |
|------|------|------|
| 小日常打卡 | `habit-tracker-pwa/` | 习惯追踪（保留较新版本，含热力图、加密备份） |
| 我的物品 | `my-things-pwa/` | 物品收纳与保质期管理 |
| ImageHub | `image-hub-pwa/` | 搜图、AI 生图、图像处理 |

> `everyday-habit-pwa`（极简版习惯打卡）功能与 `habit-tracker-pwa` 重叠，未纳入本仓库。

## 仓库结构

```text
pwa-suite/
├── index.html              # 应用中心门户
├── manifest.json / sw.js   # 门户 PWA
├── css/ js/ icons/
├── scripts/build-site.sh   # 统一构建脚本
├── habit-tracker-pwa/      # 子应用源码
├── image-hub-pwa/
├── my-things-pwa/
└── .github/workflows/deploy.yml
```

## 本地开发

### 门户（静态）

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000/
```

### 子应用（独立开发）

```bash
npm run dev:habit    # 习惯打卡 → :5173
npm run dev:image    # ImageHub → :5173
npm run dev:things   # 我的物品 → :5173
```

### 完整构建（与 CI 一致）

```bash
npm run build
# 产物在 _site/，可用 npx serve _site 预览
```

## 部署

1. 推送本仓库到 `main` 分支（建议将 GitHub 仓库重命名为 `pwa-suite`）
2. 在仓库 **Settings → Actions → General** 中开启 **Read and write permissions**
3. 在 **Settings → Pages** 中选择 `gh-pages` 分支、`/ (root)`

## 从旧仓库迁移

若之前使用独立仓库部署，合并后旧链接将失效，需更新书签和主屏幕快捷方式：

| 旧地址 | 新地址 |
|--------|--------|
| `dmqm.github.io/habit-tracker-pwa/` | `dmqm.github.io/pwa-suite/habit-tracker-pwa/` |
| `dmqm.github.io/my-things-pwa/` | `dmqm.github.io/pwa-suite/my-things-pwa/` |
| `dmqm.github.io/image-hub-pwa/` | `dmqm.github.io/pwa-suite/image-hub-pwa/` |
| `dmqm.github.io/everyday-habit-pwa/` | 已弃用，请使用 `habit-tracker-pwa` |

各应用数据存储在浏览器本地，迁移仓库**不会**自动迁移用户数据；可通过各应用内的 JSON 导出/导入功能迁移。

## 许可证

各子应用保留原有许可证。monorepo 门户部分可自由使用。
