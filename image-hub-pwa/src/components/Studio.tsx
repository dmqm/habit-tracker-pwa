import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCw, FlipHorizontal, FlipVertical, Undo, Redo, Download, Heart, Check, Trash2, Edit2, ArrowLeft, Upload } from 'lucide-react';
import { PRESET_IMAGES } from '../data/presets';

interface FilterPreset {
  name: string;
  class: string;
  filterString: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { name: '原图 (Normal)', class: 'normal', filterString: 'none' },
  { name: '怀旧复古 (Vintage)', class: 'vintage', filterString: 'sepia(0.6) contrast(1.1) brightness(0.95)' },
  { name: '赛博朋克 (Cyberpunk)', class: 'cyberpunk', filterString: 'hue-rotate(60deg) saturate(1.8) contrast(1.2)' },
  { name: '黑白胶片 (Grayscale)', class: 'grayscale', filterString: 'grayscale(1) contrast(1.25)' },
  { name: '冷酷冬日 (Cool)', class: 'cool', filterString: 'hue-rotate(190deg) saturate(1.2) brightness(1.05)' },
  { name: '温馨阳光 (Warm)', class: 'warm', filterString: 'sepia(0.35) saturate(1.4) hue-rotate(-10deg)' },
  { name: '反色艺术 (Invert)', class: 'invert', filterString: 'invert(1)' },
  { name: '梦幻朦胧 (Dream)', class: 'dream', filterString: 'blur(3px) saturate(1.2)' }
];

export const Studio: React.FC = () => {
  const { currentImage, setCurrentImage, addToGallery, setActiveSubTool } = useApp();

  // Settings
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);

  // Creative Filters
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [pixelate, setPixelate] = useState(false);
  const [pixelSize, setPixelSize] = useState(10);

  // Tools
  const [activeTool, setActiveTool] = useState<'adjust' | 'filter' | 'draw'>('adjust');

  // Pencil Draw Settings
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushWidth, setBrushWidth] = useState(8);

  // Undo/Redo Stacks
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup/load image on Canvas
  useEffect(() => {
    if (currentImage) {
      loadImageToCanvas(currentImage, true);
    }
  }, [currentImage]);

  // Redraw when adjustments change
  useEffect(() => {
    if (currentImage) {
      applyFilters();
    }
  }, [brightness, contrast, saturation, blur, hueRotate, selectedFilter, pixelate, pixelSize]);

  // Load Image onto Canvas
  const loadImageToCanvas = (src: string, resetSettings = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (resetSettings) {
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setBlur(0);
      setHueRotate(0);
      setSelectedFilter(FILTER_PRESETS[0]);
      setPixelate(false);
      setHistory([]);
      setHistoryIdx(-1);
    }

    const img = new Image();
    img.onload = () => {
      // Scale down large images to prevent browser lag, while maintaining aspect ratio
      const maxDim = 1200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      if (resetSettings) {
        // Save initial state to history
        const dataUrl = canvas.toDataURL();
        setHistory([dataUrl]);
        setHistoryIdx(0);
      }
    };
    img.src = src;
  };

  // Build filter CSS string
  const getFilterString = () => {
    let cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
    if (selectedFilter.filterString !== 'none') {
      cssFilter = `${cssFilter} ${selectedFilter.filterString}`;
    }
    return cssFilter;
  };

  // Redraw original canvas and apply adjustments
  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIdx < 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply filters directly on context (for high performance canvas rendering)
      if (typeof (ctx as any).filter !== 'undefined') {
        ctx.filter = getFilterString();
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
      } else {
        // Fallback CSS style
        canvas.style.filter = getFilterString();
        (ctx as any).drawImage(img, 0, 0);
      }

      // Draw Pixelation if enabled
      if (pixelate) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width / pixelSize;
        tempCanvas.height = canvas.height / pixelSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
        }
      }
      ctx.restore();
    };
    // Draw using the base image from current history step (without temporary filters applied)
    img.src = history[historyIdx];
  };

  // Push new state to history stack (for drawing, rotation, crop)
  const pushHistoryState = (dataUrl: string) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Geometrical Transforms
  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load current display state (with filters baked in) to rotate it
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.height;
      tempCanvas.height = canvas.width;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(Math.PI / 2);
        tempCtx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
        
        // Overwrite main canvas size
        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Push state
        const rotatedDataUrl = canvas.toDataURL();
        pushHistoryState(rotatedDataUrl);
        
        // Reset temporary sliders since they are now baked into the rotated state
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setBlur(0);
        setHueRotate(0);
        setSelectedFilter(FILTER_PRESETS[0]);
        setPixelate(false);
      }
    };
    img.src = canvas.toDataURL();
  };

  const handleFlip = (direction: 'h' | 'v') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (direction === 'h') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      const flippedDataUrl = canvas.toDataURL();
      pushHistoryState(flippedDataUrl);
      
      // Reset temporary sliders
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setBlur(0);
      setHueRotate(0);
      setSelectedFilter(FILTER_PRESETS[0]);
      setPixelate(false);
    };
    img.src = canvas.toDataURL();
  };

  // Drawing Functionality
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    if (!coords) return;

    ctx.save();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.restore();
    }
    
    // Save drawn state to history
    const dataUrl = canvas.toDataURL();
    pushHistoryState(dataUrl);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (window.confirm('确定清除画布并回退到初始图片吗？所有画笔和调节将丢失。')) {
      if (history.length > 0) {
        setHistoryIdx(0);
        loadImageToCanvas(history[0], true);
      }
    }
  };

  // Save to Gallery
  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Calculate color descriptor
      const ctx = canvas.getContext('2d');
      let color = { r: 128, g: 128, b: 128 };
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        color = { r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) };
      }

      await addToGallery(dataUrl, `编辑于Studio_${Date.now()}`, ['画廊', '编辑'], color);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `studio_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: 0 }}>
        <button 
          className="btn btn-secondary" 
          style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setActiveSubTool('none')}
          title="返回工坊"
        >
          <ArrowLeft style={{ width: 14 }} />
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 800, background: 'linear-gradient(to right, var(--text-primary), #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          画室 Studio
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Canvas Display Area */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px', margin: 0, padding: '0.6rem' }}>
          {currentImage ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '220px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: activeTool === 'draw' ? 'crosshair' : 'default',
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                  maxWidth: '100%',
                  maxHeight: '210px',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-glass)',
                  background: '#0a0a14',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '12px', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Edit2 style={{ width: 28, height: 28, color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>编辑区为空</span>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px' }} 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload style={{ width: 14 }} />
                上传本地图片
              </button>

              {/* Preset Selector inside Studio Empty State */}
              <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left', fontWeight: 600 }}>
                  💡 快速导入内置素材底图：
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                  {PRESET_IMAGES.map((img) => (
                    <div
                      key={img.id}
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const response = await fetch(img.url);
                          const blob = await response.blob();
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCurrentImage(reader.result as string);
                            setHistory([reader.result as string]);
                            setHistoryIdx(0);
                            setLoading(false);
                          };
                          reader.readAsDataURL(blob);
                        } catch (err) {
                          console.error(err);
                          setCurrentImage(img.url);
                          setHistory([img.url]);
                          setHistoryIdx(0);
                          setLoading(false);
                        }
                      }}
                      style={{
                        flex: '0 0 54px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40px' }}>
                        {img.title.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick action buttons below canvas */}
          {currentImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.6rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
              {/* Operations Row */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={handleUndo} disabled={historyIdx <= 0}>
                  <Undo style={{ width: 12 }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={handleRedo} disabled={historyIdx >= history.length - 1}>
                  <Redo style={{ width: 12 }} />
                </button>
                
                <div style={{ width: '1px', height: '14px', background: 'var(--border-color)' }} />
                
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={handleRotate}>
                  <RotateCw style={{ width: 12 }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleFlip('h')}>
                  <FlipHorizontal style={{ width: 12 }} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleFlip('v')}>
                  <FlipVertical style={{ width: 12 }} />
                </button>

                <div style={{ width: '1px', height: '14px', background: 'var(--border-color)' }} />
                
                <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={handleClearCanvas}>
                  <Trash2 style={{ width: 12 }} />
                </button>
              </div>

              {/* Save & Export Row */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem' }} onClick={handleDownload}>
                  <Download style={{ width: 12 }} />
                  下载
                </button>
                <button
                  className={`btn ${saveSuccess ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1.2, padding: '4px 0', fontSize: '0.75rem', color: saveSuccess ? 'var(--success)' : '' }}
                  onClick={handleSaveToGallery}
                  disabled={loading}
                >
                  {saveSuccess ? <Check style={{ width: 12 }} /> : <Heart style={{ width: 12 }} />}
                  <span>{saveSuccess ? '已收藏' : '收藏'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="glass-panel" style={{ margin: 0, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Sub Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              className={`btn ${activeTool === 'adjust' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveTool('adjust')}
            >
              微调
            </button>
            <button
              className={`btn ${activeTool === 'filter' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveTool('filter')}
            >
              滤镜
            </button>
            <button
              className={`btn ${activeTool === 'draw' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveTool('draw')}
            >
              涂鸦
            </button>
          </div>

          <div style={{ minHeight: '120px' }}>
            {/* 1. Adjustment Panel */}
            {activeTool === 'adjust' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>亮度 (Brightness)</span>
                    <span>{brightness}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>对比度 (Contrast)</span>
                    <span>{contrast}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>饱和度 (Saturation)</span>
                    <span>{saturation}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>模糊 (Blur)</span>
                    <span>{blur}px</span>
                  </label>
                  <input type="range" min="0" max="20" step="0.5" value={blur} onChange={(e) => setBlur(parseFloat(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>色相旋转 (Hue Rotate)</span>
                    <span>{hueRotate}°</span>
                  </label>
                  <input type="range" min="0" max="360" value={hueRotate} onChange={(e) => setHueRotate(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} disabled={!currentImage} />
                </div>
              </div>
            )}

            {/* 2. Filter Panel */}
            {activeTool === 'filter' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Horizontal Scroll list for Filters */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', WebkitOverflowScrolling: 'touch' }}>
                  {FILTER_PRESETS.map((filter) => (
                    <div
                      key={filter.name}
                      onClick={() => currentImage && setSelectedFilter(filter)}
                      style={{
                        flex: '0 0 85px',
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedFilter.name === filter.name ? 'var(--primary-glow)' : 'var(--bg-input)',
                        border: `1px solid ${selectedFilter.name === filter.name ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: currentImage ? 'pointer' : 'not-allowed',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        opacity: currentImage ? 1 : 0.5,
                        transition: 'var(--transition-smooth)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {filter.name.split(' ')[0]}
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      id="chk-pixelate"
                      checked={pixelate}
                      onChange={(e) => currentImage && setPixelate(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
                      disabled={!currentImage}
                    />
                    <label htmlFor="chk-pixelate" className="input-label" style={{ cursor: 'pointer', margin: 0, fontSize: '0.75rem' }}>启用像素画滤镜 (Pixelate)</label>
                  </div>
                  {pixelate && (
                    <div className="input-group animate-fade-in" style={{ margin: 0, gap: '4px' }}>
                      <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span>像素块尺寸</span>
                        <span>{pixelSize}px</span>
                      </label>
                      <input type="range" min="4" max="30" step="1" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Drawing Panel */}
            {activeTool === 'draw' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="input-group" style={{ margin: 0, gap: '6px' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>画笔颜色 (Brush Color)</label>
                  {/* Horizontal Scroll for Colors */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', WebkitOverflowScrolling: 'touch' }}>
                    {['#6366f1', '#a855f7', '#14b8a6', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#000000'].map((color) => (
                      <div
                        key={color}
                        onClick={() => setBrushColor(color)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          cursor: 'pointer',
                          flexShrink: 0,
                          border: brushColor === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          transform: brushColor === color ? 'scale(1.15)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>画笔粗细 (Brush Width)</span>
                    <span>{brushWidth}px</span>
                  </label>
                  <input type="range" min="1" max="50" step="1" value={brushWidth} onChange={(e) => setBrushWidth(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
