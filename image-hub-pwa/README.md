# ImageHub PWA - 智能搜图、AI生图、设计与表情包制作工坊

这是一个高颜值、体验流畅的 Progressive Web App (PWA)，特别针对中国大陆网络进行了深度优化，适配 iPhone (iOS Standalone) 独立 App 模式。

## 🌟 核心功能
1. **在线搜图 & 本地以色搜图**：支持 Pixabay API，无网时无缝降级到本地图库；支持上传图片在本地图库中进行色彩相似度排序。
2. **AI 文本生图**：支持免费免 Key 引擎和硅基流动 (SiliconFlow) 极速引擎，集成 DeepSeek 进行中文提示词翻译润色。
3. **表情包工坊 (iOS Pro)**：支持拖拽移动文字与贴纸，个性化修改字体大小、颜色和描边，支持微信/QQ一键粘贴直发。
4. **创意设计坊**：提供全屏平铺水印防盗图、半透明毛玻璃语录日签海报、微信圆形个性头像框。
5. **图像处理 Studio**：基础参数微调、艺术滤镜（像素画、赛博朋克等）、手绘涂鸦和历史撤销重做栈。

---

## 💻 本地运行与预览
在本地安装 Node.js 后，进入项目根目录：

1. **安装依赖**：
   ```bash
   npm install
   ```
2. **启动本地开发服务器**：
   ```bash
   npm run dev
   ```
   启动后可在浏览器中打开：`http://localhost:5173/` 进行体验。

---

## 🚀 GitHub 分发与部署托管指南

由于本应用为纯静态 PWA，您可以完全免费地将其部署和分发在 **GitHub Pages** 上，提供 HTTPS 在线访问（PWA 安装的硬性要求）。

### 第一步：在本地提交代码
在项目根目录运行以下 Git 命令：
```bash
git init
git add .
git commit -m "feat: complete mobile prioritized image hub pwa"
git branch -M main
```

### 第二步：关联 GitHub 仓库
1. 登录您的 GitHub，新建一个名为 `image-hub-pwa` 的 **公开 (Public)** 仓库。
2. 在本地终端中运行以下命令关联并推送：
   ```bash
   git remote add origin https://github.com/<您的GitHub用户名>/image-hub-pwa.git
   git push -u origin main
   ```

### 第三步：配置 GitHub 工作流权限 (关键步骤 ⚠️)
为了让 GitHub Actions 能够自动把打包产物发布到 `gh-pages` 分支，您需要开启写入权限：
1. 打开您的 GitHub 仓库网页，点击右上角的 **Settings**。
2. 在左侧菜单中找到并点击 **Actions** -> **General**。
3. 滚动到页面底部，找到 **Workflow permissions**。
4. **将默认选项改为 "Read and write permissions"**，并点击 **Save** 保存。

### 第四步：启用 Pages 服务
1. 当您推送代码至 `main` 分支后，GitHub Actions 会自动触发构建。等待一到两分钟。
2. 再次进入仓库的 **Settings** -> **Pages**。
3. 在 **Build and deployment** 下的 **Source** 选择 "Deploy from a branch"。
4. 在 **Branch** 处选择 **`gh-pages`** 分支，目录选择 `/ (root)`，点击 **Save**。
5. 稍等片刻，您就可以在网页上方看到您的专属在线分发地址：
   `https://<您的GitHub用户名>.github.io/image-hub-pwa/`

---

## 📱 苹果 iPhone (iOS PWA) 安装指南

得益于完整的 iOS Viewport 适配和 Safe Area 处理，您可以在 iPhone 上将其作为独立 App 运行：

1. 用 iPhone 自带的 **Safari 浏览器** 打开您的 GitHub Pages 在线地址。
2. 点击 Safari 底部工具栏的 **分享** 按钮（带箭头的方框）。
3. 在弹出的菜单中向下滚动，选择 **“添加到主屏幕” (Add to Home Screen)**。
4. 确认名称并点击右上角的 **“添加”**。
5. 此时，您的 iPhone 桌面上就会出现 ImageHub 图标。点击图标启动，它将以**全屏独立 App** 模式运行，完美避开 Safari 地址栏，且支持完整的离线缓存秒开！
