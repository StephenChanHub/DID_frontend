<template>
  <div class="modal-mask" @click.self="themeStore.showSettingModal = false">
    <div class="setting-card">
      <div class="header">
        <h3>Settings</h3>
        <button class="close-btn" @click="themeStore.showSettingModal = false">×</button>
      </div>

      <div class="section">
        <p class="section-title">Display Mode</p>
        <div class="mode-toggle" @click="themeStore.toggleDarkMode">
          <div class="track">
            <div class="thumb" :class="{ dark: themeStore.isDarkMode }">
              {{ themeStore.isDarkMode ? 'Dark' : 'Light' }}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <p class="section-title">Theme Color Palette</p>
        <div
          ref="carouselRef"
          class="color-carousel"
          :class="{ dragging: isDragging }"
          @touchstart.prevent="onDragStart($event, 'touch')"
          @touchmove.prevent="onDragMove($event, 'touch')"
          @touchend="onDragEnd"
          @mousedown.prevent="onDragStart($event, 'mouse')"
          @mousemove="onDragMove($event, 'mouse')"
          @mouseup="onDragEnd"
          @mouseleave="onDragEnd"
        >
          <div
            v-for="color in colorLibrary"
            :key="color"
            class="color-dot"
            :style="{ background: color }"
            :class="{ active: themeStore.primaryColor === color }"
            @click="onColorClick(color)"
          ></div>
        </div>
      </div>

      <div v-if="userStore.isLoggedIn" class="section account-section">
        <p class="section-title">Account</p>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>

      <div class="auth">
        <p class="section-title">Feedback</p>
        <!-- <div class="auth-divider"></div> -->
        <div class="auth-content">
          <img class="auth-icon" src="/public/email.png" />
          <div class="auth-info">
            <p class="email">stephenchan2026@outlook.com</p>
            <p class="version">DID v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { useRouter } from 'vue-router';

const themeStore = useThemeStore();
const userStore = useUserStore();
const router = useRouter();
const colorLibrary = ['#F5569B', '#701D1C', '#0D21A5',
'#91040C', '#548656', '#59597a', '#e5d778', '#354864', '#dea947', '#402925'];

const carouselRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const scrollStart = ref(0);
const hasMoved = ref(false);

const getClientX = (e: TouchEvent | MouseEvent, type: 'touch' | 'mouse') =>
  type === 'touch' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;

const onDragStart = (e: TouchEvent | MouseEvent, type: 'touch' | 'mouse') => {
  isDragging.value = true;
  hasMoved.value = false;
  startX.value = getClientX(e, type);
  scrollStart.value = carouselRef.value?.scrollLeft ?? 0;
};

const onDragMove = (e: TouchEvent | MouseEvent, type: 'touch' | 'mouse') => {
  if (!isDragging.value || !carouselRef.value) return;
  const dx = getClientX(e, type) - startX.value;
  if (Math.abs(dx) > 3) hasMoved.value = true;
  carouselRef.value.scrollLeft = scrollStart.value - dx;
};

const onDragEnd = () => {
  isDragging.value = false;
};

const onColorClick = (color: string) => {
  if (hasMoved.value) return;
  themeStore.setPrimaryColor(color);
};

const handleLogout = () => {
  userStore.logout();
  themeStore.showSettingModal = false;
  router.push('/do');
};
</script>

<style scoped>
.modal-mask {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.setting-card {
  height: 500px;
  width: 360px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(200px);
  border-radius: 36px; padding: 25px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.5);
  display: flex;
  flex-direction: column;
}
.header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.section { margin-bottom: 10px; }
.section-title { font-size: 0.85rem; color: #888; margin-bottom: 12px; }

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
  line-height: 1;
  padding: 0 4px;
}

/* 模式切换开关样式 */
.mode-toggle { display: flex; align-items: center; gap: 15px; cursor: pointer; }
.track {
    width: 100px; height: 36px;
    background: #eee;
    border-radius: 16px;
    position: relative;
    transition: 0.3s;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1),
              inset -3px -3px 7px rgba(255,255,255,0.7);
}
.thumb {
    font-size: 12px;
    border: #eee solid 0.5px;
  position: absolute; left: 4px; top: 4px; width: 45px; height: 28px;
  background: #fff; border-radius: 16px; display: flex; align-items: center;
  justify-content: center; transition: 0.5s; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
.thumb.dark { left: 50px; background: #333; }

/* 颜色选择器轮播 */
.color-carousel { display: flex; overflow-x: auto; gap: 20px; padding: 10px 0; cursor: grab; user-select: none; -webkit-user-select: none; }
.color-carousel.dragging { cursor: grabbing; }
.color-carousel::-webkit-scrollbar { display: none; }
.color-carousel { -ms-overflow-style: none; scrollbar-width: none; }
.color-dot {
  width: 50px; height: 100px; border-radius: 15px; cursor: pointer;
  transition: transform 0.2s; border: 2px solid transparent;
  flex-shrink: 0;
}
.color-dot.active { transform: scale(1.1);
    border: #fff solid 5px;
 box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

.account-section {
  margin-top: 12px;
}

.logout-btn {
  width: 100%;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  background: transparent;
  border-radius: 20px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: var(--primary-color);
  color: #fff;
}

/* 底部作者信息 */
.auth {
  opacity: 1;
  margin-top: auto;
  padding-top: 4px;
}

.auth-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.8);
  margin-bottom: 14px;
}

.auth-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}

.auth-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.auth-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.email {
  font-size: 0.9rem;
  color: #000000;
  margin: 0;
}

.version {
  font-size: 0.7rem;
  color: #aaa;
  margin: 0;
}
</style>
