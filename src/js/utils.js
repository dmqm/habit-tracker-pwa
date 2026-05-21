/* 实用工具库：日期计算与矢量 SVG 图标库 */

// 日期格式化，返回 YYYY-MM-DD
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 格式化展示周几
export const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const WEEK_DAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

// 获取指定日期的一周天数列表
export function getWeekDays(centerDate) {
  const current = new Date(centerDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday
  
  // 以周一为周第一天，或者按日历以周日为第一天
  // 我们按照周日作为第一天展示，更加直观符合周历
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }
  return weekDays;
}

// 两个日期间相差天数
export function getDiffDays(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  // 清零时间部分，只比对日期
  date1.setHours(0,0,0,0);
  date2.setHours(0,0,0,0);
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// SVG 图标路径集 (Lucide 风格原生 SVG)
const SVGS = {
  // 底部导航与常规动作
  'check-square': '<path d="m9 11 3 3L22 4"/><rect x="3" y="5" width="6" height="6" rx="1"/><path d="M3 17a2 2 0 0 0 2 2h6"/><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11"/>',
  'bar-chart': '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'plus': '<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>',
  'x': '<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'info': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/>',
  'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  'edit': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  
  // 分类时段
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/>',
  'coffee': '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',

  // 习惯专属图标
  'droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/>',
  'book': '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h10"/>',
  'brain': '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3.014 3.014 0 0 1-.5-1.94 2.5 2.5 0 0 1 0-3.12 3.014 3.014 0 0 1-.5-1.94A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3.014 3.014 0 0 0 .5-1.94 2.5 2.5 0 0 0 0-3.12 3.014 3.014 0 0 0 .5-1.94A2.5 2.5 0 0 0 14.5 2Z"/>',
  'dumbbell': '<path d="M6.5 6.5h11M6.5 17.5h11M21 12H3M21 6v12a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3ZM10 6v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3Z"/>',
  'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'smile': '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  'gift': '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v12"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.3 4.3 0 0 1 12 8a2.5 2.5 0 0 1 0-5A4.3 4.3 0 0 1 7.5 8Z"/>',
  'music': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'
};

// 获取常用习惯图标列表，用于用户创建时选择
export const HABIT_ICONS = ['droplet', 'book', 'brain', 'dumbbell', 'coffee', 'heart', 'smile', 'gift', 'music', 'sun', 'moon', 'clock'];

// 统一生成 SVG 标签，配置 stroke, stroke-width 等样式
export function getIconSvg(name, className = '', strokeWidth = 2) {
  const content = SVGS[name] || '';
  if (!content) return '';
  return `<svg class="icon-${name} ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// 兼容旧引用，实际实现见 local-crypto.js
export {
  encryptLocal as encryptData,
  decryptLocal as decryptData,
  isLocalCryptoAvailable as isCryptoAvailable,
} from './local-crypto.js';
