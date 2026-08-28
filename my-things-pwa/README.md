# 我的物品 PWA (My Things)

一款专为个人物品整理与收纳设计的渐进式 Web 应用 (PWA)。灵感来源于 iOS 同名应用，采用现代 iOS 设计语言设计，支持 **100% 离线使用**，无需后端服务器，数据完全保存在您的本地浏览器中。

---

## ✨ 核心特性

- 📱 **iOS 质感视觉**：完美的毛玻璃效果（Glassmorphism）、自适应系统深色/浅色模式、弹性交互动画与移动端安全区域适配（Safe Area）。
- 🔌 **离线优先 (Offline-First)**：采用 PWA Service Worker 预缓存全部静态资源，搭载 `IndexedDB` 本地数据库，无网环境也可正常登记、修改和浏览物品。
- 📊 **多维数据统计**：
  - 概览看板展示物品总数、分类款式、资产总估值。
  - 保质期智能监控，针对“过期”和“30天内临近到期”的食品、药品等物品发出颜色预警。
  - 分类物品占比统计。
- 📦 **层级空间收纳**：支持无限层级的虚拟收纳空间管理（例如：`家 > 客厅 > 电视柜 > 第二抽屉`），并能够快速查看某空间层级下的所有物品。
- 🔍 **高效检索与过滤**：支持关键词全文搜索（匹配名称、备注、标签），以及按分类、空间和自定义标签（Tag）等多维度联合筛选。
- 📸 **图片录入与智能压缩**：允许为物品拍照或上传照片。在保存至本地数据库前，自动在客户端利用 Canvas 进行图片比例自适应与画质压缩（单张体积控制在 200KB 以内），防范浏览器存储超额。
- 💾 **数据备份与安全**：提供一键“导出 JSON”备份和“导入 JSON”恢复功能，支持用户自主在多台设备迁移数据。

---

## 🛠️ 技术栈

- **核心框架**：React 19 + TypeScript + Vite 8
- **本地存储**：IndexedDB (使用 **Dexie.js** 及其 `dexie-react-hooks` 响应式查询绑定)
- **图标系统**：Lucide React (线条风格 iOS 拟物图标)
- **PWA 支持**：`vite-plugin-pwa` (自动化 Service Worker 及清单管理)
- **部署发布**：GitHub Actions Workflow + GitHub Pages 自动化分发

---

## 🚀 快速开始

### 本地运行

1. **克隆项目并进入目录**：
   ```bash
   cd my-things-pwa
   ```

2. **安装依赖项**：
   ```bash
   npm install
   ```

3. **运行开发服务器**：
   ```bash
   npm run dev
   ```
   这将在本地 `http://localhost:5173/my-things-pwa/` 启动项目。

4. **进行 PWA 生产环境打包并预览**：
   ```bash
   npm run build
   npm run preview
   ```
   您可以通过浏览器调试工具的 `Application` -> `Service Workers` 栏目检验缓存效果及离线工作状态。

---

## 🌐 自动部署至 GitHub Pages

项目内部已配置有 GitHub Actions。当您向 `main` 分支提交推送代码时，CI 流程将自动运行：

1. **自动构建静态资源**；
2. **将生成的 `dist` 目录强推至 `gh-pages` 分支**。

### 手动开启 GitHub Pages 步骤：
1. 打开您的 GitHub 仓库：[https://github.com/dmqm/my-things-pwa](https://github.com/dmqm/my-things-pwa)；
2. 进入 **Settings** (设置) -> **Pages** (页面)；
3. 将 **Build and deployment > Source** 选择为 **Deploy from a branch**；
4. 选择 `gh-pages` 分支并保存；
5. 部署就绪后，可通过网页进行访问与安装：`https://dmqm.github.io/my-things-pwa/`。

---

## 📲 如何安装为桌面 App

由于是标准 PWA，您可以像原生 App 一样将其安装至桌面：

- **iOS (iPhone/iPad)**：使用 Safari 浏览器打开应用网址 -> 点击底部的“分享”按钮 -> 选择 **“添加到主屏幕” (Add to Home Screen)**。
- **Android**：使用 Chrome 浏览器打开 -> 点击右上角菜单 -> 选择 **“安装应用”**。
- **macOS/Windows (Chrome/Edge)**：点击地址栏右侧的“安装”图标即可生成桌面独立窗口应用。

---

## 📝 许可协议

本项目基于 MIT 协议开源。
