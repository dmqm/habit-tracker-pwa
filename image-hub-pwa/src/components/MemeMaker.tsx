import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Laugh, Copy, Download, Heart, Check, Plus, Trash2, ArrowLeft } from 'lucide-react';

interface MemeTemplate {
  id: string;
  name: string;
  svg: string; // Inline SVG
  defaultText: string;
  layout: 'top-bottom' | 'panda' | 'split';
}

interface MemeText {
  id: string;
  text: string;
  x: number; // 0 to 500
  y: number; // 0 to 500
  size: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
}

interface MemeSticker {
  id: string;
  type: 'glasses' | 'chain' | 'question' | 'tears' | 'blush';
  x: number; // 0 to 500
  y: number; // 0 to 500
  size: number;
}

const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: 'meme_panda',
    name: '经典熊猫头 (Panda Head)',
    layout: 'panda',
    defaultText: '让我看看是谁在写 Bug',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <ellipse cx="120" cy="110" rx="35" ry="25" fill="#1f1f1f"/>
      <ellipse cx="280" cy="110" rx="35" ry="25" fill="#1f1f1f"/>
      <path d="M 100,180 C 80,260 120,320 200,320 C 280,320 320,260 300,180 C 290,140 270,120 200,120 C 130,120 110,140 100,180 Z" fill="#ffffff" stroke="#1f1f1f" stroke-width="8"/>
      <ellipse cx="160" cy="190" rx="30" ry="20" fill="#1f1f1f" transform="rotate(-15, 160, 190)"/>
      <ellipse cx="240" cy="190" rx="30" ry="20" fill="#1f1f1f" transform="rotate(15, 240, 190)"/>
      <circle cx="165" cy="188" r="6" fill="#ffffff"/>
      <circle cx="235" cy="188" r="6" fill="#ffffff"/>
      <path d="M 130,165 Q 160,150 175,175" fill="none" stroke="#1f1f1f" stroke-width="6" stroke-linecap="round"/>
      <path d="M 270,165 Q 240,150 225,175" fill="none" stroke="#1f1f1f" stroke-width="6" stroke-linecap="round"/>
      <polygon points="190,215 210,215 200,225" fill="#1f1f1f"/>
      <path d="M 160,250 Q 200,290 240,250" fill="none" stroke="#1f1f1f" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="125" cy="225" rx="15" ry="10" fill="#ffb3c6" opacity="0.6"/>
      <ellipse cx="275" cy="225" rx="15" ry="10" fill="#ffb3c6" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'meme_doge',
    name: '柴犬 Doge (Silly Doge)',
    layout: 'top-bottom',
    defaultText: 'WOW, MUCH CODE, VERY PWA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#f5ebe0"/>
      <circle cx="200" cy="210" r="130" fill="#e29578"/>
      <ellipse cx="200" cy="230" rx="110" ry="90" fill="#ffddd2"/>
      <polygon points="90,130 140,80 150,150" fill="#e29578" stroke="#e29578" stroke-width="4"/>
      <polygon points="310,130 260,80 250,150" fill="#e29578" stroke="#e29578" stroke-width="4"/>
      <polygon points="105,125 135,95 140,140" fill="#ffddd2"/>
      <polygon points="295,125 265,95 260,140" fill="#ffddd2"/>
      <circle cx="130" cy="230" r="45" fill="#ffffff"/>
      <circle cx="270" cy="230" r="45" fill="#ffffff"/>
      <ellipse cx="200" cy="250" rx="55" ry="40" fill="#ffffff"/>
      <ellipse cx="155" cy="185" rx="18" ry="14" fill="#000000"/>
      <circle cx="150" cy="182" r="5" fill="#ffffff"/>
      <ellipse cx="245" cy="185" rx="18" ry="14" fill="#000000"/>
      <circle cx="240" cy="182" r="5" fill="#ffffff"/>
      <ellipse cx="150" cy="160" rx="20" ry="10" fill="#ffffff"/>
      <ellipse cx="250" cy="160" rx="20" ry="10" fill="#ffffff"/>
      <ellipse cx="200" cy="225" rx="16" ry="10" fill="#000000"/>
      <path d="M 180,245 Q 200,250 200,235 Q 200,250 220,245" fill="none" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'meme_split_drake',
    name: '对立选择 (Drake Split)',
    layout: 'split',
    defaultText: '写原生 CSS;手写组件',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
      <!-- Layout Background -->
      <rect width="100%" height="100%" fill="#ffffff"/>
      <line x1="250" y1="0" x2="250" y2="500" stroke="#1f1f1f" stroke-width="8"/>
      <line x1="0" y1="250" x2="500" y2="250" stroke="#1f1f1f" stroke-width="8"/>
      
      <!-- Top Left: No (Programmer Cat Crying) -->
      <g transform="translate(15, 15) scale(0.55)">
        <rect width="400" height="400" fill="#fee2e2" rx="10"/>
        <circle cx="200" cy="220" r="70" fill="#f8fafc" stroke="#dc2626" stroke-width="8"/>
        <polygon points="140,170 120,100 180,150" fill="#f8fafc" stroke="#dc2626" stroke-width="8"/>
        <polygon points="260,170 280,100 220,150" fill="#f8fafc" stroke="#dc2626" stroke-width="8"/>
        <!-- Tears -->
        <path d="M 175,220 L 175,270" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/>
        <path d="M 225,220 L 225,270" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/>
        <!-- Cross eyes for rejection -->
        <line x1="165" y1="205" x2="185" y2="225" stroke="#dc2626" stroke-width="6"/>
        <line x1="185" y1="205" x2="165" y2="225" stroke="#dc2626" stroke-width="6"/>
        <line x1="215" y1="205" x2="235" y2="225" stroke="#dc2626" stroke-width="6"/>
        <line x1="235" y1="205" x2="215" y2="225" stroke="#dc2626" stroke-width="6"/>
      </g>

      <!-- Bottom Left: Yes (Programmer Cat Smiling) -->
      <g transform="translate(15, 265) scale(0.55)">
        <rect width="400" height="400" fill="#dcfce7" rx="10"/>
        <circle cx="200" cy="220" r="70" fill="#f8fafc" stroke="#16a34a" stroke-width="8"/>
        <polygon points="140,170 120,100 180,150" fill="#f8fafc" stroke="#16a34a" stroke-width="8"/>
        <polygon points="260,170 280,100 220,150" fill="#f8fafc" stroke="#16a34a" stroke-width="8"/>
        <!-- Joy eyes -->
        <path d="M 160,210 Q 175,190 190,210" fill="none" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/>
        <path d="M 210,210 Q 225,190 240,210" fill="none" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/>
        <path d="M 175,250 Q 200,280 225,250" fill="none" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/>
      </g>
    </svg>`
  }
];

export const MemeMaker: React.FC = () => {
  const { addToGallery, currentImage, setActiveSubTool } = useApp();
  
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(MEME_TEMPLATES[0]);
  const [texts, setTexts] = useState<MemeText[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  
  // Stickers State
  const [stickers, setStickers] = useState<MemeSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedElement, setDraggedElement] = useState<{ type: 'text' | 'sticker'; id: string; offsetX: number; offsetY: number } | null>(null);

  // Sync templates and layout
  useEffect(() => {
    // Set initial text based on template
    if (selectedTemplate.id === 'imported_image') return;
    
    if (selectedTemplate.layout === 'panda') {
      setTexts([
        {
          id: 'txt_panda',
          text: selectedTemplate.defaultText,
          x: 250,
          y: 440,
          size: 28,
          color: '#000000',
          strokeColor: '#ffffff',
          strokeWidth: 0
        }
      ]);
    } else if (selectedTemplate.layout === 'split') {
      const parts = selectedTemplate.defaultText.split(';');
      setTexts([
        {
          id: 'txt_top',
          text: parts[0] || '',
          x: 375,
          y: 125,
          size: 24,
          color: '#000000',
          strokeColor: '#ffffff',
          strokeWidth: 0
        },
        {
          id: 'txt_bottom',
          text: parts[1] || '',
          x: 375,
          y: 375,
          size: 24,
          color: '#000000',
          strokeColor: '#ffffff',
          strokeWidth: 0
        }
      ]);
    } else {
      setTexts([
        {
          id: 'txt_top',
          text: selectedTemplate.defaultText,
          x: 250,
          y: 60,
          size: 34,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 6
        }
      ]);
    }
    setStickers([]);
    setSelectedTextId(null);
    setSelectedStickerId(null);
  }, [selectedTemplate]);

  // Handle image import from context
  useEffect(() => {
    if (currentImage) {
      const importedTemplate: MemeTemplate = {
        id: 'imported_image',
        name: '导入的自定义图片',
        layout: 'top-bottom',
        defaultText: '在此双击输入文本',
        svg: ''
      };
      setSelectedTemplate(importedTemplate);
      setTexts([
        {
          id: 'txt_import',
          text: '在此双击输入文本',
          x: 250,
          y: 80,
          size: 32,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 6
        }
      ]);
      setStickers([]);
    }
  }, [currentImage]);

  // Redraw Canvas when everything changes
  useEffect(() => {
    drawMeme();
  }, [selectedTemplate, texts, stickers]);

  const drawMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 500;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const drawVisuals = (img: HTMLImageElement) => {
      // 1. Draw base image layout
      if (selectedTemplate.layout === 'panda') {
        ctx.drawImage(img, 50, 20, 400, 360);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // 2. Draw Stickers
      stickers.forEach((sticker) => {
        drawStickerOnCanvas(ctx, sticker);
      });

      // 3. Draw Texts
      texts.forEach((txt) => {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = txt.color;
        ctx.font = `900 ${txt.size}px "Noto Sans SC", "Outfit", "Impact", sans-serif`;
        
        if (txt.strokeWidth > 0) {
          ctx.strokeStyle = txt.strokeColor;
          ctx.lineWidth = txt.strokeWidth;
          ctx.strokeText(txt.text, txt.x, txt.y);
        }
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
      });
    };

    if (selectedTemplate.id === 'imported_image' && currentImage) {
      const img = new Image();
      img.onload = () => drawVisuals(img);
      img.src = currentImage;
    } else {
      const img = new Image();
      img.onload = () => drawVisuals(img);
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(selectedTemplate.svg)}`;
    }
  };

  // Draw customized vector stickers
  const drawStickerOnCanvas = (ctx: CanvasRenderingContext2D, sticker: MemeSticker) => {
    const { x, y, size, type } = sticker;
    ctx.save();
    ctx.translate(x, y);

    if (type === 'glasses') {
      // Thug Life Glasses
      ctx.fillStyle = '#000000';
      ctx.fillRect(-size, -size/3, size * 2, size/1.5);
      // Frame cutouts
      ctx.clearRect(-size * 0.9, -size/4, size * 0.7, size/2);
      ctx.clearRect(size * 0.2, -size/4, size * 0.7, size/2);
      // White pixel details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-size * 0.8, -size/6, size * 0.15, size * 0.15);
      ctx.fillRect(size * 0.3, -size/6, size * 0.15, size * 0.15);
    } else if (type === 'chain') {
      // Gold Chain
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = size * 0.15;
      ctx.beginPath();
      ctx.arc(0, -size/3, size * 0.6, 0, Math.PI);
      ctx.stroke();
      // Medal
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, size * 0.3, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8860b';
      ctx.font = `bold ${size*0.25}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, size * 0.3);
    } else if (type === 'question') {
      // Question mark sticker
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.font = `bold ${size * 1.2}px "Noto Sans SC"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('？', 0, 0);
      ctx.fillText('？', 0, 0);
    } else if (type === 'tears') {
      // Crying streams
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = size * 0.25;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size/2, -size/2);
      ctx.lineTo(-size/2, size/2);
      ctx.moveTo(size/2, -size/2);
      ctx.lineTo(size/2, size/2);
      ctx.stroke();
    } else if (type === 'blush') {
      // Blush circles
      ctx.fillStyle = '#ff4d6d';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(-size/2, 0, size * 0.3, 0, Math.PI * 2);
      ctx.arc(size/2, 0, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Dragging event handlers supporting touch on iOS
  const handleStartDrag = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Convert click coordinates to canvas resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    // 1. Check if clicked near any sticker (high priority)
    for (let i = stickers.length - 1; i >= 0; i--) {
      const sticker = stickers[i];
      const distance = Math.sqrt(Math.pow(sticker.x - x, 2) + Math.pow(sticker.y - y, 2));
      if (distance < sticker.size) {
        setDraggedElement({ type: 'sticker', id: sticker.id, offsetX: x - sticker.x, offsetY: y - sticker.y });
        setSelectedStickerId(sticker.id);
        setSelectedTextId(null);
        return;
      }
    }

    // 2. Check if clicked near any text
    for (let i = texts.length - 1; i >= 0; i--) {
      const txt = texts[i];
      const distance = Math.sqrt(Math.pow(txt.x - x, 2) + Math.pow(txt.y - y, 2));
      // Give a rough bounding circle based on size and length
      const clickBoundRadius = Math.max(txt.size * 0.7 * (txt.text.length / 2), 30);
      if (distance < clickBoundRadius) {
        setDraggedElement({ type: 'text', id: txt.id, offsetX: x - txt.x, offsetY: y - txt.y });
        setSelectedTextId(txt.id);
        setSelectedStickerId(null);
        return;
      }
    }

    // Clicked empty space
    setSelectedTextId(null);
    setSelectedStickerId(null);
  };

  const handleDrag = (clientX: number, clientY: number) => {
    if (!draggedElement) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    if (draggedElement.type === 'text') {
      setTexts(prev =>
        prev.map(txt =>
          txt.id === draggedElement.id
            ? { ...txt, x: Math.round(x - draggedElement.offsetX), y: Math.round(y - draggedElement.offsetY) }
            : txt
        )
      );
    } else {
      setStickers(prev =>
        prev.map(sticker =>
          sticker.id === draggedElement.id
            ? { ...sticker, x: Math.round(x - draggedElement.offsetX), y: Math.round(y - draggedElement.offsetY) }
            : sticker
        )
      );
    }
  };

  const handleStopDrag = () => {
    setDraggedElement(null);
  };

  // Add new Text layer
  const handleAddText = () => {
    const newText: MemeText = {
      id: 'txt_' + Date.now(),
      text: '双击编辑文字',
      x: 250,
      y: 250,
      size: 28,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 4
    };
    setTexts([...texts, newText]);
    setSelectedTextId(newText.id);
  };

  // Delete Text layer
  const handleDeleteText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // Update text values
  const handleUpdateTextValue = (id: string, updates: Partial<MemeText>) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Add sticker
  const handleAddSticker = (type: MemeSticker['type']) => {
    const newSticker: MemeSticker = {
      id: 'sticker_' + Date.now(),
      type,
      x: 250,
      y: 200,
      size: 50
    };
    setStickers([...stickers, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  // Delete sticker
  const handleDeleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Copy to Clipboard (Direct paste on iOS / WeChat)
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Blob conversion failed');
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      alert('您的浏览器不支持直接复制图片。请长按下方图片进行保存或右键下载！');
    }
  };

  // Save to Gallery IndexedDB
  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Calculate dominant average color
      const ctx = canvas.getContext('2d');
      let color = { r: 255, g: 255, b: 255 };
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        color = { r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) };
      }

      await addToGallery(dataUrl, `自制表情_${selectedTemplate.name.split(' ')[0]}`, ['表情包', '自制'], color);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert('收藏失败，请重试');
    }
  };

  // Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `meme_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const selectedText = texts.find(t => t.id === selectedTextId);
  const selectedSticker = stickers.find(s => s.id === selectedStickerId);

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
          表情包制作
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Canvas Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '0.6rem' }}>
          
          {/* Canvas Wrapper */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '280px',
              aspectRatio: '1/1',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-glass)',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              touchAction: 'none' // Prevent iOS browser scrolling while dragging on canvas!
            }}
            onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
            onMouseMove={(e) => handleDrag(e.clientX, e.clientY)}
            onMouseUp={handleStopDrag}
            onTouchStart={(e) => {
              if (e.touches[0]) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handleDrag(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handleStopDrag}
          >
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', width: '100%', maxWidth: '280px', marginTop: '0.6rem' }}>
            <button className="btn btn-primary" style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem' }} onClick={handleCopyToClipboard}>
              {copySuccess ? <Check style={{ width: 14 }} /> : <Copy style={{ width: 14 }} />}
              {copySuccess ? '已复制！' : '复制表情'}
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={handleDownload}>
              <Download style={{ width: 14 }} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 10px', color: saveSuccess ? 'var(--success)' : '' }}
              onClick={handleSaveToGallery}
            >
              {saveSuccess ? <Check style={{ width: 14 }} /> : <Heart style={{ width: 14 }} />}
            </button>
          </div>
        </div>

        {/* 1. Preset Templates (Horizontal Scroll) */}
        <div className="glass-panel" style={{ margin: 0, padding: '0.5rem 0.75rem' }}>
          <div className="input-label" style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
            <Laugh style={{ width: 14, color: 'var(--primary)' }} />
            切换底图模板
          </div>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {currentImage && (
              <div
                onClick={() => {
                  setSelectedTemplate({
                    id: 'imported_image',
                    name: '导入的自定义图片',
                    layout: 'top-bottom',
                    defaultText: '自定义文本',
                    svg: ''
                  });
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTemplate.id === 'imported_image' ? 'var(--primary-glow)' : 'var(--bg-input)',
                  border: `1px solid ${selectedTemplate.id === 'imported_image' ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  minWidth: '75px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={currentImage}
                  alt="Imported"
                  style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>编辑底图</span>
              </div>
            )}

            {MEME_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTemplate.id === tpl.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                  border: `1px solid ${selectedTemplate.id === tpl.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  minWidth: '75px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  dangerouslySetInnerHTML={{ __html: tpl.svg }}
                />
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65px' }}>
                  {tpl.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Layers & Stickers Adder */}
        <div className="glass-panel" style={{ margin: 0, padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Text Adder */}
            <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 0' }} onClick={handleAddText}>
              <Plus style={{ width: 14 }} />
              新增文字
            </button>

            {/* Stickers list */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '2px' }}>
              <button className="btn btn-secondary" style={{ padding: '4px 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleAddSticker('glasses')} title="🕶️">🕶️</button>
              <button className="btn btn-secondary" style={{ padding: '4px 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleAddSticker('chain')} title="🪙">🪙</button>
              <button className="btn btn-secondary" style={{ padding: '4px 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleAddSticker('question')} title="❓">❓</button>
              <button className="btn btn-secondary" style={{ padding: '4px 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleAddSticker('tears')} title="💦">💦</button>
              <button className="btn btn-secondary" style={{ padding: '4px 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleAddSticker('blush')} title="🌸">🌸</button>
            </div>
          </div>
        </div>

        {/* 3. Active Element Customizer */}
        <div className="glass-panel" style={{ margin: 0, padding: '0.75rem' }}>
          <div className="input-label" style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontSize: '0.75rem' }}>
            🛠️ 图层调节
          </div>

          {selectedText ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>[文字]</span>
                <button className="btn btn-secondary" style={{ padding: '1px 6px', fontSize: '0.65rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteText(selectedText.id)}>
                  <Trash2 style={{ width: 10, marginRight: 2 }} /> 删除
                </button>
              </div>
              
              <input
                type="text"
                className="input-field"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                value={selectedText.text}
                onChange={(e) => handleUpdateTextValue(selectedText.id, { text: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.65rem' }}>颜色</label>
                  <input type="color" className="input-field" style={{ padding: '1px', height: '28px', width: '100%' }} value={selectedText.color} onChange={(e) => handleUpdateTextValue(selectedText.id, { color: e.target.value })} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.65rem' }}>描边</label>
                  <input type="color" className="input-field" style={{ padding: '1px', height: '28px', width: '100%' }} value={selectedText.strokeColor} onChange={(e) => handleUpdateTextValue(selectedText.id, { strokeColor: e.target.value })} />
                </div>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                  <span>大小 ({selectedText.size}px)</span>
                  <span>拖拽画布移动</span>
                </label>
                <input type="range" min="12" max="64" value={selectedText.size} onChange={(e) => handleUpdateTextValue(selectedText.id, { size: parseInt(e.target.value) })} style={{ accentColor: 'var(--primary)', height: '4px' }} />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '0.65rem' }}>描边粗细 ({selectedText.strokeWidth}px)</label>
                <input type="range" min="0" max="12" value={selectedText.strokeWidth} onChange={(e) => handleUpdateTextValue(selectedText.id, { strokeWidth: parseInt(e.target.value) })} style={{ accentColor: 'var(--primary)', height: '4px' }} />
              </div>
            </div>
          ) : selectedSticker ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700 }}>[贴纸: {selectedSticker.type}]</span>
                <button className="btn btn-secondary" style={{ padding: '1px 6px', fontSize: '0.65rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteSticker(selectedSticker.id)}>
                  <Trash2 style={{ width: 10, marginRight: 2 }} /> 删除
                </button>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                  <span>贴纸大小 ({selectedSticker.size}px)</span>
                  <span>拖拽画布移动</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="150"
                  value={selectedSticker.size}
                  onChange={(e) => setStickers(prev => prev.map(s => s.id === selectedSticker.id ? { ...s, size: parseInt(e.target.value) } : s))}
                  style={{ accentColor: 'var(--primary)', height: '4px' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              💡 点击/拖拽画布图层可直接进行调节与移动
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
