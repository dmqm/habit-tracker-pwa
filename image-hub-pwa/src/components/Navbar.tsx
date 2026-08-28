import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Palette, Image, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'search', label: '搜图', icon: Search },
    { id: 'tools', label: '工坊', icon: Palette },
    { id: 'gallery', label: '画廊', icon: Image },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="brand-logo">IH</div>
        <span className="brand-name">ImageHub</span>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <div
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
