<template>
  <div class="app-wrapper">
    <UserModule v-if="!hideLayout" />

    <main :class="['main-view', { 'full-screen': hideLayout }]">
      <router-view />
    </main>

    <nav v-if="!hideLayout" class="floating-nav" ref="navRef">
      <div class="nav-pill" :style="pillStyle"></div>
      <router-link to="/do" class="nav-item" ref="navDoRef">DO</router-link>
      <router-link to="/did" class="nav-item" ref="navDidRef">DID</router-link>
    </nav>

    <AuthModal v-if="userStore.showAuthModal" />
    <UserInfoModal v-if="userStore.showInfoModal" />
    <Setting v-if="themeStore.showSettingModal" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref, nextTick, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import UserModule from '@/components/UserModule.vue';
import AuthModal from '@/components/AuthModal.vue';
import UserInfoModal from '@/components/UserInfoModal.vue';
import Setting from '@/components/Setting.vue';
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';

const userStore = useUserStore();
const themeStore = useThemeStore();
const route = useRoute();

// 判断是否需要隐藏布局（用于练习页面）
const hideLayout = computed(() => route.meta?.hideLayout === true);

const navRef = ref<HTMLElement | null>(null);
const navDoRef = ref<any>(null);
const navDidRef = ref<any>(null);

const pillLeft = ref(0);
const pillWidth = ref(0);
const isJellying = ref(false);

const pillStyle = computed(() => ({
  transform: `translateX(${pillLeft.value}px)`,
  width: `${pillWidth.value}px`,
}));

const updatePill = () => {
  const nav = navRef.value;
  if (!nav) return;
  const path = route.path;
  const targetRef = path.startsWith('/did') ? navDidRef : navDoRef;
  const el = targetRef.value?.$el || targetRef.value;
  if (!el) return;

  const navRect = nav.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const pad = 8;
  const newLeft = elRect.left - navRect.left - pad;
  const newWidth = elRect.width + pad * 2;

  if (pillWidth.value > 0 && newLeft !== pillLeft.value) {
    isJellying.value = true;
    setTimeout(() => { isJellying.value = false; }, 520);
  }

  pillLeft.value = newLeft;
  pillWidth.value = newWidth;
};

watch(() => route.path, () => nextTick(updatePill));
onMounted(() => {
  nextTick(updatePill);
  window.addEventListener('resize', updatePill);
});
onUnmounted(() => window.removeEventListener('resize', updatePill));

// 通用的图标生成函数（180x180 兼容性最好）
const generateAvatarBase64 = (text: string, color: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 背景颜色
  ctx.fillStyle = color;

  // 兼容性修复：用普通的 rect 代替 roundRect，或者手动画圆角
  // 如果你一定要圆角，可以用下面的传统路径写法：
  const r = 40; // 圆角半径
  const w = 180;
  const h = 180;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // 文字
  ctx.fillStyle = '#ffffff';
  // 兼容性修复：Safari 对字体名称比较挑剔，建议加上通用字体族
  ctx.font = 'bold 90px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 90, 90);

  return canvas.toDataURL('image/png');
};

// 核心修复：统一更新函数
const updateAllIcons = () => {
  // 1. 查找旧标签并彻底移除
  const existingFav = document.querySelector("link[rel*='icon']");
  const existingApple = document.querySelector("link[rel='apple-touch-icon']");
  if (existingFav) existingFav.remove();
  if (existingApple) existingApple.remove();

  // 2. 准备新的 link 标签
  const favIcon = document.createElement('link');
  const appleIcon = document.createElement('link');

  if (userStore.isLoggedIn) {
    const dataUrl = generateAvatarBase64(userStore.avatarText, themeStore.primaryColor);

    // 浏览器标签页
    favIcon.rel = 'icon'; // Safari 有时对 'shortcut icon' 识别不稳，直接用 'icon'
    favIcon.href = dataUrl;

    // Apple 主屏幕图标
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = dataUrl;
  } else {
    // 未登录恢复默认路径
    favIcon.rel = 'icon';
    favIcon.href = '/logo.png';
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = '/logo.png';
  }

  // 3. 重新插入到 Head
  document.head.appendChild(favIcon);
  document.head.appendChild(appleIcon);
};

// 监控登录状态、昵称文本、主题颜色，任何一个变了都立即更新图标
watch(
  [() => userStore.isLoggedIn, () => userStore.avatarText, () => themeStore.primaryColor],
  () => {
    updateAllIcons();
  },
  { immediate: true }
);

onMounted(() => themeStore.applyTheme());
</script>

<style>
/* --- 全局 CSS 变量定义 --- */
:root {
  --bg-color: #f5f7fa;
  --text-color: #2c3e50;
  --glass-bg: rgba(255, 255, 255, 0.25);
  --glass-border: rgba(255, 255, 255, 0.4);
  --shadow-color: rgba(31, 38, 135, 0.1);
}

/* --- 暗黑模式变量覆盖 --- */
.dark-mode {
  --bg-color: #1a1a1a;
  --text-color: #f0f0f0;
  --glass-bg: rgba(40, 40, 40, 0.4);
  --glass-border: rgba(255, 255, 255, 0.1);
  --shadow-color: rgba(0, 0, 0, 0.3);
}

/* --- 全局基础样式 --- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s;
  overflow-x: hidden;
  min-height: 100vh;
  /* 安全区域支持 */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.app-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* --- 主内容区布局 --- */
.main-view {
  flex: 1;
  padding: calc(100px + env(safe-area-inset-top)) 20px calc(120px + env(safe-area-inset-bottom));
  /* 为上下悬浮组件预留呼吸空间，考虑安全区域 */
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.main-view.full-screen {
  padding: 0;
  max-width: none;
}


.floating-nav {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 360px;
  height: 64px;

  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.32) 0%,
      rgba(255, 255, 255, 0.18) 50%,
      rgba(255, 255, 255, 0.14) 100%);
  backdrop-filter: blur(24px) saturate(170%);
  -webkit-backdrop-filter: blur(24px) saturate(170%);
  border: 1.5px solid rgba(255, 255, 255, 0.42);
  box-shadow:
    0 18px 52px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    inset 0 -1px 0 rgba(255, 255, 255, 0.18);
  border-radius: 34px;

  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
}

.nav-pill {
  position: absolute;
  top: 8px;
  left: 0;
  height: calc(100% - 16px);
  border-radius: 26px;
  background: linear-gradient(145deg,
      rgba(255, 255, 255, 0.52) 0%,
      rgba(255, 255, 255, 0.28) 55%,
      rgba(255, 255, 255, 0.22) 100%);
  border: 1.2px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 -0.5px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform 0.48s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.48s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 0;
  pointer-events: none;
  will-change: transform, width;
  animation: pill-jelly-idle 0s ease both paused;
}

.floating-nav:has(.nav-pill) .nav-pill {
  animation: none;
}

.nav-item {
  position: relative;
  z-index: 1;
  text-decoration: none;
  color: var(--text-color);
  opacity: 0.5;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 1px;
  transition: opacity 0.3s ease, color 0.3s ease, transform 0.3s ease;
  padding: 8px 18px;
}

.nav-item.router-link-active {
  color: var(--primary-color);
  opacity: 1;
  text-shadow: 0 0 10px var(--primary-color);
}

/* --- 页面切换过渡动画 --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* --- 移动端适配适配 --- */
@media (max-width: 600px) {
  .main-view {
    padding-top: calc(80px + env(safe-area-inset-top));
  }

  .floating-nav {
    width: 92%;
    bottom: calc(20px + env(safe-area-inset-bottom));
  }
}
</style>