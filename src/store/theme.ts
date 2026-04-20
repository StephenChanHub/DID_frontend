import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: localStorage.getItem('theme-mode') === 'dark',
    primaryColor: localStorage.getItem('theme-color') || '#F5569B', // 默认粉色
    showSettingModal: false
  }),
  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('theme-mode', this.isDarkMode ? 'dark' : 'light');
      this.applyTheme();
    },
    setPrimaryColor(color: string) {
      this.primaryColor = color;
      localStorage.setItem('theme-color', color);
      this.applyTheme();
    },
    applyTheme() {
      // 动态注入 CSS 变量
      const root = document.documentElement;
      root.style.setProperty('--primary-color', this.primaryColor);
      if (this.isDarkMode) {
        root.classList.add('dark-mode');
      } else {
        root.classList.remove('dark-mode');
      }
    }
  }
});