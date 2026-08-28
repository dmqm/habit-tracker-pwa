import React, { useState } from 'react';
import { db, type Category, type Item, type StorageLocation, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Icons from 'lucide-react';
import { DynamicIcon } from './Dashboard';

interface SettingsProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const PRESETS_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', 
  '#FF2D55', '#5856D6', '#8E8E93', '#FFD60A', '#30B0C7'
];

const PRESETS_ICONS = [
  'Smartphone', 'Shirt', 'BookOpen', 'HeartPulse', 'Apple', 
  'Sparkles', 'Wrench', 'Package', 'Box', 'Compass', 
  'Gift', 'Briefcase', 'Camera', 'Tv', 'Coffee', 'ShoppingBag'
];

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme }) => {
  const categories = (useLiveQuery(() => db.categories.toArray()) || []) as Category[];
  const items = (useLiveQuery(() => db.items.toArray()) || []) as Item[];
  const locations = (useLiveQuery(() => db.locations.toArray()) || []) as StorageLocation[];

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(PRESETS_COLORS[0]);
  const [catIcon, setCatIcon] = useState(PRESETS_ICONS[0]);

  // Export JSON Backup
  const handleExport = async () => {
    try {
      const itemsList = await db.items.toArray();
      const categoriesList = await db.categories.toArray();
      const locationsList = await db.locations.toArray();

      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: itemsList,
        categories: categoriesList,
        locations: locationsList
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `我的物品_备份_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('导出备份失败');
    }
  };

  // Import JSON Backup
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup.items || !backup.categories || !backup.locations) {
          alert('无效的备份文件格式！');
          return;
        }

        if (confirm('警告：导入数据会覆盖您目前的所有数据！确认继续导入吗？')) {
          await db.transaction('rw', [db.items, db.categories, db.locations], async () => {
            await db.items.clear();
            await db.categories.clear();
            await db.locations.clear();

            await db.categories.bulkAdd(backup.categories);
            await db.locations.bulkAdd(backup.locations);
            await db.items.bulkAdd(backup.items);
          });
          alert('数据恢复成功！');
        }
      } catch (err) {
        console.error(err);
        alert('解析备份文件失败，请确保格式正确');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Open edit modal for a category
  const handleOpenEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatColor(cat.color);
    setCatIcon(cat.icon);
    setIsAddingCat(true);
  };

  // Close add/edit modal
  const handleCloseModal = () => {
    setIsAddingCat(false);
    setEditingCatId(null);
    setCatName('');
    setCatColor(PRESETS_COLORS[0]);
    setCatIcon(PRESETS_ICONS[0]);
  };

  // Create or Update Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCatId) {
      await db.categories.update(editingCatId, {
        name: catName.trim(),
        color: catColor,
        icon: catIcon,
      });
    } else {
      const newCat: Category = {
        id: 'cat-' + Math.random().toString(36).substring(2, 9),
        name: catName.trim(),
        color: catColor,
        icon: catIcon,
      };
      await db.categories.add(newCat);
    }
    handleCloseModal();
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string, name: string) => {
    const hasItems = items.some((item: Item) => item.categoryId === catId);
    if (hasItems) {
      alert(`无法删除"${name}"，该分类下仍存有物品。请先移动相关物品后再试。`);
      return;
    }

    if (categories.length <= 1) {
      alert('必须保留至少一个分类。');
      return;
    }

    if (confirm(`确定要删除分类"${name}"吗？`)) {
      await db.categories.delete(catId);
    }
  };

  // Reset database to default
  const handleResetDatabase = async () => {
    if (confirm('危险操作！这将会清空您的所有物品、空间和自定义分类，并恢复初始配置。确定继续吗？')) {
      await db.transaction('rw', [db.items, db.categories, db.locations], async () => {
        await db.items.clear();
        await db.categories.clear();
        await db.locations.clear();

        await db.categories.bulkAdd(DEFAULT_CATEGORIES);
        await db.locations.bulkAdd(DEFAULT_LOCATIONS);
      });
      alert('数据库重置成功！');
    }
  };

  return (
    <div>
      <div className="page-title">
        <span>系统设置</span>
      </div>

      {/* Theme selection */}
      <div className="section-title">
        <span>显示模式</span>
      </div>
      <div className="card">
        <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '15px', fontWeight: '500' }}>外观主题</span>
          <div className="flex-center" style={{ gap: '6px' }}>
            <button 
              className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minHeight: '44px', padding: '0 16px', fontSize: '13px', borderRadius: '6px' }}
              onClick={() => setTheme('light')}
            >
              浅色
            </button>
            <button 
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minHeight: '44px', padding: '0 16px', fontSize: '13px', borderRadius: '6px' }}
              onClick={() => setTheme('dark')}
            >
              深色
            </button>
            <button 
              className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minHeight: '44px', padding: '0 16px', fontSize: '13px', borderRadius: '6px' }}
              onClick={() => setTheme('system')}
            >
              系统
            </button>
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="section-title">
        <span>分类管理</span>
        <button 
          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '14px', cursor: 'pointer' }}
          onClick={() => setIsAddingCat(true)}
        >
          新增分类
        </button>
      </div>

      {/* Modal to add/edit category */}
      {isAddingCat && (
        <div className="modal-overlay open" onClick={handleCloseModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">{editingCatId ? '编辑分类' : '新增分类'}</span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                onClick={handleCloseModal}
              >
                取消
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-body">
              <div className="form-group">
                <label className="form-label">分类名称</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)} 
                  placeholder="例如：生鲜蔬菜、学习资料" 
                  maxLength={10}
                  required 
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">颜色标志</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                  {PRESETS_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: catColor === color ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      onClick={() => setCatColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">图标标志</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                  {PRESETS_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className="flex-center"
                      style={{
                        minHeight: '44px',
                        borderRadius: '8px',
                        backgroundColor: catIcon === icon ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--bg-secondary)',
                        border: catIcon === icon ? '1px solid var(--accent-color)' : '1px solid var(--border-light)',
                        color: catIcon === icon ? 'var(--accent-color)' : 'var(--text-secondary)',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      onClick={() => setCatIcon(icon)}
                    >
                      <DynamicIcon name={icon} size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                {editingCatId ? '更新分类' : '保存分类'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List of categories */}
      <div className="card" style={{ padding: 0 }}>
        {categories.map((cat: Category, idx: number) => (
          <div 
            key={cat.id} 
            className="flex-between" 
            style={{ 
              padding: '12px 16px', 
              borderBottom: idx === categories.length - 1 ? 'none' : '1px solid var(--border-light)' 
            }}
          >
            <div className="flex-center">
              <div 
                className="flex-center" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  backgroundColor: `${cat.color}15`, 
                  color: cat.color,
                  justifyContent: 'center',
                  marginRight: '12px'
                }}
              >
                <DynamicIcon name={cat.icon} size={18} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '500' }}>{cat.name}</span>
            </div>
            <div className="flex-center" style={{ gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                {items.filter((i: Item) => i.categoryId === cat.id).reduce((sum: number, i: Item) => sum + (i.quantity || 1), 0)} 件
              </span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}
                title="编辑分类"
              >
                <Icons.Pencil size={16} />
              </button>
              <button 
                style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
              >
                <Icons.Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Backup and Restore - compact 3-button row */}
      <div className="section-title">
        <span>数据备份与安全</span>
      </div>
      <div className="card" style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-secondary" style={{ flex: 1, minHeight: '44px', fontSize: '14px' }} onClick={handleExport}>
          <Icons.Download size={16} style={{ marginRight: '6px' }} />
          导出
        </button>
        <label className="btn btn-secondary" style={{ flex: 1, minHeight: '44px', fontSize: '14px', cursor: 'pointer', margin: 0 }}>
          <Icons.Upload size={16} style={{ marginRight: '6px' }} />
          导入
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button className="btn btn-danger" style={{ flex: 1, minHeight: '44px', fontSize: '14px' }} onClick={handleResetDatabase}>
          <Icons.Trash2 size={16} style={{ marginRight: '6px' }} />
          重置
        </button>
      </div>

      {/* Database Diagnostics */}
      <div className="section-title">
        <span>系统信息</span>
      </div>
      <div className="card" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div className="flex-between" style={{ padding: '6px 0' }}>
          <span>软件版本</span>
          <span>v1.0.0 (PWA)</span>
        </div>
        <div className="flex-between" style={{ padding: '6px 0' }}>
          <span>本地数据表</span>
          <span>3张 (物品, 分类, 空间)</span>
        </div>
        <div className="flex-between" style={{ padding: '6px 0' }}>
          <span>物品记录</span>
          <span>{items.length} 种</span>
        </div>
        <div className="flex-between" style={{ padding: '6px 0' }}>
          <span>空间节点</span>
          <span>{locations.length} 个</span>
        </div>
      </div>
    </div>
  );
};
