import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ItemList } from './components/ItemList';
import { StorageManager } from './components/StorageManager';
import { Settings } from './components/Settings';
import { ItemForm } from './components/ItemForm';
import * as Icons from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Theme State: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('my-things-theme') || 'system';
  });

  // Add/Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  
  // Drill-down filter states
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>(undefined);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('my-things-theme', theme);

    const applyTheme = (themeValue: 'light' | 'dark') => {
      root.setAttribute('data-theme', themeValue);
      // Update theme color meta tag for PWA browser styling
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', themeValue === 'dark' ? '#000000' : '#ffffff');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  // Open Form for Adding
  const handleOpenAddForm = () => {
    setEditingItemId(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (id: number) => {
    setEditingItemId(id);
    setIsFormOpen(true);
  };

  // When clicking an item inside storage manager, redirect to items tab and open its detail view
  const handleSelectItemFromStorage = (itemId: number) => {
    setActiveTab('items');
    // Open the editing/detail form directly, or let ItemList list it and open it.
    // To make it smooth, we directly open the edit/detail screen for it.
    handleOpenEditForm(itemId);
  };

  // Navigate to items page filtering by category
  const handleFilterCategoryFromDashboard = (catId: string) => {
    setFilterCategoryId(catId);
    setActiveTab('items');
  };

  // Render current tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case 'items':
        return (
          <ItemList 
            onEditItem={handleOpenEditForm} 
            filterCategoryId={filterCategoryId}
            setFilterCategoryId={setFilterCategoryId}
          />
        );
      case 'storage':
        return (
          <StorageManager 
            onSelectItem={handleSelectItemFromStorage} 
          />
        );
      case 'settings':
        return (
          <Settings 
            theme={theme} 
            setTheme={setTheme} 
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard 
            onAddItem={handleOpenAddForm} 
            onSelectTab={setActiveTab}
            onFilterCategory={handleFilterCategoryFromDashboard}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Scrollable Viewport */}
      <main className="main-content">
        {renderTabContent()}
      </main>

      {/* Slide-up Form sheet */}
      {isFormOpen && (
        <ItemForm 
          itemId={editingItemId} 
          onClose={() => setIsFormOpen(false)} 
          onSaved={() => {
            setIsFormOpen(false);
            setEditingItemId(null);
          }} 
        />
      )}

      {/* Bottom iOS Navigation Bar */}
      <nav className="tab-bar">
        <button 
          className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Icons.LayoutDashboard className="tab-icon" />
          <span>概览</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          <Icons.Package className="tab-icon" />
          <span>清单</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <Icons.Folder className="tab-icon" />
          <span>空间</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Icons.Settings className="tab-icon" />
          <span>设置</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
