/* 响应式数据仓库与持久化存储管理 */

const STORAGE_KEY = 'habit_tracker_data';

// 初始状态
let state = {
  habits: [],
  selectedDate: getTodayString(),
  theme: 'dark',
  notifications: false,
};

// 属性变化侦听器
const listeners = new Set();

export const store = {
  // 初始化，自 LocalStorage 读取数据
  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state.habits = parsed.habits || [];
        state.theme = parsed.theme || 'dark';
        state.notifications = parsed.notifications || false;
      } else {
        // 默认初始示例数据，方便用户初次体验
        state.habits = [
          {
            id: 'demo-1',
            name: '清晨一杯水',
            quote: '唤醒新一天的元气',
            timeOfDay: 'morning',
            color: 'blue',
            icon: 'droplet',
            frequency: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString(),
            history: {
              [getTodayString()]: true
            }
          },
          {
            id: 'demo-2',
            name: '阅读一本书',
            quote: '书中自有黄金屋',
            timeOfDay: 'afternoon',
            color: 'purple',
            icon: 'book',
            frequency: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString(),
            history: {}
          },
          {
            id: 'demo-3',
            name: '睡前冥想',
            quote: '平息思绪，深度睡眠',
            timeOfDay: 'evening',
            color: 'orange',
            icon: 'brain',
            frequency: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString(),
            history: {}
          }
        ];
        this.save();
      }
    } catch (e) {
      console.error('加载数据失败，初始化为空数据', e);
    }
  },

  // 状态访问器
  getState() {
    return state;
  },

  // 注册监听器（状态改变时触发界面渲染）
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify() {
    listeners.forEach(listener => listener(state));
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        habits: state.habits,
        theme: state.theme,
        notifications: state.notifications
      }));
    } catch (e) {
      console.error('持久化保存失败', e);
    }
  },

  // 修改当前选中的日期
  setSelectedDate(dateString) {
    state.selectedDate = dateString;
    this.notify();
  },

  // 添加习惯
  addHabit(habit) {
    const newHabit = {
      id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      history: {},
      ...habit
    };
    state.habits.push(newHabit);
    this.save();
    this.notify();
    return newHabit;
  },

  // 更新习惯
  updateHabit(updatedHabit) {
    const idx = state.habits.findIndex(h => h.id === updatedHabit.id);
    if (idx !== -1) {
      state.habits[idx] = { ...state.habits[idx], ...updatedHabit };
      this.save();
      this.notify();
    }
  },

  // 删除习惯
  deleteHabit(id) {
    state.habits = state.habits.filter(h => h.id !== id);
    this.save();
    this.notify();
  },

  // 切换打卡状态 (给指定习惯在指定日期上打卡/取消打卡)
  toggleCheck(habitId, dateString) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.history) {
      habit.history = {};
    }

    if (habit.history[dateString]) {
      delete habit.history[dateString];
    } else {
      habit.history[dateString] = true;
    }

    this.save();
    this.notify();
    
    // 返回是否完成了打卡
    return !!habit.history[dateString];
  },

  // 设置主题
  setTheme(theme) {
    state.theme = theme;
    this.save();
    this.notify();
  },

  // 设置通知开关
  setNotifications(enabled) {
    state.notifications = enabled;
    this.save();
    this.notify();
  },

  // 导入/导出数据
  exportData() {
    return JSON.stringify({
      habits: state.habits,
      theme: state.theme,
      notifications: state.notifications,
      version: '1.0'
    }, null, 2);
  },

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.habits && Array.isArray(parsed.habits)) {
        state.habits = parsed.habits;
        if (parsed.theme) state.theme = parsed.theme;
        if (parsed.notifications !== undefined) state.notifications = parsed.notifications;
        this.save();
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('数据导入失败', e);
    }
    return false;
  },

  // ==================== 统计与计算模块 ====================

  // 获取特定日期可打卡的习惯列表（根据选择的周期过滤）
  getHabitsForDate(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 是周日，1-6 是周一至周六
    
    return state.habits.filter(habit => {
      // 检查习惯是在选择日期之前创建的
      const createdDateStr = habit.createdAt.split('T')[0];
      if (createdDateStr > dateString) return false;

      // 检查频率配置是否包含该星期几 (如未配置，默认每天)
      if (!habit.frequency || habit.frequency.length === 0) return true;
      return habit.frequency.includes(dayOfWeek);
    });
  },

  // 计算指定日期下所有习惯的打卡完成率
  getCompletionRateForDate(dateString) {
    const habitsForDay = this.getHabitsForDate(dateString);
    if (habitsForDay.length === 0) return 0;
    
    const completedCount = habitsForDay.filter(h => h.history && h.history[dateString]).length;
    return Math.round((completedCount / habitsForDay.length) * 100);
  },

  // 计算某一习惯的历史最大连续打卡天数和当前连续打卡天数
  getHabitStreaks(habit) {
    if (!habit.history || Object.keys(habit.history).length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const checkedDates = Object.keys(habit.history)
      .filter(d => habit.history[d])
      .sort((a, b) => new Date(a) - new Date(b));

    if (checkedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let longest = 0;
    let current = 0;
    let tempStreak = 0;
    let lastDate = null;

    const todayStr = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    for (let i = 0; i < checkedDates.length; i++) {
      const d = checkedDates[i];
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = getDiffDays(lastDate, d);
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          if (tempStreak > longest) {
            longest = tempStreak;
          }
          tempStreak = 1;
        }
      }
      lastDate = d;
    }

    if (tempStreak > longest) {
      longest = tempStreak;
    }

    // 检查当前连续打卡是否依然有效（最后一次打卡必须是今天或昨天，否则已中断）
    const lastCheckedDate = checkedDates[checkedDates.length - 1];
    if (lastCheckedDate === todayStr || lastCheckedDate === yesterdayStr) {
      current = tempStreak;
    } else {
      current = 0;
    }

    return { currentStreak: current, longestStreak: longest };
  },

  // 计算所有习惯总的打卡天数和整体连续打卡天数 (整个应用打卡)
  getOverallStreaks() {
    // 找出所有习惯的所有打卡日期并去重
    const allCheckedDatesSet = new Set();
    state.habits.forEach(habit => {
      if (habit.history) {
        Object.keys(habit.history).forEach(d => {
          if (habit.history[d]) allCheckedDatesSet.add(d);
        });
      }
    });

    const checkedDates = Array.from(allCheckedDatesSet).sort((a, b) => new Date(a) - new Date(b));

    if (checkedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalChecks: 0 };
    }

    let longest = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (let i = 0; i < checkedDates.length; i++) {
      const d = checkedDates[i];
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = getDiffDays(lastDate, d);
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          if (tempStreak > longest) {
            longest = tempStreak;
          }
          tempStreak = 1;
        }
      }
      lastDate = d;
    }

    if (tempStreak > longest) {
      longest = tempStreak;
    }

    const todayStr = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    let current = 0;
    const lastCheckedDate = checkedDates[checkedDates.length - 1];
    if (lastCheckedDate === todayStr || lastCheckedDate === yesterdayStr) {
      current = tempStreak;
    }

    return {
      currentStreak: current,
      longestStreak: longest,
      totalChecks: allCheckedDatesSet.size
    };
  },

  // 生成热力图打卡数据 (支持筛选特定习惯与自定义天数限制)
  getHeatmapData(habitId = null, daysLimit = 90) {
    const data = [];
    const today = new Date();
    
    // 生成包含过去天数的数组，按顺序排，以便能支持 grid 排列
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      
      if (habitId) {
        // A. 特定习惯的打卡情况
        const habit = state.habits.find(h => h.id === habitId);
        const completed = !!(habit && habit.history && habit.history[dateStr]);
        data.push({
          date: dateStr,
          completedCount: completed ? 1 : 0,
          totalHabits: 1,
          rate: completed ? 100 : 0,
          level: completed ? 4 : 0, // 完成即为最深色
          dayOfWeek: d.getDay()
        });
      } else {
        // B. 整体习惯的打卡情况
        const rate = this.getCompletionRateForDate(dateStr);
        const totalHabits = this.getHabitsForDate(dateStr).length;
        let completedCount = 0;
        state.habits.forEach(h => {
          if (h.history && h.history[dateStr]) completedCount++;
        });

        // 计算 level (0-4) 用于热力图层级表现
        let level = 0;
        if (completedCount > 0) {
          if (rate <= 25) level = 1;
          else if (rate <= 50) level = 2;
          else if (rate <= 75) level = 3;
          else level = 4;
        }

        data.push({
          date: dateStr,
          completedCount,
          totalHabits,
          rate,
          level,
          dayOfWeek: d.getDay()
        });
      }
    }
    
    return data;
  }
};

// ==================== 日期助手函数 ====================

function getTodayString() {
  return formatDate(new Date());
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDiffDays(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
