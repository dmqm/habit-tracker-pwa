import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';

export interface GalleryItem {
  id: string;
  dataUrl: string; // Base64 image data
  title: string;
  date: string;
  tags: string[];
  color: { r: number; g: number; b: number }; // Average RGB color
}

export type ColorTheme = 'cyberpunk' | 'amoled' | 'aurora' | 'light';
export type SubToolType = 'none' | 'ai' | 'meme' | 'studio' | 'creator';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  activeSubTool: SubToolType;
  setActiveSubTool: (tool: SubToolType) => void;
  
  // Color Themes
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  
  // API Keys
  siliconFlowKey: string;
  setSiliconFlowKey: (key: string) => void;
  deepSeekKey: string;
  setDeepSeekKey: (key: string) => void;
  pixabayKey: string;
  setPixabayKey: (key: string) => void;
  
  // Gallery Management
  gallery: GalleryItem[];
  addToGallery: (dataUrl: string, title: string, tags: string[], color: { r: number; g: number; b: number }) => Promise<GalleryItem>;
  deleteFromGallery: (id: string) => Promise<void>;
  
  // Backup & Restore
  exportBackupData: () => string;
  importBackupData: (jsonStr: string) => Promise<boolean>;
  
  // Current Studio Image
  currentImage: string | null;
  setCurrentImage: (image: string | null) => void;
  importToStudio: (dataUrl: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<string>('search');
  const [activeSubTool, setActiveSubTool] = useState<SubToolType>('none');
  
  // Themes
  const [theme, setThemeState] = useState<ColorTheme>(() => (localStorage.getItem('ih_theme') as ColorTheme) || 'cyberpunk');
  
  // API Keys (Persisted in LocalStorage)
  const [siliconFlowKey, setSiliconFlowKeyState] = useState<string>(() => localStorage.getItem('ih_siliconflow_key') || '');
  const [deepSeekKey, setDeepSeekKeyState] = useState<string>(() => localStorage.getItem('ih_deepseek_key') || '');
  const [pixabayKey, setPixabayKeyState] = useState<string>(() => localStorage.getItem('ih_pixabay_key') || '');
  
  // Gallery State (Persisted in IndexedDB via localforage)
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  
  // Current Active Image in Studio Editor
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setActiveSubTool('none'); // Reset active sub-tool when navigating to a new tab
  };

  // Initialize Gallery & Apply Theme
  useEffect(() => {
    localforage.config({
      name: 'ImageHub',
      storeName: 'gallery_store'
    });
    
    localforage.getItem<GalleryItem[]>('gallery_items').then((items) => {
      if (items) {
        setGallery(items);
      }
    });

    applyThemeVariables(theme);
  }, [theme]);

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('ih_theme', newTheme);
    applyThemeVariables(newTheme);
  };

  // Dynamically change root CSS Variables for Light / OLED / purple / navy themes
  const applyThemeVariables = (t: ColorTheme) => {
    const root = document.documentElement;
    if (t === 'light') {
      // Premium Light Mode
      root.style.setProperty('--bg-base', '#f1f5f9');
      root.style.setProperty('--bg-surface', 'rgba(255, 255, 255, 0.75)');
      root.style.setProperty('--bg-surface-hover', 'rgba(241, 245, 249, 0.9)');
      root.style.setProperty('--bg-input', '#ffffff');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--border-color-hover', 'rgba(99, 102, 241, 0.4)');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#94a3b8');
      
      root.style.setProperty('--primary-glow', 'rgba(99, 102, 241, 0.15)');
      root.style.setProperty('--secondary-glow', 'rgba(168, 85, 247, 0.15)');
      
      // Light mesh gradient background
      root.style.setProperty('--bg-gradient', `
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)
      `);
    } else if (t === 'amoled') {
      // OLED Pitch Black
      root.style.setProperty('--bg-base', '#000000');
      root.style.setProperty('--bg-surface', 'rgba(10, 10, 10, 0.85)');
      root.style.setProperty('--bg-surface-hover', 'rgba(25, 25, 25, 0.9)');
      root.style.setProperty('--bg-input', 'rgba(5, 5, 5, 0.95)');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--border-color-hover', 'rgba(99, 102, 241, 0.5)');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--primary-glow', 'rgba(99, 102, 241, 0.35)');
      root.style.setProperty('--secondary-glow', 'rgba(168, 85, 247, 0.35)');
      root.style.setProperty('--bg-gradient', 'none');
    } else if (t === 'aurora') {
      // Aurora Deep Purple
      root.style.setProperty('--bg-base', '#0a0518');
      root.style.setProperty('--bg-surface', 'rgba(23, 15, 43, 0.7)');
      root.style.setProperty('--bg-surface-hover', 'rgba(38, 25, 68, 0.85)');
      root.style.setProperty('--bg-input', 'rgba(15, 8, 30, 0.9)');
      root.style.setProperty('--border-color', 'rgba(168, 85, 247, 0.15)');
      root.style.setProperty('--border-color-hover', 'rgba(168, 85, 247, 0.5)');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--primary-glow', 'rgba(99, 102, 241, 0.35)');
      root.style.setProperty('--secondary-glow', 'rgba(168, 85, 247, 0.35)');
      root.style.setProperty('--bg-gradient', `
        radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 40%)
      `);
    } else {
      // Cyberpunk Navy (Default Dark)
      root.style.setProperty('--bg-base', '#06060c');
      root.style.setProperty('--bg-surface', 'rgba(15, 15, 27, 0.65)');
      root.style.setProperty('--bg-surface-hover', 'rgba(25, 25, 45, 0.8)');
      root.style.setProperty('--bg-input', 'rgba(10, 10, 20, 0.8)');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-color-hover', 'rgba(99, 102, 241, 0.3)');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--primary-glow', 'rgba(99, 102, 241, 0.35)');
      root.style.setProperty('--secondary-glow', 'rgba(168, 85, 247, 0.35)');
      root.style.setProperty('--bg-gradient', `
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%)
      `);
    }
  };

  const setSiliconFlowKey = (key: string) => {
    setSiliconFlowKeyState(key);
    localStorage.setItem('ih_siliconflow_key', key);
  };

  const setDeepSeekKey = (key: string) => {
    setDeepSeekKeyState(key);
    localStorage.setItem('ih_deepseek_key', key);
  };

  const setPixabayKey = (key: string) => {
    setPixabayKeyState(key);
    localStorage.setItem('ih_pixabay_key', key);
  };

  const addToGallery = async (dataUrl: string, title: string, tags: string[], color: { r: number; g: number; b: number }) => {
    const newItem: GalleryItem = {
      id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      dataUrl,
      title: title || '未命名图片',
      date: new Date().toLocaleDateString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      tags: tags || [],
      color
    };
    
    const updatedGallery = [newItem, ...gallery];
    setGallery(updatedGallery);
    await localforage.setItem('gallery_items', updatedGallery);
    return newItem;
  };

  const deleteFromGallery = async (id: string) => {
    const updatedGallery = gallery.filter(item => item.id !== id);
    setGallery(updatedGallery);
    await localforage.setItem('gallery_items', updatedGallery);
  };

  // Export gallery as JSON string
  const exportBackupData = () => {
    const backupObj = {
      version: '1.0.0',
      timestamp: Date.now(),
      gallery: gallery
    };
    return JSON.stringify(backupObj);
  };

  // Import JSON string and save to IndexedDB
  const importBackupData = async (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.gallery)) {
        const importedItems: GalleryItem[] = parsed.gallery.filter((item: any) => {
          return item.id && item.dataUrl && item.title;
        });

        if (importedItems.length === 0) return false;

        const merged = [...importedItems, ...gallery].filter(
          (value, index, self) => self.findIndex(t => t.id === value.id) === index
        );

        setGallery(merged);
        await localforage.setItem('gallery_items', merged);
        return true;
      }
      return false;
    } catch (err) {
      console.error('导入备份解析错误:', err);
      return false;
    }
  };

  const importToStudio = (dataUrl: string) => {
    setCurrentImage(dataUrl);
    setActiveTab('tools');
    setActiveSubTool('studio');
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      activeSubTool,
      setActiveSubTool,
      theme,
      setTheme,
      siliconFlowKey,
      setSiliconFlowKey,
      deepSeekKey,
      setDeepSeekKey,
      pixabayKey,
      setPixabayKey,
      gallery,
      addToGallery,
      deleteFromGallery,
      exportBackupData,
      importBackupData,
      currentImage,
      setCurrentImage,
      importToStudio
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
