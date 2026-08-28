import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, Copy, Download, Heart, Check, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { PRESET_IMAGES } from '../data/presets';


interface AvatarFrame {
  id: string;
  name: string;
  renderFrame: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;
}

// Custom canvas-based avatar frames
const AVATAR_FRAMES: AvatarFrame[] = [
  {
    id: 'frame_neon',
    name: '霓虹炫彩光环 (Neon Glow)',
    renderFrame: (ctx, cx, cy, r) => {
      // Glow circle
      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 5);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.9)');
      grad.addColorStop(1, 'rgba(20, 184, 166, 0)');
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 14;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },
  {
    id: 'frame_catears',
    name: '软萌猫耳框 (Cat Ears)',
    renderFrame: (ctx, cx, cy, r) => {
      // Circle border
      ctx.save();
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
      ctx.stroke();

      // Left Ear
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      // Triangle matching circle curve
      ctx.moveTo(cx - r * 0.7, cy - r * 0.7);
      ctx.lineTo(cx - r * 0.8, cy - r * 1.1);
      ctx.lineTo(cx - r * 0.3, cy - r * 0.9);
      ctx.closePath();
      ctx.fill();

      // Left inner ear
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.65, cy - r * 0.75);
      ctx.lineTo(cx - r * 0.73, cy - r * 1.02);
      ctx.lineTo(cx - r * 0.4, cy - r * 0.88);
      ctx.closePath();
      ctx.fill();

      // Right Ear
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.7, cy - r * 0.7);
      ctx.lineTo(cx + r * 0.8, cy - r * 1.1);
      ctx.lineTo(cx + r * 0.3, cy - r * 0.9);
      ctx.closePath();
      ctx.fill();

      // Right inner ear
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.65, cy - r * 0.75);
      ctx.lineTo(cx + r * 0.73, cy - r * 1.02);
      ctx.lineTo(cx + r * 0.4, cy - r * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
  {
    id: 'frame_festive',
    name: '国庆节日红旗渐变 (Festive Red)',
    renderFrame: (ctx, cx, cy, r) => {
      // Golden double border
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ff3b30';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
      ctx.stroke();

      // Draw bottom-right red stars gradient overlay
      const grad = ctx.createLinearGradient(cx - r, cy + r, cx + r, cy - r);
      grad.addColorStop(0, 'rgba(255, 45, 85, 0.45)');
      grad.addColorStop(0.4, 'rgba(255, 59, 48, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw a small gold star on top right
      const drawStar = (x: number, y: number, radius: number) => {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            x + radius * Math.cos(((18 + i * 72) * Math.PI) / 180),
            y - radius * Math.sin(((18 + i * 72) * Math.PI) / 180)
          );
          ctx.lineTo(
            x + (radius/2) * Math.cos(((54 + i * 72) * Math.PI) / 180),
            y - (radius/2) * Math.sin(((54 + i * 72) * Math.PI) / 180)
          );
        }
        ctx.closePath();
        ctx.fill();
      };
      drawStar(cx + r * 0.6, cy - r * 0.6, 16);
      ctx.restore();
    }
  }
];

export const CreatorSpace: React.FC = () => {
  const { currentImage, addToGallery, setActiveSubTool } = useApp();
  
  const [activeTool, setActiveTool] = useState<'watermark' | 'quote' | 'avatar'>('watermark');
  const [uploadImg, setUploadImg] = useState<string | null>(null);

  // Watermark Settings
  const [wmText, setWmText] = useState('ImageHub 版权声明');
  const [wmColor, setWmColor] = useState('#ffffff');
  const [wmOpacity, setWmOpacity] = useState(0.4);
  const [wmSize, setWmSize] = useState(24);
  const [wmAngle, setWmAngle] = useState(-30);
  const [wmStyle, setWmStyle] = useState<'single' | 'tiled'>('tiled');

  // Quote Poster Settings
  const [quoteContent, setQuoteContent] = useState('纵有疾风起，人生不言弃。');
  const [quoteAuthor, setQuoteAuthor] = useState('瓦雷里');
  const [quoteHeader, setQuoteHeader] = useState('DAILY LOG');
  const [cardOpacity, setCardOpacity] = useState(0.25);
  const [bgBlur, setBgBlur] = useState(15);

  // Avatar Settings
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrame>(AVATAR_FRAMES[0]);

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use imported image if available
  useEffect(() => {
    if (currentImage) {
      setUploadImg(currentImage);
    }
  }, [currentImage]);

  // Redraw canvas on inputs change
  useEffect(() => {
    drawCanvas();
  }, [activeTool, uploadImg, wmText, wmColor, wmOpacity, wmSize, wmAngle, wmStyle, quoteContent, quoteAuthor, quoteHeader, cardOpacity, bgBlur, selectedFrame]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!uploadImg) {
      // Clear and draw placeholder
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#0f0f1b';
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('请先上传或导入一张图片以开始创作', 200, 200);
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (activeTool === 'watermark') {
        // Watermark Mode
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Configure text style
        ctx.fillStyle = wmColor;
        ctx.font = `bold ${wmSize}px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Apply Opacity
        ctx.globalAlpha = wmOpacity;

        if (wmStyle === 'single') {
          // Single watermark in center
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((wmAngle * Math.PI) / 180);
          ctx.fillText(wmText, 0, 0);
          ctx.restore();
        } else {
          // Tiled watermark
          ctx.save();
          const angleRad = (wmAngle * Math.PI) / 180;
          
          // Draw watermark in a grid
          const stepX = wmText.length * wmSize * 0.7 + 100;
          const stepY = wmSize * 5;

          // Expand grid size to cover rotated bounds
          for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
            for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(angleRad);
              ctx.fillText(wmText, 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1.0; // Reset alpha

      } else if (activeTool === 'quote') {
        // Quote Card Mode (Vertical Poster 600x800)
        canvas.width = 600;
        canvas.height = 800;

        // Draw background image blurred and darkened
        ctx.save();
        ctx.drawImage(img, 0, 0, 600, 800);
        
        // Blur filter on Canvas (unsupported in some old browsers, but widely supported in modern ones)
        if (typeof (ctx as any).filter !== 'undefined') {
          ctx.filter = `blur(${bgBlur}px) brightness(0.65)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
        } else {
          // Fallback: draw semi-transparent dark mask
          (ctx as any).fillStyle = 'rgba(0,0,0,0.55)';
          (ctx as any).fillRect(0, 0, 600, 800);
        }
        ctx.restore();

        // Draw Glassmorphism card in center
        ctx.save();
        const cardW = 480;
        const cardH = 340;
        const cardX = 60;
        const cardY = 220;
        const radius = 20;

        // Draw rounded rectangle card background
        ctx.beginPath();
        ctx.moveTo(cardX + radius, cardY);
        ctx.lineTo(cardX + cardW - radius, cardY);
        ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
        ctx.lineTo(cardX + cardW, cardY + cardH - radius);
        ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
        ctx.lineTo(cardX + radius, cardY + cardH);
        ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
        ctx.lineTo(cardX, cardY + radius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
        ctx.closePath();

        ctx.fillStyle = `rgba(255, 255, 255, ${cardOpacity})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Add soft inner glow border
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // Draw text on top of glass card
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        // Date / Header
        ctx.font = 'bold 15px "Outfit", sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(quoteHeader.toUpperCase(), 300, 270);

        // Divider Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(250, 290);
        ctx.lineTo(350, 290);
        ctx.stroke();

        // Quote Content (wrapped)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
        ctx.textBaseline = 'middle';
        
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split('');
          let line = '';
          let currentY = y;
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, x, currentY);
              line = words[n];
              currentY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, currentY);
        };
        wrapText(quoteContent, 300, 360, 400, 38);

        // Author
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = 'italic 16px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`—— ${quoteAuthor}`, 480, 500);

        // App logo watermark at the bottom of poster
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '13px "Outfit"';
        ctx.textAlign = 'center';
        ctx.fillText('DESIGNED IN IMAGEHUB PWA', 300, 750);
        ctx.restore();

      } else if (activeTool === 'avatar') {
        // Avatar Mode (1:1 square crop 500x500)
        canvas.width = 500;
        canvas.height = 500;

        const cx = 250;
        const cy = 250;
        const radius = 220;

        // Circular Clip path to crop user image
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
        ctx.clip();

        // Draw image scale to fill circular clip
        const scale = Math.max(500 / img.width, 500 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (500 - w) / 2;
        const y = (500 - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();

        // Draw selected decorative border frame
        if (selectedFrame) {
          selectedFrame.renderFrame(ctx, cx, cy, radius);
        }
      }
    };
    img.src = uploadImg;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadImg(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadImg) return;
    setLoading(true);
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
      alert('您的浏览器可能不支持复制图片到剪贴板，请尝试直接下载！');
    } finally {
      setLoading(false);
    }
  };

  // Save to Gallery
  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadImg) return;
    setLoading(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Calculate color
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

      await addToGallery(dataUrl, `设计_${activeTool}_${Date.now()}`, ['创意', activeTool], color);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert('收藏失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Download Output
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadImg) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `creation_${activeTool}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Unified Header with Back Button and Upload on the right */}
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
          创意画坊
        </span>

        {/* Compact Upload Button */}
        <div style={{ marginLeft: 'auto' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'inline-flex', gap: '4px' }} onClick={() => fileInputRef.current?.click()}>
            <Upload style={{ width: 12 }} />
            上传底图
          </button>
        </div>
      </div>

      {/* Segmented Selector for Sub-Tools */}
      <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
        <button
          className={`btn ${activeTool === 'watermark' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
          onClick={() => setActiveTool('watermark')}
        >
          水印
        </button>
        <button
          className={`btn ${activeTool === 'quote' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
          onClick={() => setActiveTool('quote')}
        >
          卡片
        </button>
        <button
          className={`btn ${activeTool === 'avatar' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', borderRadius: '6px', boxShadow: 'none', border: 'none' }}
          onClick={() => setActiveTool('avatar')}
        >
          头像框
        </button>
      </div>

      {uploadImg ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Left Canvas Display */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', margin: 0, padding: '0.6rem' }}>
            <div
              style={{
                width: '100%',
                maxWidth: activeTool === 'quote' ? '200px' : '260px',
                background: '#07070d',
                border: '1px solid var(--border-color)',
                borderRadius: activeTool === 'avatar' ? '50%' : 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-glass)',
                aspectRatio: activeTool === 'quote' ? '3/4' : '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: activeTool === 'avatar' ? '50%' : '0'
                }}
              />
            </div>

            {uploadImg && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '0.6rem', width: '100%', maxWidth: '260px' }}>
                <button className="btn btn-primary" style={{ flex: 1.2, padding: '4px 0', fontSize: '0.75rem' }} onClick={handleCopyToClipboard} disabled={loading}>
                  {copySuccess ? <Check style={{ width: 12 }} /> : <Copy style={{ width: 12 }} />}
                  <span>{copySuccess ? '已复制' : '复制图片'}</span>
                </button>
                <button className="btn btn-secondary" style={{ flex: '0.3', padding: '4px 0' }} onClick={handleDownload} disabled={loading}>
                  <Download style={{ width: 12 }} />
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: '0.3', padding: '4px 0', color: saveSuccess ? 'var(--success)' : '' }}
                  onClick={handleSaveToGallery}
                  disabled={loading}
                >
                  {saveSuccess ? <Check style={{ width: 12 }} /> : <Heart style={{ width: 12 }} />}
                </button>
              </div>
            )}
          </div>

          {/* Right Settings Panel */}
          <div className="glass-panel" style={{ margin: 0, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="input-label" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontSize: '0.75rem', marginBottom: '2px' }}>
              🔨 创意参数调节
            </div>

            {/* 1. Watermark Form */}
            {activeTool === 'watermark' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>水印文字</label>
                  <input type="text" className="input-field" style={{ fontSize: '0.85rem' }} value={wmText} onChange={(e) => setWmText(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>水印颜色</label>
                    <input type="color" className="input-field" style={{ padding: '3px', height: '36px', width: '100%', cursor: 'pointer' }} value={wmColor} onChange={(e) => setWmColor(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>排版样式</label>
                    <select
                      className="input-field"
                      value={wmStyle}
                      onChange={(e: any) => setWmStyle(e.target.value)}
                      style={{ background: 'var(--bg-input)', fontSize: '0.85rem' }}
                    >
                      <option value="tiled">全屏铺满平铺</option>
                      <option value="single">单行中心水印</option>
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>透明度</span>
                    <span>{Math.round(wmOpacity * 100)}%</span>
                  </label>
                  <input type="range" min="0.05" max="1" step="0.05" value={wmOpacity} onChange={(e) => setWmOpacity(parseFloat(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} />
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>字体大小</span>
                    <span>{wmSize}px</span>
                  </label>
                  <input type="range" min="10" max="80" step="1" value={wmSize} onChange={(e) => setWmSize(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} />
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>旋转角度</span>
                    <span>{wmAngle}°</span>
                  </label>
                  <input type="range" min="-90" max="90" step="5" value={wmAngle} onChange={(e) => setWmAngle(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} />
                </div>
              </div>
            )}

            {/* 2. Quote Card Form */}
            {activeTool === 'quote' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>语录顶标 (Header)</label>
                  <input type="text" className="input-field" style={{ fontSize: '0.85rem' }} value={quoteHeader} onChange={(e) => setQuoteHeader(e.target.value)} />
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>语录内容</label>
                  <textarea
                    className="input-field"
                    style={{ height: '60px', resize: 'none', padding: '0.5rem 0.75rem', fontSize: '0.85rem', lineHeight: '1.4' }}
                    value={quoteContent}
                    onChange={(e) => setQuoteContent(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>作者/出处</label>
                  <input type="text" className="input-field" style={{ fontSize: '0.85rem' }} value={quoteAuthor} onChange={(e) => setQuoteAuthor(e.target.value)} />
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>背景模糊度</span>
                    <span>{bgBlur}px</span>
                  </label>
                  <input type="range" min="0" max="40" step="1" value={bgBlur} onChange={(e) => setBgBlur(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} />
                </div>

                <div className="input-group" style={{ margin: 0, gap: '4px' }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>卡片透明度</span>
                    <span>{Math.round(cardOpacity * 100)}%</span>
                  </label>
                  <input type="range" min="0.05" max="0.8" step="0.05" value={cardOpacity} onChange={(e) => setCardOpacity(parseFloat(e.target.value))} style={{ accentColor: 'var(--primary)', height: '18px' }} />
                </div>
              </div>
            )}

            {/* 3. Avatar Frame Form */}
            {activeTool === 'avatar' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>选择社交头像框挂件</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {AVATAR_FRAMES.map((frame) => (
                    <div
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedFrame.id === frame.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                        border: `1px solid ${selectedFrame.id === frame.id ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {frame.name}
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  💡 <b>提示：</b> 头像生成器会自动将上传的图片进行圆形剪裁，并叠加上述挂件。制作完成后点击复制即可保存！
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', margin: 0 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            <ImageIcon style={{ width: 42, height: 42, color: 'var(--primary)', marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>创意画坊未载入底图</h3>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload style={{ width: 14 }} />
            <span>选择本地底图上传</span>
          </button>

          {/* Presets Gallery for Quick Select */}
          <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left', fontWeight: 600 }}>
              💡 快速加载内置素材底图：
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
                        setUploadImg(reader.result as string);
                        setLoading(false);
                      };
                      reader.readAsDataURL(blob);
                    } catch (err) {
                      console.error(err);
                      setUploadImg(img.url);
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
    </div>
  );
};
