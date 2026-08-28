import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Laugh, Sliders, Image } from 'lucide-react';

export const ToolsPortal: React.FC = () => {
  const { setActiveSubTool } = useApp();

  const tools = [
    {
      id: 'ai' as const,
      title: 'AI 绘画',
      desc: '输入描述，AI 快速作画',
      icon: Sparkles,
      color: 'linear-gradient(135deg, #6366f1, #a855f7)',
      shadow: 'rgba(99, 102, 241, 0.2)'
    },
    {
      id: 'meme' as const,
      title: '表情包制作',
      desc: '图层拖拽与恶搞贴纸',
      icon: Laugh,
      color: 'linear-gradient(135deg, #a855f7, #ec4899)',
      shadow: 'rgba(168, 85, 247, 0.2)'
    },
    {
      id: 'studio' as const,
      title: '画室 Studio',
      desc: '滤镜调节、手写涂鸦',
      icon: Sliders,
      color: 'linear-gradient(135deg, #06b6d4, #10b981)',
      shadow: 'rgba(6, 182, 212, 0.2)'
    },
    {
      id: 'creator' as const,
      title: '创意画坊',
      desc: '头像挂件与水印卡片',
      icon: Image,
      color: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      shadow: 'rgba(245, 158, 11, 0.2)'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '1.5rem' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '0.25rem' }}>
        <h1 className="page-title">创意工坊</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {tools.map((t) => {
          const IconComponent = t.icon;
          return (
            <div
              key={t.id}
              onClick={() => setActiveSubTool(t.id)}
              className="glass-panel"
              style={{
                margin: 0,
                padding: '1.25rem 0.75rem',
                aspectRatio: '1/1',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '10px',
                transition: 'var(--transition-smooth)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Glow Effect */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-30%',
                  left: '-10%',
                  width: '90px',
                  height: '90px',
                  background: t.color,
                  opacity: 0.04,
                  filter: 'blur(20px)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />

              {/* Icon Container */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-sm)',
                  background: t.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: `0 3px 8px ${t.shadow}`,
                  flexShrink: 0
                }}
              >
                <IconComponent style={{ width: 20, height: 20 }} />
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {t.title}
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.3', margin: 0 }}>
                  {t.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
