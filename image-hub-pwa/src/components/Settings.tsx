import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ColorTheme } from '../context/AppContext';
import { Key, Database, Trash2, Smartphone, Download, Upload, Palette, Check } from 'lucide-react';
import localforage from 'localforage';

export const SettingsPanel: React.FC = () => {
  const {
    theme, setTheme,
    siliconFlowKey, setSiliconFlowKey,
    deepSeekKey, setDeepSeekKey,
    pixabayKey, setPixabayKey,
    exportBackupData, importBackupData
  } = useApp();

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleClearDatabase = async () => {
    if (window.confirm('🚨 警告：此操作将清空本地画廊中存储的所有图片！确定要继续吗？')) {
      await localforage.clear();
      window.location.reload();
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const dataStr = exportBackupData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `imagehub_backup_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error(err);
      alert('备份导出失败，请重试');
    }
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importBackupData(content);
      if (success) {
        setImportStatus('success');
        setTimeout(() => {
          setImportStatus('idle');
          window.location.reload();
        }, 1500);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 2000);
        alert('导入失败！请确保上传了正确的 ImageHub 备份文件。');
      }
    };
    reader.readAsText(file);
  };

  const themesInfo = [
    { id: 'light' as ColorTheme, name: '极简明亮', color: '#ffffff' },
    { id: 'cyberpunk' as ColorTheme, name: '赛博深蓝', color: '#06060c' },
    { id: 'amoled' as ColorTheme, name: 'AMOLED 纯黑', color: '#000000' },
    { id: 'aurora' as ColorTheme, name: '极光深紫', color: '#0a0518' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">系统设置</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', alignItems: 'start' }}>
        
        {/* Left Side Form settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Mobile Colors Theme Selector */}
          <div className="glass-panel" style={{ margin: 0, padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette style={{ width: 14, color: 'var(--primary)' }} />
              色彩模式
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {themesInfo.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: theme === t.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                    border: `1px solid ${theme === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: t.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.name}</span>
                  </div>
                  {theme === t.id && <Check style={{ width: 14, color: 'var(--primary)' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Backup and Restore */}
          <div className="glass-panel" style={{ margin: 0, padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database style={{ width: 14, color: 'var(--primary)' }} />
              备份与恢复
            </h3>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem', display: 'inline-flex', gap: '4px', justifyContent: 'center' }} onClick={handleExportBackup}>
                <Download style={{ width: 12 }} />
                导出备份
              </button>

              <input
                type="file"
                accept=".json"
                ref={importFileRef}
                onChange={handleImportBackup}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem', display: 'inline-flex', gap: '4px', color: importStatus === 'success' ? 'var(--success)' : '', justifyContent: 'center' }}
                onClick={() => importFileRef.current?.click()}
              >
                {importStatus === 'success' ? <Check style={{ width: 12 }} /> : <Upload style={{ width: 12 }} />}
                {importStatus === 'success' ? '导入' : '导入备份'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handleClearDatabase} style={{ width: '100%', padding: '6px 0', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', gap: '4px', justifyContent: 'center' }}>
                <Trash2 style={{ width: 12 }} />
                清空本地画廊
              </button>
            </div>
          </div>
        </div>

        {/* Right Side API Keys */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* API Keys Configuration */}
          <div className="glass-panel" style={{ margin: 0, padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key style={{ width: 14, color: 'var(--primary)' }} />
              API 密钥
            </h3>

            <div style={{
              background: 'rgba(99, 102, 241, 0.03)',
              border: '1px dashed rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              marginBottom: '10px',
              fontSize: '0.68rem',
              lineHeight: '1.4',
              color: 'var(--text-secondary)'
            }}>
              🔒 <b>隐私声明：</b> 所有密钥仅保存在您的本地浏览器缓存中，直接请求 API 服务商，不经过任何第三方服务器中转，安全无害。
            </div>

            {/* Pixabay Key */}
            <div className="input-group" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" style={{ fontSize: '0.65rem', margin: 0 }}>Pixabay Key (搜图)</label>
                <a 
                  href="https://pixabay.com/api/docs/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontSize: '0.6rem', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  🔗 免费获取 Key
                </a>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="Pixabay Key..."
                value={pixabayKey}
                onChange={(e) => setPixabayKey(e.target.value)}
              />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                用于“搜图”页面。访问 Pixabay API 文档登录后在参数区直接复制生成的免费密钥。
              </span>
            </div>

            {/* SiliconFlow Key */}
            <div className="input-group" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" style={{ fontSize: '0.65rem', margin: 0 }}>SiliconFlow Key (生图)</label>
                <a 
                  href="https://siliconflow.cn/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontSize: '0.6rem', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  🔗 注册赠送额度
                </a>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="SiliconFlow Key..."
                value={siliconFlowKey}
                onChange={(e) => setSiliconFlowKey(e.target.value)}
              />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                用于 AI 绘画工具（搭载 FLUX.1 模型）。在硅基流动官网注册后在 API 密钥菜单创建。
              </span>
            </div>

            {/* DeepSeek Key */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" style={{ fontSize: '0.65rem', margin: 0 }}>DeepSeek Key (润色)</label>
                <a 
                  href="https://platform.deepseek.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontSize: '0.6rem', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  🔗 获取 API 密钥
                </a>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="DeepSeek Key..."
                value={deepSeekKey}
                onChange={(e) => setDeepSeekKey(e.target.value)}
              />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                用于提示词一键智能优化。前往 DeepSeek 开放平台创建。
              </span>
            </div>
          </div>

          {/* Mobile Install Guide */}
          <div className="glass-panel" style={{ margin: 0, padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone style={{ width: 14, color: 'var(--primary)' }} />
              iPhone 安装 App
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
              <p>1. 在 iPhone 的 <b>Safari 浏览器</b> 中打开此网页。</p>
              <p>2. 点击 Safari 底部 <b>“分享”</b> 按钮（带箭头的方框）。</p>
              <p>3. 选择 <b>“添加到主屏幕” (Add to Home Screen)</b> 并确认。</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
