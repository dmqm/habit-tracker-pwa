export interface PresetImage {
  id: string;
  url: string;
  title: string;
  tags: string[];
  color: { r: number; g: number; b: number };
}

// Helper to create beautiful SVGs representing abstract art
const createSvgUrl = (svgContent: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

export const PRESET_IMAGES: PresetImage[] = [
  {
    id: 'preset_sunset',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="sunset-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff453a" />
            <stop offset="50%" stop-color="#ff9f0a" />
            <stop offset="100%" stop-color="#bf5af2" />
          </linearGradient>
          <filter id="blur-effect">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#1a0b2e" />
        <circle cx="200" cy="200" r="250" fill="url(#sunset-grad)" filter="url(#blur-effect)" opacity="0.8" />
        <circle cx="600" cy="400" r="300" fill="#ff2d55" filter="url(#blur-effect)" opacity="0.6" />
        <circle cx="400" cy="300" r="150" fill="#ffd60a" filter="url(#blur-effect)" opacity="0.5" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.15)">SUNSET GLOW</text>
      </svg>
    `),
    title: '落日晚霞 (Sunset Glow)',
    tags: ['红色', '橙色', '紫色', '温暖', '自然', '渐变'],
    color: { r: 210, g: 80, b: 110 }
  },
  {
    id: 'preset_ocean',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="ocean-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0a84ff" />
            <stop offset="60%" stop-color="#64d2ff" />
            <stop offset="100%" stop-color="#0df5e3" />
          </linearGradient>
          <filter id="ocean-blur">
            <feGaussianBlur stdDeviation="80" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#051c33" />
        <circle cx="300" cy="400" r="280" fill="url(#ocean-grad)" filter="url(#ocean-blur)" opacity="0.75" />
        <circle cx="500" cy="150" r="200" fill="#30d158" filter="url(#ocean-blur)" opacity="0.4" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.12)">DEEP OCEAN</text>
      </svg>
    `),
    title: '深海幽蓝 (Deep Ocean)',
    tags: ['蓝色', '绿色', '冷色', '海洋', '自然', '平静'],
    color: { r: 30, g: 130, b: 180 }
  },
  {
    id: 'preset_cyberpunk',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="neon-glow">
            <feGaussianBlur stdDeviation="90" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#030008" />
        <ellipse cx="250" cy="300" rx="200" ry="350" fill="#bf5af2" filter="url(#neon-glow)" opacity="0.7" />
        <ellipse cx="550" cy="300" rx="250" ry="200" fill="#ff375f" filter="url(#neon-glow)" opacity="0.6" />
        <circle cx="400" cy="200" r="150" fill="#5e5ce6" filter="url(#neon-glow)" opacity="0.8" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.18)">CYBERPUNK NEON</text>
      </svg>
    `),
    title: '赛博霓虹 (Cyberpunk Neon)',
    tags: ['紫色', '粉色', '蓝色', '科技', '霓虹', '迷幻'],
    color: { r: 140, g: 40, b: 170 }
  },
  {
    id: 'preset_forest',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="forest-blur">
            <feGaussianBlur stdDeviation="70" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#02140d" />
        <circle cx="350" cy="350" r="300" fill="#30d158" filter="url(#forest-blur)" opacity="0.65" />
        <circle cx="550" cy="200" r="220" fill="#acfd43" filter="url(#forest-blur)" opacity="0.45" />
        <circle cx="200" cy="150" r="180" fill="#00a389" filter="url(#forest-blur)" opacity="0.5" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.1)">FOREST MIST</text>
      </svg>
    `),
    title: '林间迷雾 (Forest Mist)',
    tags: ['绿色', '黄色', '自然', '森林', '治愈', '宁静'],
    color: { r: 40, g: 150, b: 90 }
  },
  {
    id: 'preset_desert',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="desert-blur">
            <feGaussianBlur stdDeviation="80" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#1f1402" />
        <circle cx="400" cy="400" r="300" fill="#ff9f0a" filter="url(#desert-blur)" opacity="0.7" />
        <circle cx="250" cy="200" r="200" fill="#ffd60a" filter="url(#desert-blur)" opacity="0.5" />
        <circle cx="600" cy="250" r="150" fill="#ff453a" filter="url(#desert-blur)" opacity="0.4" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.15)">GOLDEN DESERT</text>
      </svg>
    `),
    title: '金色大漠 (Golden Desert)',
    tags: ['黄色', '橙色', '红色', '温暖', '沙漠', '旷野'],
    color: { r: 190, g: 120, b: 40 }
  },
  {
    id: 'preset_aurora',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="aurora-blur">
            <feGaussianBlur stdDeviation="75" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#07021c" />
        <ellipse cx="400" cy="200" rx="350" ry="100" fill="#30d158" filter="url(#aurora-blur)" opacity="0.6" />
        <ellipse cx="300" cy="350" rx="280" ry="120" fill="#0a84ff" filter="url(#aurora-blur)" opacity="0.5" />
        <circle cx="600" cy="300" r="180" fill="#bf5af2" filter="url(#aurora-blur)" opacity="0.5" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.12)">AURORA BOREALIS</text>
      </svg>
    `),
    title: '极光之夜 (Aurora Night)',
    tags: ['绿色', '蓝色', '紫色', '天空', '极光', '冷色'],
    color: { r: 60, g: 110, b: 150 }
  },
  {
    id: 'preset_cosmic',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="cosmic-blur">
            <feGaussianBlur stdDeviation="90" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#020205" />
        <circle cx="200" cy="150" r="150" fill="#5e5ce6" filter="url(#cosmic-blur)" opacity="0.5" />
        <circle cx="650" cy="450" r="220" fill="#bf5af2" filter="url(#cosmic-blur)" opacity="0.4" />
        <ellipse cx="400" cy="300" rx="150" ry="80" fill="#ff375f" filter="url(#cosmic-blur)" opacity="0.3" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.08)">COSMIC VOID</text>
      </svg>
    `),
    title: '浩瀚星空 (Cosmic Void)',
    tags: ['黑色', '紫色', '蓝色', '星空', '深邃', '抽象'],
    color: { r: 25, g: 20, b: 45 }
  },
  {
    id: 'preset_sakura',
    url: createSvgUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="sakura-blur">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#29121a" />
        <circle cx="300" cy="250" r="200" fill="#ff2d55" filter="url(#sakura-blur)" opacity="0.6" />
        <circle cx="500" cy="350" r="250" fill="#ffb3c6" filter="url(#sakura-blur)" opacity="0.7" />
        <circle cx="400" cy="150" r="100" fill="#ff6b8b" filter="url(#sakura-blur)" opacity="0.5" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="48" fill="rgba(255,255,255,0.15)">SAKURA DREAMS</text>
      </svg>
    `),
    title: '樱花幻想 (Sakura Dreams)',
    tags: ['粉色', '红色', '浪漫', '温暖', '樱花', '治愈'],
    color: { r: 220, g: 100, b: 130 }
  }
];
