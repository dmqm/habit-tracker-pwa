import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { GalleryItem } from '../context/AppContext';
import { Trash2, Download, Copy, Image, Check, Tag, ArrowRight } from 'lucide-react';

export const Gallery: React.FC = () => {
  const { gallery, deleteFromGallery, importToStudio, setActiveTab } = useApp();
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Extract all unique tags
  const allTags = ['all', ...Array.from(new Set(gallery.flatMap(item => item.tags)))];

  const handleCopy = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopySuccessId(item.id);
      setTimeout(() => setCopySuccessId(null), 2000);
    } catch (err) {
      console.error(err);
      alert('您的浏览器可能不支持复制图片到剪贴板，请尝试点击下载图片按钮！');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要从本地库删除这张图片吗？此操作无法撤销。')) {
      await deleteFromGallery(id);
    }
  };

  const handleDownload = (item: GalleryItem) => {
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = `${item.title.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.click();
  };

  // Filter gallery
  const filteredGallery = selectedTag === 'all'
    ? gallery
    : gallery.filter(item => item.tags.includes(selectedTag));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">本地画廊</h1>
      </div>

      {/* Tags Filter bar */}
      {gallery.length > 0 && (
        <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Tag style={{ width: 14 }} />
            分类：
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`btn ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px' }}
                onClick={() => setSelectedTag(tag)}
              >
                {tag === 'all' ? '全部' : `#${tag}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid gallery */}
      {filteredGallery.length === 0 ? (
        <div className="glass-panel animate-fade-in" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-secondary)' }}>
          <Image style={{ width: 44, height: 44, strokeWidth: 1.25, color: 'var(--text-muted)', marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
          {gallery.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>您的画廊空空如也</h3>
                <p style={{ fontSize: '0.75rem', lineHeight: '1.4', margin: 0 }}>完成制作或搜图后，点击“收藏”即可保存在此。</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '0.7rem' }} onClick={() => setActiveTab('tools')}>
                  🎨 去工坊创作
                </button>
                <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.7rem' }} onClick={() => setActiveTab('search')}>
                  🔍 去搜图找图
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600 }}>没有匹配该分类的图片</h3>
              <p style={{ fontSize: '0.75rem', margin: 0 }}>点击上方的“全部”按钮以查看完整图库。</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              className="glass-panel animate-fade-in"
              onClick={() => setSelectedItem(item)}
              style={{
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                transition: 'border-color 0.2s'
              }}
            >
              {/* Image Preview Box */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: '#0a0a14' }}>
                <img
                  src={item.dataUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />

                {/* Color Dot Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                    border: '1px solid #ffffff',
                  }}
                />
              </div>

              {/* Text metadata */}
              <div style={{ padding: '3px 1px 1px 1px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.65rem', fontWeight: 500, margin: 0, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet Drawer for Gallery Item Actions */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '600px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              margin: 0,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
              borderTop: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#0a0a14', flexShrink: 0 }}>
                <img src={selectedItem.dataUrl} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedItem.title}</h3>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  分类标签: {itemTagsDisplay(selectedItem)}
                </p>
              </div>
            </div>

            {/* Actions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  importToStudio(selectedItem.dataUrl);
                  setSelectedItem(null);
                }}
              >
                <span>🎨 导入画室编辑</span>
                <ArrowRight style={{ width: 14 }} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleCopy(selectedItem)}
                >
                  {copySuccessId === selectedItem.id ? <Check style={{ width: 14, color: 'var(--success)' }} /> : <Copy style={{ width: 14 }} />}
                  <span>{copySuccessId === selectedItem.id ? '已复制' : '复制图片'}</span>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleDownload(selectedItem)}
                >
                  <Download style={{ width: 14 }} />
                  <span>下载</span>
                </button>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}
                onClick={() => {
                  handleDelete(selectedItem.id);
                  setSelectedItem(null);
                }}
              >
                <Trash2 style={{ width: 14, marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                <span>从本地库删除</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                onClick={() => setSelectedItem(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper inside the file to format tags display
function itemTagsDisplay(item: GalleryItem) {
  if (!item.tags || item.tags.length === 0) return '无';
  return item.tags.map(t => `#${t}`).join(', ');
}
