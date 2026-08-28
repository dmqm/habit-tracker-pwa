import React, { useEffect, useState } from 'react';
import { db, type Item, type Category } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Icons from 'lucide-react';

interface DashboardProps {
  onAddItem: () => void;
  onSelectTab: (tab: string) => void;
  onFilterCategory: (catId: string) => void;
}

export const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.HelpCircle {...props} />;
  return <IconComponent {...props} />;
};

export const Dashboard: React.FC<DashboardProps> = ({ onAddItem, onSelectTab, onFilterCategory }) => {
  // Live queries from IndexedDB
  const items = (useLiveQuery(() => db.items.toArray()) || []) as Item[];
  const categories = (useLiveQuery(() => db.categories.toArray()) || []) as Category[];

  const [expiringItems, setExpiringItems] = useState<Item[]>([]);
  const [expiredItems, setExpiredItems] = useState<Item[]>([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    const expiring: Item[] = [];
    const expired: Item[] = [];

    items.forEach((item: Item) => {
      if (item.expiryDate) {
        if (item.expiryDate < todayStr) {
          expired.push(item);
        } else if (item.expiryDate <= in30DaysStr) {
          expiring.push(item);
        }
      }
    });

    // Sort by expiry date ascending
    expiring.sort((a, b) => (a.expiryDate! > b.expiryDate! ? 1 : -1));
    expired.sort((a, b) => (a.expiryDate! > b.expiryDate! ? 1 : -1));

    setExpiringItems(expiring);
    setExpiredItems(expired);
  }, [items]);

  // Statistics
  const totalItemsCount = items.reduce((sum: number, item: Item) => sum + (item.quantity || 1), 0);
  const totalUniqueCount = items.length;
  const totalValue = items.reduce((sum: number, item: Item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  // Category statistics
  const categoryStats = categories.map((cat: Category) => {
    const catItems = items.filter((item: Item) => item.categoryId === cat.id);
    const count = catItems.reduce((sum: number, item: Item) => sum + (item.quantity || 1), 0);
    return {
      category: cat,
      count,
    };
  }).filter((stat: { count: number }) => stat.count > 0).sort((a: { count: number }, b: { count: number }) => b.count - a.count);

  return (
    <div>
      <div className="page-title">
        <span>统计概览</span>
        <button className="btn-icon" onClick={onAddItem} title="新增物品">
          <Icons.Plus size={24} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>物品总数</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{totalItemsCount}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{totalUniqueCount} 种款式</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>总估值</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34c759' }}>
            ¥{totalValue.toFixed(2)}
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>单价均值</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => onSelectTab('items')}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>保质警报</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: expiredItems.length > 0 ? '#ff3b30' : (expiringItems.length > 0 ? '#ff9500' : 'var(--text-primary)') }}>
            {expiredItems.length + expiringItems.length}
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
            {expiredItems.length} 过期 / {expiringItems.length} 临期
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(expiredItems.length > 0 || expiringItems.length > 0) && (
        <div className="card" style={{ borderLeft: '4px solid #ff3b30', padding: '14px' }}>
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#ff3b30', display: 'flex', alignItems: 'center' }}>
              <Icons.AlertTriangle size={18} style={{ marginRight: '6px' }} />
              保质期警报
            </span>
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {expiredItems.map(item => (
              <div key={item.id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                <span style={{ color: '#ff3b30' }}>[已过期] {item.name}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>过期于: {item.expiryDate}</span>
              </div>
            ))}
            {expiringItems.map(item => (
              <div key={item.id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                <span style={{ color: '#ff9500' }}>[临期] {item.name}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>到期: {item.expiryDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category distribution */}
      <div className="section-title">
        <span>分类占比</span>
        <button 
          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '14px', cursor: 'pointer' }}
          onClick={() => onSelectTab('settings')}
        >
          管理分类
        </button>
      </div>
      
      {categoryStats.length === 0 ? (
        <div className="card empty-state">
          <Icons.Inbox className="empty-state-icon" size={40} />
          <p style={{ fontSize: '14px' }}>暂无物品数据，点击右上角 “+” 开始记录您的物品吧</p>
        </div>
      ) : (
        <div className="card">
          {categoryStats.map(stat => {
            const percentage = totalItemsCount > 0 ? (stat.count / totalItemsCount) * 100 : 0;
            return (
              <div 
                key={stat.category.id} 
                className="flex-between" 
                style={{ padding: '10px 0', cursor: 'pointer' }}
                onClick={() => {
                  onFilterCategory(stat.category.id);
                  onSelectTab('items');
                }}
              >
                <div className="flex-center" style={{ flex: 1 }}>
                  <div 
                    className="flex-center" 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      backgroundColor: `${stat.category.color}15`, 
                      color: stat.category.color,
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}
                  >
                    <DynamicIcon name={stat.category.icon} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>
                      <span>{stat.category.name}</span>
                      <span>{stat.count} 件</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          backgroundColor: stat.category.color, 
                          width: `${percentage}%`,
                          borderRadius: '3px'
                        }} 
                      />
                    </div>
                  </div>
                </div>
                <Icons.ChevronRight size={16} style={{ color: 'var(--text-tertiary)', marginLeft: '12px' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips or Advice */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.08) 0%, rgba(var(--accent-rgb), 0.02) 100%)', borderColor: 'rgba(var(--accent-rgb), 0.15)' }}>
        <h4 style={{ color: 'var(--accent-color)', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
          <Icons.Lightbulb size={16} style={{ marginRight: '6px' }} />
          小贴士
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          由于数据完全保存在您的本地浏览器中，请定期前往“设置”备份您的物品数据（导出 JSON），避免清除浏览器缓存导致数据丢失。
        </p>
      </div>
    </div>
  );
};
