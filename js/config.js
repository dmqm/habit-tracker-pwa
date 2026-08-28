/**
 * Monorepo 子应用配置（相对路径，适用于 GitHub Pages 子目录部署）
 */
export const APPS = [
  {
    id: 'habit-tracker',
    name: '小日常打卡',
    subtitle: '习惯追踪',
    description: '热力图统计 · 加密备份 · 通知提醒',
    url: './habit-tracker-pwa/',
    color: '#34C759',
    icon: '☘️',
    tags: ['习惯', '打卡']
  },
  {
    id: 'my-things',
    name: '我的物品',
    subtitle: '物品收纳管理',
    description: '层级空间 · 保质期预警 · 图片压缩',
    url: './my-things-pwa/',
    color: '#007AFF',
    icon: '📦',
    tags: ['收纳', '清单']
  },
  {
    id: 'image-hub',
    name: 'ImageHub',
    subtitle: '图像工具工坊',
    description: '搜图生图 · 表情包 · 滤镜涂鸦',
    url: './image-hub-pwa/',
    color: '#6366F1',
    icon: '🖼️',
    tags: ['图像', '创意']
  }
];
