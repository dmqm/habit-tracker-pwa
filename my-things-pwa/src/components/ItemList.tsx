import React, { useState, useEffect } from 'react';
import { db, type Item, type Category, type StorageLocation } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Icons from 'lucide-react';
import { DynamicIcon } from './Dashboard';

interface ItemListProps {
  onEditItem: (id: number) => void;
  filterCategoryId?: string;
  setFilterCategoryId?: (id: string | undefined) => void;
}

export const ItemList: React.FC<ItemListProps> = ({ 
  onEditItem, 
  filterCategoryId, 
  setFilterCategoryId 
}) => {
  const items = (useLiveQuery(() => db.items.toArray()) || []) as Item[];
  const categories = (useLiveQuery(() => db.categories.toArray()) || []) as Category[];
  const locations = (useLiveQuery(() => db.locations.toArray()) || []) as StorageLocation[];

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedLocId, setSelectedLocId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('id-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected item for detail modal
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  // Sync category filter from dashboard if present
  useEffect(() => {
    if (filterCategoryId) {
      setSelectedCatId(filterCategoryId);
      // Clear after applying
      if (setFilterCategoryId) setFilterCategoryId(undefined);
    }
  }, [filterCategoryId, setFilterCategoryId]);

  const activeItem = items.find((i: Item) => i.id === activeItemId) || null;

  // Extract all tags for filter list
  const allTags = Array.from(new Set(items.flatMap((item: Item) => item.tags || []))) as string[];

  // Helper: Get location name path
  const getLocationFullPath = (locId: string): string => {
    const path: string[] = [];
    const traverse = (id: string) => {
      const loc = locations.find((l: StorageLocation) => l.id === id);
      if (loc) {
        path.unshift(loc.name);
        if (loc.parentId) traverse(loc.parentId);
      }
    };
    traverse(locId);
    return path.join(' > ');
  };

  // Helper: check expiry status
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { text: '无保质期', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' };
    const todayStr = new Date().toISOString().split('T')[0];
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    if (expiryDate < todayStr) {
      return { text: `已过期 (${expiryDate})`, color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.1)' };
    } else if (expiryDate <= in30DaysStr) {
      return { text: `即将过期 (${expiryDate})`, color: '#ff9500', bg: 'rgba(255, 149, 0, 0.1)' };
    } else {
      return { text: `安全 (${expiryDate})`, color: '#34c759', bg: 'rgba(52, 199, 89, 0.1)' };
    }
  };

  // Delete handler
  const handleDeleteItem = async (id: number) => {
    if (confirm('确定要删除这个物品吗？此操作无法撤销。')) {
      await db.items.delete(id);
      setActiveItemId(null);
    }
  };

  // Filtered & Sorted Items
  const filteredItems = items
    .filter((item: Item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCatId === 'all' || item.categoryId === selectedCatId;
      const matchesLoc = selectedLocId === 'all' || item.locationId === selectedLocId;
      const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);

      return matchesSearch && matchesCat && matchesLoc && matchesTag;
    })
    .sort((a: Item, b: Item) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'zh-CN');
        case 'qty-desc':
          return b.quantity - a.quantity;
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'expiry-asc':
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.localeCompare(b.expiryDate);
        case 'id-desc':
        default:
          return (b.id || 0) - (a.id || 0);
      }
    });

  return (
    <div>
      <div className="page-title">
        <span>物品清单</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-icon" 
            style={{ color: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--text-tertiary)' }}
            onClick={() => setViewMode('grid')}
            title="网格视图"
          >
            <Icons.Grid size={20} />
          </button>
          <button 
            className="btn-icon" 
            style={{ color: viewMode === 'list' ? 'var(--accent-color)' : 'var(--text-tertiary)' }}
            onClick={() => setViewMode('list')}
            title="列表视图"
          >
            <Icons.List size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Icons.Search size={18} style={{ color: 'var(--text-tertiary)' }} />
        <input 
          type="text" 
          className="search-input" 
          placeholder="搜索物品名称、标签、备注..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              color: 'var(--text-tertiary)'
            }}
          >
            <Icons.X size={18} />
          </button>
        )}
      </div>

      {/* Filter Options Scrollable Row */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px', WebkitOverflowScrolling: 'touch' }}>
        {/* Category Filter */}
        <select 
          value={selectedCatId} 
          onChange={(e) => setSelectedCatId(e.target.value)}
          style={{ 
            padding: '0 16px', 
            minHeight: '44px',
            borderRadius: '100px', 
            backgroundColor: selectedCatId === 'all' ? 'var(--bg-secondary)' : 'rgba(var(--accent-rgb), 0.1)', 
            color: selectedCatId === 'all' ? 'var(--text-secondary)' : 'var(--accent-color)',
            border: `1px solid ${selectedCatId === 'all' ? 'var(--border-light)' : 'rgba(var(--accent-rgb), 0.2)'}`,
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">所有分类</option>
          {categories.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Location Filter */}
        <select 
          value={selectedLocId} 
          onChange={(e) => setSelectedLocId(e.target.value)}
          style={{ 
            padding: '0 16px', 
            minHeight: '44px',
            borderRadius: '100px', 
            backgroundColor: selectedLocId === 'all' ? 'var(--bg-secondary)' : 'rgba(var(--accent-rgb), 0.1)', 
            color: selectedLocId === 'all' ? 'var(--text-secondary)' : 'var(--accent-color)',
            border: `1px solid ${selectedLocId === 'all' ? 'var(--border-light)' : 'rgba(var(--accent-rgb), 0.2)'}`,
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">所有空间</option>
          {locations.map((loc: StorageLocation) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        {/* Tag Filter */}
        <select 
          value={selectedTag} 
          onChange={(e) => setSelectedTag(e.target.value)}
          style={{ 
            padding: '0 16px', 
            minHeight: '44px',
            borderRadius: '100px', 
            backgroundColor: selectedTag === 'all' ? 'var(--bg-secondary)' : 'rgba(var(--accent-rgb), 0.1)', 
            color: selectedTag === 'all' ? 'var(--text-secondary)' : 'var(--accent-color)',
            border: `1px solid ${selectedTag === 'all' ? 'var(--border-light)' : 'rgba(var(--accent-rgb), 0.2)'}`,
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">所有标签</option>
          {allTags.map((tag: string) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        {/* Sort Select */}
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ 
            padding: '0 16px', 
            minHeight: '44px',
            borderRadius: '100px', 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="id-desc">最新创建</option>
          <option value="name-asc">名称 A-Z</option>
          <option value="qty-desc">数量多到少</option>
          <option value="price-desc">单价高到低</option>
          <option value="expiry-asc">保质期临近</option>
        </select>
      </div>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <div className="card empty-state" style={{ padding: '60px 20px' }}>
          <Icons.Inbox className="empty-state-icon" size={48} />
          <p style={{ fontSize: '15px' }}>没有找到匹配的物品</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {filteredItems.map((item: Item) => {
            const cat = categories.find((c: Category) => c.id === item.categoryId);
            return (
              <div 
                key={item.id} 
                className="card card-interactive" 
                style={{ 
                  margin: 0, 
                  padding: 0, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => item.id && setActiveItemId(item.id)}
              >
                {/* Photo */}
                <div style={{ height: '120px', width: '100%', backgroundColor: 'var(--bg-tertiary)', position: 'relative' }}>
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', color: 'var(--text-tertiary)', justifyContent: 'center' }}>
                      <Icons.Package size={36} />
                    </div>
                  )}
                  {/* Category Badge overlay */}
                  {cat && (
                    <span 
                      style={{ 
                        position: 'absolute', 
                        bottom: '8px', 
                        left: '8px', 
                        fontSize: '10px', 
                        fontWeight: '600',
                        color: cat.color, 
                        backgroundColor: `${cat.color}18`,
                        border: `1px solid ${cat.color}33`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <DynamicIcon name={cat.icon} size={10} />
                      {cat.name}
                    </span>
                  )}
                  {/* Quantity tag */}
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      backgroundColor: 'rgba(0,0,0,0.6)', 
                      color: '#ffffff', 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      padding: '2px 8px', 
                      borderRadius: '10px' 
                    }}
                  >
                    x{item.quantity}
                  </span>
                </div>
                
                {/* Details */}
                <div style={{ padding: '10px 12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {locations.find((l: StorageLocation) => l.id === item.locationId)?.name || '未知位置'}
                    </span>
                    {item.expiryDate && (
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: getExpiryStatus(item.expiryDate).color 
                        }} 
                        title={getExpiryStatus(item.expiryDate).text}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredItems.map((item: Item, idx: number) => {
            const cat = categories.find((c: Category) => c.id === item.categoryId);
            return (
              <div 
                key={item.id} 
                className="flex-between card-interactive" 
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: idx === filteredItems.length - 1 ? 'none' : '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
                onClick={() => item.id && setActiveItemId(item.id)}
              >
                <div className="flex-center" style={{ overflow: 'hidden', flex: 1 }}>
                  {item.photo ? (
                    <img 
                      src={item.photo} 
                      alt={item.name} 
                      style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', marginRight: '12px', flexShrink: 0 }} 
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        color: 'var(--text-tertiary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: '12px',
                        flexShrink: 0
                      }}
                    >
                      <Icons.Package size={22} />
                    </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {cat && (
                        <span style={{ color: cat.color, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <DynamicIcon name={cat.icon} size={11} />
                          {cat.name}
                        </span>
                      )}
                      <span>•</span>
                      <span>{locations.find((l: StorageLocation) => l.id === item.locationId)?.name || '未知位置'}</span>
                    </span>
                  </div>
                </div>
                <div className="flex-center" style={{ flexShrink: 0, gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)' }}>x{item.quantity}</span>
                  <Icons.ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Modal Sheet */}
      {activeItem && (
        <div className="modal-overlay open" onClick={() => setActiveItemId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">物品详情</span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setActiveItemId(null)}
              >
                关闭
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Photo */}
              {activeItem.photo ? (
                <div style={{ width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <img src={activeItem.photo} alt={activeItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '120px', borderRadius: '16px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <Icons.Package size={48} />
                </div>
              )}

              {/* Title & Qty */}
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{activeItem.name}</h2>
                <div className="flex-between">
                  <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>数量: <strong>{activeItem.quantity}</strong></span>
                  {activeItem.price !== undefined && (
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#34c759' }}>估值: ¥{activeItem.price.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Detail fields table */}
              <div className="card" style={{ padding: '0 16px', marginBottom: 0 }}>
                {/* Category */}
                <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>所属分类</span>
                  {(() => {
                    const cat = categories.find((c: Category) => c.id === activeItem.categoryId);
                    return cat ? (
                      <span style={{ color: cat.color, fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DynamicIcon name={cat.icon} size={14} />
                        {cat.name}
                      </span>
                    ) : <span style={{ fontSize: '14px' }}>未分类</span>;
                  })()}
                </div>

                {/* Location */}
                <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>存放位置</span>
                  <span style={{ fontWeight: '500', fontSize: '14px', textAlign: 'right' }}>
                    {getLocationFullPath(activeItem.locationId)}
                  </span>
                </div>

                {/* Expiry */}
                <div className="flex-between" style={{ padding: '12px 0', borderBottom: activeItem.purchaseDate ? '1px solid var(--border-light)' : 'none' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>保质状态</span>
                  <span 
                    style={{ 
                      color: getExpiryStatus(activeItem.expiryDate).color, 
                      backgroundColor: getExpiryStatus(activeItem.expiryDate).bg,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '13px', 
                      fontWeight: '500' 
                    }}
                  >
                    {getExpiryStatus(activeItem.expiryDate).text}
                  </span>
                </div>

                {/* Purchase Date */}
                {activeItem.purchaseDate && (
                  <div className="flex-between" style={{ padding: '12px 0', borderBottom: 'none' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>购买日期</span>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{activeItem.purchaseDate}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {activeItem.tags && activeItem.tags.length > 0 && (
                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: '500', marginBottom: '6px', paddingLeft: '4px' }}>标签</div>
                  <div>
                    {activeItem.tags.map((tag: string) => (
                      <span key={tag} className="tag-badge tag-badge-active" style={{ fontSize: '13px', padding: '4px 10px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {activeItem.notes && (
                <div className="card" style={{ padding: '12px 14px', backgroundColor: 'var(--bg-tertiary)', border: 'none', marginBottom: 0 }}>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>备注描述</div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{activeItem.notes}</p>
                </div>
              )}

              {/* Actions row */}
              <div className="grid-2" style={{ marginTop: '10px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    if (activeItem.id) {
                      onEditItem(activeItem.id);
                      setActiveItemId(null);
                    }
                  }}
                >
                  <Icons.Edit3 size={18} style={{ marginRight: '6px' }} />
                  编辑物品
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => activeItem.id && handleDeleteItem(activeItem.id)}
                >
                  <Icons.Trash2 size={18} style={{ marginRight: '6px' }} />
                  删除物品
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
