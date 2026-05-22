/* UI 渲染与交互处理器 (DOM Orchestrator) */

import { store } from './store.js';
import {
  getIconSvg,
  HABIT_ICONS,
  getWeekDays,
  formatDate,
  WEEK_DAYS_SHORT,
} from './utils.js';
import { wrapLocalEncryptedBackup, decryptLocal } from './local-crypto.js';

// 当前处于编辑状态的习惯 ID（新增时为 null）
let editingHabitId = null;
let currentStatsFilter = 'all';
let currentStatsRange = 90;
let updateStatsHeatmapRef = null;

// 监听窗口尺寸变化，实时对齐热力图宽度自适应
window.addEventListener('resize', () => {
  if (updateStatsHeatmapRef && nodes.statsView && nodes.statsView.classList.contains('active')) {
    updateStatsHeatmapRef();
  }
});

// 常规 DOM 节点缓存
let nodes = {};

export const ui = {
  init() {
    // 缓存页面中关键的 DOM 节点
    nodes = {
      app: document.getElementById('app'),
      loader: document.getElementById('loader'),
      tabItems: document.querySelectorAll('.tab-item'),
      views: document.querySelectorAll('.view'),
      
      // 视图特定节点
      dashboardView: document.getElementById('view-dashboard'),
      statsView: document.getElementById('view-stats'),
      settingsView: document.getElementById('view-settings'),
      
      // 悬浮添加按钮
      fab: document.getElementById('fab-add'),
      
      // 模态框组件
      modalOverlay: document.getElementById('modal-overlay'),
      modalTitle: document.getElementById('modal-title'),
      modalClose: document.getElementById('modal-close'),
      habitForm: document.getElementById('habit-form'),
      habitName: document.getElementById('habit-name'),
      habitQuote: document.getElementById('habit-quote'),
      btnDeleteHabit: document.getElementById('btn-delete-habit'),
      
      // 模态框选项集合
      colorGrid: document.querySelector('.color-grid'),
      iconGrid: document.querySelector('.icon-grid'),
      timeSegment: document.querySelectorAll('#modal-overlay .segment-item'),
      daySelector: document.querySelector('.day-selector'),
    };

    // 绑定所有的 DOM 事件监听器
    this.bindEvents();
    
    // 初始化模态框中的图标与配色选项网格
    this.initModalGrids();

    // 移除首次加载加载圈
    setTimeout(() => {
      if (nodes.loader) {
        nodes.loader.classList.add('fade-out');
        setTimeout(() => nodes.loader.remove(), 400);
      }
    }, 600);
  },

  // 绑定事件
  bindEvents() {
    // 1. 底部导航栏切换视图
    nodes.tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const viewId = tab.dataset.view;
        this.switchView(viewId);
      });
    });

    // 2. 点击 FAB 按钮打开创建习惯模态框
    nodes.fab.addEventListener('click', () => {
      this.openHabitModal();
    });

    // 3. 关闭习惯模态框
    nodes.modalClose.addEventListener('click', () => {
      this.closeHabitModal();
    });
    nodes.modalOverlay.addEventListener('click', (e) => {
      if (e.target === nodes.modalOverlay) {
        this.closeHabitModal();
      }
    });

    // 4. 模态框内的段选择器交互（晨间、午后、晚间、全天）
    nodes.timeSegment.forEach(seg => {
      seg.addEventListener('click', () => {
        nodes.timeSegment.forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
      });
    });

    // 5. 模态框内的周几多选控制
    nodes.daySelector.querySelectorAll('.day-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
      });
    });

    // 6. 模态框表单提交
    nodes.habitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // 7. 删除习惯按钮
    nodes.btnDeleteHabit.addEventListener('click', () => {
      if (editingHabitId) {
        if (confirm('确定要删除这个习惯吗？该习惯的打卡历史也将被清空。')) {
          store.deleteHabit(editingHabitId);
          this.closeHabitModal();
        }
      }
    });

    // 8. 设置视图：切换主题
    const themeSegment = document.querySelectorAll('#theme-segment .segment-item');
    themeSegment.forEach(item => {
      item.addEventListener('click', () => {
        themeSegment.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const theme = item.dataset.theme;
        store.setTheme(theme);
      });
    });


    // 9. 设置视图：导入与导出备份
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const fileImport = document.getElementById('file-import');

    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        const password = prompt(
          '本地加密备份：密码仅在当前设备用于加解密，不会上传。\n\n请输入加密密码（留空或取消则导出未加密 JSON）：'
        );
        let finalData = store.exportData();
        let isEncrypted = false;

        if (password !== null && password.trim() !== '') {
          try {
            const envelope = await wrapLocalEncryptedBackup(finalData, password.trim());
            finalData = JSON.stringify(envelope, null, 2);
            isEncrypted = true;
          } catch (err) {
            console.error('本地加密失败', err);
            return alert(err.message || '本地加密失败，请重试。');
          }
        }

        const blob = new Blob([finalData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const suffix = isEncrypted ? '_encrypted' : '';
        a.download = `小日常打卡数据备份${suffix}_${formatDate(new Date())}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (btnImport && fileImport) {
      btnImport.addEventListener('click', () => fileImport.click());
      fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          const fileContent = event.target.result;
          try {
            const parsed = JSON.parse(fileContent);
            
            // 检查是否是加密数据
            if (parsed && parsed.encrypted === true && parsed.data) {
              const password = prompt('该备份已在本地加密，请输入解密密码（全程在您设备上解密）：');
              if (password === null) return;
              if (password.trim() === '') {
                return alert('密码不能为空！');
              }

              try {
                const payload = typeof parsed.data === 'string' ? parsed.data : String(parsed.data);
                const decryptedData = await decryptLocal(payload, password.trim());
                const success = store.importData(decryptedData);
                if (success) {
                  alert('已在本地解密并导入成功！');
                } else {
                  alert('导入失败，解密后的数据格式不正确。');
                }
              } catch (decErr) {
                alert(decErr.message || '本地解密失败，请检查密码是否正确。');
              }
            } else {
              // 普通未加密数据
              const success = store.importData(fileContent);
              if (success) {
                alert('数据导入成功！');
              } else {
                alert('导入失败，请检查文件格式。');
              }
            }
          } catch (jsonErr) {
            alert('文件解析失败，请确保导入的是正确的 JSON 备份文件。');
          }
        };
        reader.readAsText(file);
        // 清空 fileImport.value 允许重复选择同一个文件
        fileImport.value = '';
      });
    }
  },

  // 切换活动视图
  switchView(viewId) {
    // 切换 Tab 高亮
    nodes.tabItems.forEach(tab => {
      if (tab.dataset.view === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 切换视图内容显示
    nodes.views.forEach(view => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // 特殊：统计视图需要根据当前的最新状态进行重绘
    if (viewId === 'stats') {
      this.renderStatsView();
    }
    
    // FAB 按钮只在 Dashboard 视图下显示
    if (viewId === 'dashboard') {
      nodes.fab.style.display = 'flex';
    } else {
      nodes.fab.style.display = 'none';
    }
  },

  // 渲染整体界面 (根据 state 更新 DOM)
  render(state) {
    // 1. 设置当前的 HTML Theme 属性 (支持暗色和浅色切换)
    if (state.theme === 'auto') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', state.theme);
    }

    // 更新设置页的主题按钮激活状态
    const themeSegment = document.querySelectorAll('#theme-segment .segment-item');
    themeSegment.forEach(item => {
      if (item.dataset.theme === state.theme) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 2. 渲染 Dashboard 页面 (打卡列表)
    this.renderDashboardView(state);
  },

  // 初始化模态框选项网格
  initModalGrids() {
    // 渲染颜色选项列表
    const colors = ['green', 'orange', 'purple', 'blue', 'pink', 'lime'];
    nodes.colorGrid.innerHTML = colors.map((col, idx) => `
      <div class="color-option ${idx === 0 ? 'selected' : ''}" data-color="${col}">
        ${getIconSvg('check', '', 3)}
      </div>
    `).join('');

    // 给颜色选择绑定点击事件
    nodes.colorGrid.querySelectorAll('.color-option').forEach(opt => {
      opt.addEventListener('click', () => {
        nodes.colorGrid.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    // 渲染图标选项列表
    nodes.iconGrid.innerHTML = HABIT_ICONS.map((ico, idx) => `
      <div class="icon-option ${idx === 0 ? 'selected' : ''}" data-icon="${ico}">
        ${getIconSvg(ico)}
      </div>
    `).join('');

    // 给图标选择绑定点击事件
    nodes.iconGrid.querySelectorAll('.icon-option').forEach(opt => {
      opt.addEventListener('click', () => {
        nodes.iconGrid.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  },

  // 打开习惯编辑/创建模态框
  openHabitModal(habit = null) {
    if (habit) {
      // 编辑模式
      editingHabitId = habit.id;
      nodes.modalTitle.textContent = '编辑习惯';
      nodes.habitName.value = habit.name;
      nodes.habitQuote.value = habit.quote || '';
      nodes.btnDeleteHabit.style.display = 'block';

      // 填充段选择
      nodes.timeSegment.forEach(seg => {
        if (seg.dataset.segment === habit.timeOfDay) {
          seg.classList.add('active');
        } else {
          seg.classList.remove('active');
        }
      });

      // 填充配色选择
      nodes.colorGrid.querySelectorAll('.color-option').forEach(opt => {
        if (opt.dataset.color === habit.color) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });

      // 填充图标选择
      nodes.iconGrid.querySelectorAll('.icon-option').forEach(opt => {
        if (opt.dataset.icon === habit.icon) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });

      // 填充频率选择
      nodes.daySelector.querySelectorAll('.day-select-btn').forEach(btn => {
        const val = parseInt(btn.dataset.day);
        if (habit.frequency.includes(val)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } else {
      // 创建模式
      editingHabitId = null;
      nodes.modalTitle.textContent = '新建习惯';
      nodes.habitName.value = '';
      nodes.habitQuote.value = '';
      nodes.btnDeleteHabit.style.display = 'none';

      // 重置为默认选项
      nodes.timeSegment.forEach((seg, idx) => {
        if (idx === 0) seg.classList.add('active');
        else seg.classList.remove('active');
      });
      nodes.colorGrid.querySelectorAll('.color-option').forEach((opt, idx) => {
        if (idx === 0) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
      nodes.iconGrid.querySelectorAll('.icon-option').forEach((opt, idx) => {
        if (idx === 0) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
      nodes.daySelector.querySelectorAll('.day-select-btn').forEach(btn => {
        btn.classList.add('active'); // 默认全选，即每天
      });
    }

    nodes.modalOverlay.classList.add('active');
    nodes.habitName.focus();
  },

  closeHabitModal() {
    nodes.modalOverlay.classList.remove('active');
  },

  // 模态框表单提交
  handleFormSubmit() {
    const name = nodes.habitName.value.trim();
    const quote = nodes.habitQuote.value.trim();
    if (!name) return alert('请输入习惯名称！');

    const timeOfDay = Array.from(nodes.timeSegment).find(s => s.classList.contains('active')).dataset.segment;
    const color = Array.from(nodes.colorGrid.querySelectorAll('.color-option')).find(o => o.classList.contains('selected')).dataset.color;
    const icon = Array.from(nodes.iconGrid.querySelectorAll('.icon-option')).find(o => o.classList.contains('selected')).dataset.icon;
    
    // 获取频率
    const frequency = [];
    nodes.daySelector.querySelectorAll('.day-select-btn').forEach(btn => {
      if (btn.classList.contains('active')) {
        frequency.push(parseInt(btn.dataset.day));
      }
    });

    if (frequency.length === 0) {
      return alert('请至少选择一天的打卡周期！');
    }

    const habitData = { name, quote, timeOfDay, color, icon, frequency };

    if (editingHabitId) {
      store.updateHabit({ id: editingHabitId, ...habitData });
    } else {
      store.addHabit(habitData);
    }

    this.closeHabitModal();
  },

  // 2. 渲染打卡页面 (Dashboard View)
  renderDashboardView(state) {
    const container = nodes.dashboardView;
    if (!container) return;

    // 清空，重新组装
    container.innerHTML = '';

    // A. 顶部导航与问候语
    const header = document.createElement('div');
    header.className = 'header-bar';
    const hour = new Date().getHours();
    let greeting = '你好';
    if (hour < 9) greeting = '晨安，美好一天开始';
    else if (hour < 12) greeting = '上午好，保持专注';
    else if (hour < 18) greeting = '下午好，继续坚持';
    else greeting = '晚安，回味充实的一天';

    header.innerHTML = `
      <div>
        <h1>今日日常</h1>
        <div class="subtitle">${greeting}</div>
      </div>
      <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
        ${state.selectedDate.split('-')[1]}月${state.selectedDate.split('-')[2]}日
      </div>
    `;
    container.appendChild(header);

    // B. 周日期滑动条 (Week Strip)
    const weekStrip = document.createElement('div');
    weekStrip.className = 'week-strip';
    
    const weekDays = getWeekDays(state.selectedDate);
    const todayStr = formatDate(new Date());

    weekDays.forEach(day => {
      const dateStr = formatDate(day);
      const dayName = WEEK_DAYS_SHORT[day.getDay()];
      const dayNum = day.getDate();
      
      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';
      
      if (dateStr === state.selectedDate) dayCard.classList.add('active');
      if (dateStr === todayStr) dayCard.classList.add('today');
      
      // 判断这一天是否有习惯，且这一天的习惯是否都已完成
      const habitsForDay = store.getHabitsForDate(dateStr);
      if (habitsForDay.length > 0) {
        const isCompleted = habitsForDay.every(h => h.history && h.history[dateStr]);
        if (isCompleted) dayCard.classList.add('completed');
      }

      dayCard.innerHTML = `
        <span class="day-name">${dayName}</span>
        <span class="day-number">${dayNum}</span>
        <div class="day-dot"></div>
      `;

      dayCard.addEventListener('click', () => {
        store.setSelectedDate(dateStr);
      });

      weekStrip.appendChild(dayCard);
    });
    container.appendChild(weekStrip);

    // C. 打卡列表展示 (习惯分组渲染)
    const habitsForSelectedDate = store.getHabitsForDate(state.selectedDate);

    if (habitsForSelectedDate.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'glass-card';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.padding = '40px 20px';
      emptyDiv.style.marginTop = '20px';
      emptyDiv.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 12px; filter: grayscale(0.5);">🌱</div>
        <p style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">今天没有安排任何习惯哦</p>
        <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px;">点击下方的“+”按钮来创建新习惯吧！</p>
      `;
      container.appendChild(emptyDiv);
      return;
    }

    // 将选定日期习惯进行分类
    const categories = [
      { id: 'morning', label: '晨间习惯', icon: 'sun' },
      { id: 'afternoon', label: '午后习惯', icon: 'coffee' },
      { id: 'evening', label: '晚间习惯', icon: 'moon' },
      { id: 'all', label: '全天习惯', icon: 'clock' }
    ];

    categories.forEach(cat => {
      const filtered = habitsForSelectedDate.filter(h => h.timeOfDay === cat.id);
      if (filtered.length === 0) return;

      // 创建分组容器
      const groupTitle = document.createElement('div');
      groupTitle.className = 'habit-group-title';
      groupTitle.innerHTML = `
        ${getIconSvg(cat.icon)}
        <span>${cat.label}</span>
      `;
      container.appendChild(groupTitle);

      const listDiv = document.createElement('div');
      listDiv.className = 'habit-list';

      filtered.forEach(habit => {
        const isChecked = !!(habit.history && habit.history[state.selectedDate]);
        const streakData = store.getHabitStreaks(habit);

        const card = document.createElement('div');
        card.className = `glass-card habit-card ${isChecked ? 'checked' : ''}`;
        card.dataset.id = habit.id;
        card.dataset.themeColor = habit.color;

        card.innerHTML = `
          <div class="habit-card-left">
            <div class="check-button-wrapper">
              <svg class="check-svg" viewBox="0 0 40 40">
                <circle class="check-circle-bg" cx="20" cy="20" r="17" />
                <circle class="check-circle-fill" cx="20" cy="20" r="17" />
              </svg>
              <div class="habit-icon-container">
                ${getIconSvg(habit.icon)}
              </div>
              <svg class="checkmark-icon" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="habit-details">
              <span class="habit-title">${habit.name}</span>
              ${habit.quote ? `<span class="habit-quote">${habit.quote}</span>` : ''}
            </div>
          </div>
          <div class="habit-card-right">
            <div class="habit-streak">
              ${getIconSvg('flame')}
              <span>${streakData.currentStreak} 天</span>
            </div>
            <div class="habit-info-btn">
              ${getIconSvg('edit')}
            </div>
          </div>
        `;

        // 1. 打卡圈点击事件 (单独处理以避免触发编辑)
        const checkBtn = card.querySelector('.check-button-wrapper');
        checkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // 调用 haptic (如果在真实手机上支持)
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }

          // 发送打卡请求
          const nowChecked = store.toggleCheck(habit.id, state.selectedDate);
          
          // 添加动画样式
          if (nowChecked) {
            card.classList.add('checked');
          } else {
            card.classList.remove('checked');
          }
        });

        // 2. 长按或点击“编辑”图标触发编辑模态框
        const infoBtn = card.querySelector('.habit-info-btn');
        infoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openHabitModal(habit);
        });

        // 手机端支持长按整个卡片编辑
        let pressTimer;
        card.addEventListener('touchstart', (e) => {
          pressTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(30);
            this.openHabitModal(habit);
          }, 600);
        });
        card.addEventListener('touchend', () => {
          clearTimeout(pressTimer);
        });

        listDiv.appendChild(card);
      });

      container.appendChild(listDiv);
    });

    const placeholder = document.createElement('div');
    placeholder.className = 'habit-placeholder';
    placeholder.innerHTML = '<span>+ 添加习惯</span>';
    placeholder.addEventListener('click', () => {
      this.openHabitModal();
    });
    container.appendChild(placeholder);
  },

  // 3. 渲染统计页面 (Stats View)
  renderStatsView() {
    const container = nodes.statsView;
    if (!container) return;

    const overallStreaks = store.getOverallStreaks();
    const todayStr = formatDate(new Date());
    const rate = store.getCompletionRateForDate(todayStr);
    const habits = store.getState().habits;

    // 安全检查：如果选中的习惯已被删除，重置为 'all'
    if (currentStatsFilter !== 'all' && !habits.some(h => h.id === currentStatsFilter)) {
      currentStatsFilter = 'all';
    }

    // 一次性输出全部 HTML 内容，避免多次插入 DOM 带来的渲染闪烁与跳跃
    container.innerHTML = `
      <div class="header-bar">
        <div>
          <h1>统计中心</h1>
          <div class="subtitle">记录你的坚持与成长</div>
        </div>
      </div>
      
      <div class="stats-summary-grid">
        <div class="glass-card stat-box">
          <span class="stat-box-label">当前连续打卡</span>
          <div class="stat-box-value" style="color: var(--color-theme-orange);">${overallStreaks.currentStreak}</div>
          <span class="stat-box-label">天</span>
        </div>
        <div class="glass-card stat-box">
          <span class="stat-box-label">最长连续打卡</span>
          <div class="stat-box-value" style="color: var(--color-theme-blue);">${overallStreaks.longestStreak}</div>
          <span class="stat-box-label">天</span>
        </div>
      </div>
      
      <div class="glass-card" style="padding: 12px 16px;">
        <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 8px;">今日习惯完成率</div>
        <div class="progress-container">
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-glass)" stroke-width="6"></circle>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-success)" stroke-width="6" 
              stroke-dasharray="263.89" stroke-dashoffset="${263.89 - (263.89 * rate / 100)}" 
              stroke-linecap="round" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.8s ease;"></circle>
          </svg>
          <div class="progress-center-text">
            <span class="progress-center-val" style="font-size: 1.8rem;">${rate}%</span>
            <span class="progress-center-lbl">已完成</span>
          </div>
        </div>
      </div>
      
      <div class="glass-card heatmap-card" style="padding: 12px 16px;">
        <!-- 精致头部栏：左侧标题与图标，右侧时间范围切换 -->
        <div class="heatmap-header">
          <div class="heatmap-title">
            ${getIconSvg('bar-chart', 'heatmap-title-icon')}
            <span>打卡热力图</span>
          </div>
          <div class="heatmap-segment heatmap-time-segment" id="heatmap-range-segment" role="tablist" aria-label="热力图时间范围">
            <div class="segment-item ${currentStatsRange === 30 ? 'active' : ''}" data-range="30" role="tab">30天</div>
            <div class="segment-item ${currentStatsRange === 90 ? 'active' : ''}" data-range="90" role="tab">90天</div>
          </div>
        </div>

        <!-- 习惯过滤行：独占一行，全宽横向平滑滚动 -->
        <div class="heatmap-filter-wrapper">
          <div class="heatmap-segment heatmap-habit-segment" id="heatmap-habit-filter" role="tablist" aria-label="热力图习惯筛选">
            <div class="segment-item ${currentStatsFilter === 'all' ? 'active' : ''}" data-value="all" role="tab">全部习惯</div>
            ${habits.map(h => `
              <div class="segment-item ${currentStatsFilter === h.id ? 'active' : ''}" data-value="${h.id}" role="tab" title="${h.name}">${h.name}</div>
            `).join('')}
          </div>
        </div>

        <!-- 热力图本体 -->
        <div class="heatmap-scroll-container">
          <div class="heatmap-grid" id="heatmap-grid-inner"></div>
        </div>

        <!-- 底部数据信息 -->
        <div class="heatmap-footer" style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
          <span id="heatmap-total-checks">累计打卡: 0 次</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">提示: 单元格越亮，完成度越高</span>
        </div>
      </div>
    `;

    // 绑定事件和元素引用
    const rangeSegment = container.querySelector('#heatmap-range-segment');
    const habitFilter = container.querySelector('#heatmap-habit-filter');
    const totalChecksSpan = container.querySelector('#heatmap-total-checks');
    const gridInner = container.querySelector('#heatmap-grid-inner');

    const updateHeatmap = () => {
      const isAll = currentStatsFilter === 'all';

      // 30天: 旋转为 5行×7列（每行=一周），grid-auto-flow: row
      // 90天: 标准 7行×13列（每列=一周），grid-auto-flow: column
      // 两者共用同一块固定高度(148px)区域，格子自动填满，高度始终一致
      const is30 = currentStatsRange === 30;
      const numRows = is30 ? 5 : 7;
      const numCols = is30 ? 7 : 13;
      const daysActual = numRows * numCols; // 35 or 91
      const heatmapData = store.getHeatmapData(isAll ? null : currentStatsFilter, daysActual);

      // 设置 CSS 变量驱动 grid 布局
      gridInner.style.setProperty('--num-rows', numRows);
      gridInner.style.setProperty('--num-cols', numCols);
      gridInner.style.gridAutoFlow = is30 ? 'row' : 'column';

      // 更新累计打卡次数
      let totalChecks = 0;
      if (isAll) {
        totalChecks = overallStreaks.totalChecks;
      } else {
        const habit = habits.find(h => h.id === currentStatsFilter);
        if (habit && habit.history) {
          totalChecks = Object.keys(habit.history).filter(d => habit.history[d]).length;
        }
      }
      totalChecksSpan.textContent = `累计打卡: ${totalChecks} 次`;

      // 填充热力图网格
      gridInner.innerHTML = heatmapData.map(day => {
        let tip = '';
        if (isAll) {
          tip = `${day.date} 完成率 ${day.rate}% (${day.completedCount}/${day.totalHabits} 个习惯)`;
        } else {
          tip = `${day.date} ${day.completedCount > 0 ? '已打卡' : '未打卡'}`;
        }
        return `
          <div class="heatmap-cell" 
               data-level="${day.level}" 
               data-tooltip="${tip}"
               title="${tip}">
          </div>
        `;
      }).join('');
    };

    // A. 绑定时间范围选择
    if (rangeSegment) {
      rangeSegment.querySelectorAll('.segment-item').forEach(item => {
        item.addEventListener('click', () => {
          rangeSegment.querySelectorAll('.segment-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          currentStatsRange = parseInt(item.dataset.range, 10);
          updateHeatmap();
        });
      });
    }

    // B. 绑定习惯筛选按钮
    if (habitFilter) {
      habitFilter.querySelectorAll('.segment-item').forEach(item => {
        item.addEventListener('click', () => {
          habitFilter.querySelectorAll('.segment-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          currentStatsFilter = item.dataset.value;
          updateHeatmap();
          item.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
        });
      });
    }

    // 保存引用供窗口尺寸变化时复用（不再需要 clientWidth，但保留以备扩展）
    updateStatsHeatmapRef = updateHeatmap;

    // 初始加载热力图
    updateHeatmap();
  }
};
