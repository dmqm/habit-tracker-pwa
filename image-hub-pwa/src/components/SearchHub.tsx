import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../data/presets';
import { Search, Upload, RefreshCw, Sliders, Heart, Check, Trash2, Download, ArrowRight } from 'lucide-react';

// Combined item interface for rendering
interface SearchResultItem {
  id: string;
  url: string;
  title: string;
  tags: string[];
  color: { r: number; g: number; b: number };
  isPreset: boolean;
}

export const SearchHub: React.FC = () => {
  const { pixabayKey, addToGallery, gallery, importToStudio } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSource, setActiveSource] = useState<'online' | 'local'>('local');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  
  // Color Search State
  const [selectedColor, setSelectedColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [selectedColorName, setSelectedColorName] = useState<string>('');
  const [uploadedColorImage, setUploadedColorImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset Colors for Quick Click Filter
  const colorPalette = [
    { name: '艳红', color: { r: 239, g: 68, b: 68 } },
    { name: '暖橙', color: { r: 249, g: 115, b: 22 } },
    { name: '明黄', color: { r: 234, g: 179, b: 8 } },
    { name: '翠绿', color: { r: 34, g: 197, b: 94 } },
    { name: '青蓝', color: { r: 6, g: 182, b: 212 } },
    { name: '深蓝', color: { r: 59, g: 130, b: 246 } },
    { name: '幽紫', color: { r: 168, g: 85, b: 247 } },
    { name: '极光粉', color: { r: 236, g: 72, b: 153 } },
    { name: '暗夜黑', color: { r: 15, g: 15, b: 25 } }
  ];

  // Saved success state for feedback
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  // Initialize and Search
  useEffect(() => {
    handleSearch();
  }, [activeSource]);

  // Trigger search when user presses Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorMsg('');
    
    // Clear uploaded color image when searching
    if (searchQuery && uploadedColorImage) {
      setUploadedColorImage(null);
      setSelectedColor(null);
    }

    try {
      if (activeSource === 'local') {
        // Local Filter
        const localResults: SearchResultItem[] = [];
        
        // 1. Add preset images
        PRESET_IMAGES.forEach(p => {
          if (!searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags.some(t => t.includes(searchQuery))) {
            localResults.push({
              id: p.id,
              url: p.url,
              title: p.title,
              tags: p.tags,
              color: p.color,
              isPreset: true
            });
          }
        });
        
        // 2. Add saved gallery images
        gallery.forEach(g => {
          if (!searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.tags.some(t => t.includes(searchQuery))) {
            localResults.push({
              id: g.id,
              url: g.dataUrl,
              title: g.title,
              tags: g.tags,
              color: g.color,
              isPreset: false
            });
          }
        });
        
        setSearchResults(localResults);
      } else {
        // Online Pixabay Search
        if (!pixabayKey) {
          setErrorMsg('未配置 Pixabay API Key。请在“系统设置”中填入您的 Key，或使用“内置图库”。');
          setSearchResults([]);
          setLoading(false);
          return;
        }

        const query = searchQuery.trim() || 'beautiful nature';
        const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('网络响应错误，请检查 API Key 是否正确或网络是否通畅');
        }
        
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
          // Pixabay returns colors as dominant tags, but we'll assign a mock/average color for similarity search
          // Or we can dynamically compute the average color if we draw it to a canvas. 
          // For Pixabay images, we will dynamically compute it on-demand or use a helper average color.
          const onlineResults: SearchResultItem[] = data.hits.map((hit: any) => ({
            id: `online_${hit.id}`,
            url: hit.webformatURL,
            title: hit.tags || '在线图片',
            tags: (hit.tags || '').split(',').map((t: string) => t.trim()),
            // Default middle grey color, we can extract actual color when importing to Studio
            color: { r: 128, g: 128, b: 128 },
            isPreset: false
          }));
          setSearchResults(onlineResults);
        } else {
          setSearchResults([]);
          setErrorMsg('未找到相关图片，请尝试其他关键词。');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '获取图片失败，请检查国内网络连接或 Pixabay Key。');
      // Auto fallback to local
      if (activeSource === 'online') {
        setErrorMsg('在线获取失败，已自动切换到内置图库。');
        setActiveSource('local');
      }
    } finally {
      setLoading(false);
    }
  };

  // Color Similarity Matcher
  // Calculates Euclidean distance: sqrt((r1-r2)^2 + (g1-g2)^2 + (b1-b2)^2)
  const getColorDistance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };

  // Sort search results based on color proximity if a color is selected
  const getSortedResults = () => {
    if (!selectedColor) return searchResults;
    return [...searchResults].sort((a, b) => {
      return getColorDistance(a.color, selectedColor) - getColorDistance(b.color, selectedColor);
    });
  };

  // Extract average color from uploaded image
  const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedColorImage(dataUrl);

      // Extract color
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 16, 16);
          const imgData = ctx.getImageData(0, 0, 16, 16);
          const data = imgData.data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          const avgColor = {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
          };
          setSelectedColor(avgColor);
          setSelectedColorName('图片提取色');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveToGallery = async (item: SearchResultItem) => {
    try {
      // If it's a URL (like Pixabay), we convert to Base64 first to store in IndexedDB
      let dataUrl = item.url;
      if (item.url.startsWith('http')) {
        setLoading(true);
        const response = await fetch(item.url);
        const blob = await response.blob();
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setLoading(false);
      }

      await addToGallery(dataUrl, item.title, item.tags, item.color);
      setSavedIds(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setSavedIds(prev => ({ ...prev, [item.id]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('保存失败，可能是由于跨域限制无法下载在线图片。建议直接点击“导入编辑”！');
      setLoading(false);
    }
  };

  const handleImportToStudio = async (item: SearchResultItem) => {
    try {
      let dataUrl = item.url;
      if (item.url.startsWith('http')) {
        setLoading(true);
        // Fetch via blob to convert to Base64 to bypass Canvas CORS issues when drawing
        const response = await fetch(item.url);
        const blob = await response.blob();
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setLoading(false);
      }
      importToStudio(dataUrl);
    } catch (err) {
      console.error(err);
      // Fallback: import URL directly (might trigger CORS on canvas later, but allows proceeding)
      importToStudio(item.url);
      setLoading(false);
    }
  };

  const sortedResults = getSortedResults();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">搜图</h1>
      </div>

      {/* Source & Search Control */}
      <div className="glass-panel" style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {/* Tab Switch */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              className={`btn ${activeSource === 'local' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '6px 0', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveSource('local')}
            >
              本地图库
            </button>
            <button
              className={`btn ${activeSource === 'online' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '6px 0', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveSource('online')}
            >
              在线搜图
            </button>
          </div>

          {/* Search Inputs */}
          <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
            <input
              type="text"
              className="input-field"
              style={{ flex: '1', margin: 0 }}
              placeholder={activeSource === 'local' ? "搜索标签或名称..." : "输入英文关键词..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn btn-primary" style={{ padding: '0 12px' }} onClick={handleSearch} disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" style={{ width: 14 }} /> : <Search style={{ width: 14 }} />}
            </button>
          </div>
        </div>

        {/* Color Search Panel (以色搜图) */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sliders style={{ width: 14, color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>以色搜图</span>
            {selectedColor && (
              <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', border: '1px solid var(--primary)', padding: '1px 6px', borderRadius: '6px', color: 'var(--text-primary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {selectedColorName}
                <Trash2
                  style={{ width: 10, cursor: 'pointer', color: 'var(--danger)' }}
                  onClick={() => {
                    setSelectedColor(null);
                    setUploadedColorImage(null);
                  }}
                />
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Color Palette Filter */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {colorPalette.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedColor(item.color);
                    setSelectedColorName(item.name);
                    setUploadedColorImage(null);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                    backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    position: 'relative',
                    border: selectedColor && selectedColor.r === item.color.r && selectedColor.g === item.color.g && selectedColor.b === item.color.b
                      ? '2px solid #ffffff'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                  title={item.name}
                />
              ))}
            </div>

            {/* Upload image to match color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleColorImageUpload}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload style={{ width: 12 }} />
                上传图片找色
              </button>
              
              {uploadedColorImage && (
                <img
                  src={uploadedColorImage}
                  alt="Upload Color Source"
                  style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--primary)' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="glass-panel animate-fade-in" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Grid List */}
      {loading && searchResults.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem', color: 'var(--text-secondary)' }}>
          <RefreshCw className="animate-spin" style={{ width: 40, height: 40, color: 'var(--primary)' }} />
          <span>正在加载美图...</span>
        </div>
      ) : sortedResults.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <span>暂无图片数据。请输入其他关键词，或者在右上角切换至“内置与本地图库”！</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {sortedResults.map((item) => (
            <div
              key={item.id}
              className="glass-panel animate-fade-in"
              onClick={() => setSelectedItem(item)}
              style={{
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Image Box */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: '#0a0a14' }}>
                <img
                  src={item.url}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                
                {/* Labels & Tags */}
                {item.isPreset && (
                  <span style={{ position: 'absolute', top: '3px', left: '3px', background: 'var(--primary)', color: '#fff', fontSize: '0.55rem', fontWeight: 600, padding: '1px 3px', borderRadius: '2px' }}>
                    内置
                  </span>
                )}
                
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

              {/* Text Meta */}
              <div style={{ padding: '3px 1px 1px 1px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.65rem', fontWeight: 500, margin: 0, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet Drawer for Item Actions */}
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
                <img src={selectedItem.url} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedItem.title}</h3>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {selectedItem.isPreset ? '内置矢量图' : '在线图片资源'}
                </p>
              </div>
            </div>

            {/* Actions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  handleImportToStudio(selectedItem);
                  setSelectedItem(null);
                }}
              >
                <span>🎨 导入画室编辑</span>
                <ArrowRight style={{ width: 14 }} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${savedIds[selectedItem.id] ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1.2, padding: '0.6rem 0', fontSize: '0.75rem', color: savedIds[selectedItem.id] ? 'var(--success)' : '' }}
                  onClick={() => {
                    handleSaveToGallery(selectedItem);
                    // Do not close drawer, user can see saved success feedback!
                  }}
                  disabled={savedIds[selectedItem.id]}
                >
                  {savedIds[selectedItem.id] ? <Check style={{ width: 14 }} /> : <Heart style={{ width: 14 }} />}
                  <span>{savedIds[selectedItem.id] ? '已收藏' : '收藏图片'}</span>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ flex: 0.8, padding: '0.6rem 0', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedItem.url;
                    link.download = `search_${selectedItem.title.replace(/\s+/g, '_')}.png`;
                    link.click();
                  }}
                >
                  <Download style={{ width: 14 }} />
                  <span>下载</span>
                </button>
              </div>

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
