import React, { useState, useEffect, useRef } from 'react';
import { db, type Item, type Category, type StorageLocation } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Icons from 'lucide-react';

interface ItemFormProps {
  itemId: number | null; // null if adding new item
  onClose: () => void;
  onSaved: () => void;
  initialCategoryId?: string;
  initialLocationId?: string;
}

export const ItemForm: React.FC<ItemFormProps> = ({ 
  itemId, 
  onClose, 
  onSaved,
  initialCategoryId,
  initialLocationId
}) => {
  const categories = (useLiveQuery(() => db.categories.toArray()) || []) as Category[];
  const locations = (useLiveQuery(() => db.locations.toArray()) || []) as StorageLocation[];
  
  // All tags in DB for suggestions
  const items = (useLiveQuery(() => db.items.toArray()) || []) as Item[];
  const allExistingTags = Array.from(new Set(items.flatMap((item: Item) => item.tags || []))) as string[];

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string>(''); // Base64
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard occlusion prevention: scroll focused element into view on visualViewport resize
  useEffect(() => {
    const handleResize = () => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Set default values or load item for editing
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(initialCategoryId || categories[0].id);
    }
    if (locations.length > 0 && !locationId) {
      // Find a default location (e.g. first child or top level)
      setLocationId(initialLocationId || locations[0].id);
    }
  }, [categories, locations, initialCategoryId, initialLocationId]);

  useEffect(() => {
    if (itemId !== null) {
      const loadItem = async () => {
        const item = await db.items.get(itemId);
        if (item) {
          setName(item.name);
          setCategoryId(item.categoryId);
          setLocationId(item.locationId);
          setQuantity(item.quantity);
          setPrice(item.price ? item.price.toString() : '');
          setPurchaseDate(item.purchaseDate || '');
          setExpiryDate(item.expiryDate || '');
          setNotes(item.notes || '');
          setPhoto(item.photo || '');
          setTags(item.tags || []);
        }
      };
      loadItem();
    }
  }, [itemId]);

  // Client-side image compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressedBase64 = await compressImage(file);
      setPhoto(compressedBase64);
    } catch (err) {
      console.error(err);
      alert('图片压缩失败');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Get hierarchical location full path
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !locationId) {
      alert('请填写物品名称、分类和空间位置！');
      return;
    }

    const itemData: Omit<Item, 'id'> = {
      name: name.trim(),
      categoryId,
      locationId,
      quantity: Math.max(1, quantity),
      price: price ? parseFloat(price) : undefined,
      purchaseDate: purchaseDate || undefined,
      expiryDate: expiryDate || undefined,
      tags,
      notes: notes.trim() || undefined,
      photo: photo || undefined
    };

    try {
      if (itemId === null) {
        await db.items.add(itemData as Item);
      } else {
        await db.items.update(itemId, itemData);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert('保存失败！');
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">{itemId === null ? '登记新物品' : '编辑物品'}</span>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
            onClick={onClose}
          >
            取消
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Photo upload section */}
          <div style={{ alignSelf: 'center', position: 'relative', width: '100px', height: '100px', marginBottom: '10px' }}>
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '16px', 
                backgroundColor: 'var(--bg-tertiary)',
                border: '2px dashed var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : isCompressing ? (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>压缩中...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-tertiary)' }}>
                  <Icons.Camera size={26} />
                  <span style={{ fontSize: '11px', marginTop: '4px' }}>添加照片</span>
                </div>
              )}
            </div>
            {photo && (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setPhoto(''); }}
                style={{ 
                  position: 'absolute', 
                  top: '-18px', 
                  right: '-18px', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b30',
                  border: '2px solid var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icons.X size={12} color="#fff" />
                </span>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>

          {/* Name */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">物品名称</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="输入物品名称" 
              required 
            />
          </div>

          <div className="grid-2">
            {/* Category */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">所属分类</label>
              <select 
                className="form-control" 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">收纳位置</label>
              <select 
                className="form-control" 
                value={locationId} 
                onChange={(e) => setLocationId(e.target.value)}
                required
              >
                {locations.map((loc: StorageLocation) => (
                  <option key={loc.id} value={loc.id}>{getLocationFullPath(loc.id)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            {/* Quantity */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">物品数量</label>
              <div className="flex-center" style={{ gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', minWidth: '44px', minHeight: '44px' }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ textAlign: 'center', padding: '8px' }}
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1} 
                  required 
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', minWidth: '44px', minHeight: '44px' }}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">单价 (元)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                placeholder="可选输入" 
                min={0}
              />
            </div>
          </div>

          <div className="grid-2">
            {/* Purchase Date */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">购买日期</label>
              <input 
                type="date" 
                className="form-control" 
                value={purchaseDate} 
                onChange={(e) => setPurchaseDate(e.target.value)} 
              />
            </div>

            {/* Expiry Date */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">保质到期</label>
              <input 
                type="date" 
                className="form-control" 
                value={expiryDate} 
                onChange={(e) => setExpiryDate(e.target.value)} 
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">物品标签</label>
            <div 
              className="form-control flex-center" 
              style={{ 
                flexWrap: 'wrap', 
                gap: '6px', 
                padding: '6px 10px', 
                minHeight: '44px',
                alignContent: 'flex-start'
              }}
            >
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="tag-badge tag-badge-active" 
                  style={{ margin: 0, padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}
                >
                  {tag}
                  <Icons.X 
                    size={12} 
                    style={{ marginLeft: '4px', cursor: 'pointer' }} 
                    onClick={() => handleRemoveTag(tag)} 
                  />
                </span>
              ))}
              <input 
                type="text" 
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  flex: 1, 
                  background: 'transparent', 
                  fontSize: '15px',
                  minWidth: '60px'
                }} 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder={tags.length === 0 ? "回车添加标签" : ""}
              />
            </div>
            {/* Quick tag suggestions */}
            {allExistingTags.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allExistingTags.filter(t => !tags.includes(t)).slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-light)',
                      borderRadius: '100px',
                      padding: '0 16px',
                      minHeight: '44px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    onClick={() => handleAddTag(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">备注备注</label>
            <textarea 
              className="form-control" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="备注一些购买渠道、保修信息等" 
              rows={2} 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={isCompressing}
          >
            保存物品
          </button>
        </form>
      </div>
    </div>
  );
};
