import React, { useState, useRef } from 'react';
import { db, type StorageLocation, type Item } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Icons from 'lucide-react';

interface StorageManagerProps {
  onSelectItem: (itemId: number) => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ onSelectItem }) => {
  const locations = (useLiveQuery(() => db.locations.toArray()) || []) as StorageLocation[];
  const items = (useLiveQuery(() => db.items.toArray()) || []) as Item[];

  const [currentLocId, setCurrentLocId] = useState<string | null>(null);
  const [isAddingLoc, setIsAddingLoc] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocDesc, setEditLocDesc] = useState('');
  const [editModeCardId, setEditModeCardId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Find current location details
  const currentLoc = locations.find((l: StorageLocation) => l.id === currentLocId) || null;

  // Filter locations for current level (if currentLocId is null, show top-level locations, i.e., parentId is undefined or null, or its parent doesn't exist anymore)
  const childLocations = locations.filter((l: StorageLocation) => {
    if (currentLocId === null) {
      return !l.parentId || !locations.some((parent: StorageLocation) => parent.id === l.parentId);
    }
    return l.parentId === currentLocId;
  });

  // Items stored directly in current location
  const directItems = items.filter((item: Item) => {
    if (currentLocId === null) return false; // Show items inside specific locations only
    return item.locationId === currentLocId;
  });

  // Calculate items recursively (direct items + items in sub-locations)
  const getRecursiveItemCount = (locId: string): number => {
    let count = items.filter((item: Item) => item.locationId === locId).reduce((sum: number, i: Item) => sum + (i.quantity || 1), 0);
    const subLocs = locations.filter((l: StorageLocation) => l.parentId === locId);
    subLocs.forEach((sub: StorageLocation) => {
      count += getRecursiveItemCount(sub.id);
    });
    return count;
  };

  // Breadcrumbs path
  const getBreadcrumbs = () => {
    const path: { id: string | null; name: string }[] = [{ id: null, name: '全部空间' }];
    if (!currentLocId) return path;

    const traverse = (locId: string) => {
      const loc = locations.find((l: StorageLocation) => l.id === locId);
      if (loc) {
        if (loc.parentId) traverse(loc.parentId);
        path.push({ id: loc.id, name: loc.name });
      }
    };
    traverse(currentLocId);
    return path;
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const newLoc: StorageLocation = {
      id: 'loc-' + Math.random().toString(36).substring(2, 9),
      name: newLocName.trim(),
      description: newLocDesc.trim() || undefined,
      parentId: currentLocId || undefined,
    };

    await db.locations.add(newLoc);
    setNewLocName('');
    setNewLocDesc('');
    setIsAddingLoc(false);
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLocName.trim() || !editingLocId) return;

    await db.locations.update(editingLocId, {
      name: editLocName.trim(),
      description: editLocDesc.trim() || undefined,
    });
    setEditingLocId(null);
  };

  const handleDeleteLocation = async (locId: string) => {
    if (!confirm('确定删除该空间吗？该空间内的子空间将变为顶级空间，该空间内的物品需要重新规划位置。')) return;

    // Remove location
    await db.locations.delete(locId);

    // Update child locations to move up or attach to parent's parent
    const childLocs = locations.filter((l: StorageLocation) => l.parentId === locId);
    const parentLoc = locations.find((l: StorageLocation) => l.id === locId);
    const newParentId = parentLoc?.parentId || undefined;

    for (const child of childLocs) {
      await db.locations.update(child.id, { parentId: newParentId });
    }

    // Reset current location if we just deleted it
    if (currentLocId === locId) {
      setCurrentLocId(newParentId || null);
    }
  };

  return (
    <div>
      <div className="page-title">
        <span>空间整理</span>
        <button className="btn-icon" onClick={() => setIsAddingLoc(true)} title="新增存储空间">
          <Icons.Plus size={24} />
        </button>
      </div>

      {/* Breadcrumb navigation */}
      <div 
        className="card flex-center" 
        style={{ 
          padding: '10px 14px', 
          backgroundColor: 'var(--bg-secondary)', 
          flexWrap: 'wrap', 
          gap: '4px',
          fontSize: '14px',
          marginBottom: '16px'
        }}
      >
        {getBreadcrumbs().map((bc, idx, arr) => (
          <React.Fragment key={bc.id || 'root'}>
            <span 
              style={{ 
                color: idx === arr.length - 1 ? 'var(--text-primary)' : 'var(--accent-color)',
                fontWeight: idx === arr.length - 1 ? '600' : 'normal',
                cursor: idx === arr.length - 1 ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '0 2px'
              }}
              onClick={() => idx !== arr.length - 1 && setCurrentLocId(bc.id)}
            >
              {bc.name}
            </span>
            {idx < arr.length - 1 && (
              <Icons.ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Adding storage location drawer modal */}
      {isAddingLoc && (
        <div className="modal-overlay open" onClick={() => setIsAddingLoc(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">
                新增{currentLoc ? `“${currentLoc.name}”的子空间` : '空间'}
              </span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setIsAddingLoc(false)}
              >
                取消
              </button>
            </div>
            <form onSubmit={handleCreateLocation} className="modal-body">
              <div className="form-group">
                <label className="form-label">空间名称</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newLocName} 
                  onChange={(e) => setNewLocName(e.target.value)} 
                  placeholder="例如：主卧衣柜、客厅电视柜第二抽屉" 
                  required 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">备注描述</label>
                <textarea 
                  className="form-control" 
                  value={newLocDesc} 
                  onChange={(e) => setNewLocDesc(e.target.value)} 
                  placeholder="描述它在房间哪个角落" 
                  rows={3} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                保存空间
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Editing storage location drawer modal */}
      {editingLocId && (
        <div className="modal-overlay open" onClick={() => setEditingLocId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">编辑空间</span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setEditingLocId(null)}
              >
                取消
              </button>
            </div>
            <form onSubmit={handleUpdateLocation} className="modal-body">
              <div className="form-group">
                <label className="form-label">空间名称</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editLocName} 
                  onChange={(e) => setEditLocName(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">备注描述</label>
                <textarea 
                  className="form-control" 
                  value={editLocDesc} 
                  onChange={(e) => setEditLocDesc(e.target.value)} 
                  rows={3} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                更新空间
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List of sub-locations */}
      <div className="section-title">
        <span>收纳子空间 ({childLocations.length})</span>
      </div>

      {childLocations.length === 0 ? (
        <div className="card empty-state" style={{ padding: '24px' }}>
          <Icons.FolderPlus className="empty-state-icon" size={32} />
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>当前位置没有子空间</p>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setIsAddingLoc(true)}>
            新建子空间
          </button>
        </div>
      ) : (
        <div 
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}
          onClick={() => setEditModeCardId(null)}
        >
          {childLocations.map((loc: StorageLocation) => {
            const count = getRecursiveItemCount(loc.id);
            const isInEditMode = editModeCardId === loc.id;

            const handleTouchStart = () => {
              longPressTriggeredRef.current = false;
              longPressTimerRef.current = setTimeout(() => {
                longPressTriggeredRef.current = true;
                setEditModeCardId(loc.id);
              }, 500);
            };

            const handleTouchEnd = () => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            };

            const handleTouchMove = () => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            };

            const handleClick = () => {
              if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
              }
              if (isInEditMode) {
                setEditModeCardId(null);
                return;
              }
              setCurrentLocId(loc.id);
            };

            const handleContextMenu = (e: React.MouseEvent) => {
              e.preventDefault();
              setEditModeCardId(isInEditMode ? null : loc.id);
            };

            return (
              <div 
                key={loc.id} 
                className="card card-interactive" 
                style={{ 
                  margin: 0, 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '110px',
                  cursor: 'pointer',
                  position: 'relative',
                  outline: isInEditMode ? '2px solid var(--accent-color)' : 'none',
                  outlineOffset: '-2px'
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onContextMenu={handleContextMenu}
                onClick={handleClick}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent-color)', padding: '6px', borderRadius: '8px' }}>
                    <Icons.Folder size={20} />
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{count} 件物品</span>
                </div>
                {/* Edit mode action bar */}
                {isInEditMode && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-light)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, minHeight: '44px', fontSize: '13px', padding: '0 8px' }}
                      onClick={() => {
                        setEditingLocId(loc.id);
                        setEditLocName(loc.name);
                        setEditLocDesc(loc.description || '');
                        setEditModeCardId(null);
                      }}
                    >
                      <Icons.Edit2 size={14} style={{ marginRight: '4px' }} />
                      编辑
                    </button>
                    <button 
                      className="btn btn-danger"
                      style={{ flex: 1, minHeight: '44px', fontSize: '13px', padding: '0 8px' }}
                      onClick={() => {
                        handleDeleteLocation(loc.id);
                        setEditModeCardId(null);
                      }}
                    >
                      <Icons.Trash2 size={14} style={{ marginRight: '4px' }} />
                      删除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Items directly in current location */}
      {currentLocId !== null && (
        <>
          <div className="section-title">
            <span>存放的物品 ({directItems.length})</span>
          </div>

          {directItems.length === 0 ? (
            <div className="card empty-state" style={{ padding: '32px' }}>
              <Icons.Inbox className="empty-state-icon" size={32} />
              <p style={{ fontSize: '14px' }}>当前层级没有放置物品</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {directItems.map((item: Item, idx: number) => (
                <div 
                  key={item.id} 
                  className="flex-between" 
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: idx === directItems.length - 1 ? 'none' : '1px solid var(--border-light)',
                    cursor: 'pointer'
                  }}
                  onClick={() => item.id && onSelectItem(item.id)}
                >
                  <div className="flex-center">
                    {item.photo ? (
                      <img 
                        src={item.photo} 
                        alt={item.name} 
                        style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', marginRight: '12px' }} 
                      />
                    ) : (
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '6px', 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-tertiary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginRight: '12px'
                        }}
                      >
                        <Icons.Package size={20} />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '500' }}>{item.name}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>数量: {item.quantity}</span>
                    </div>
                  </div>
                  <Icons.ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
