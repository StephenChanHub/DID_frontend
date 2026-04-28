<template>
  <div class="user-module-wrapper">
    <div class="user-module" @click="handleUserClick">
      <div v-if="!userStore.avatar" class="text-avatar-mini">
        {{ userStore.avatarText }}
      </div>
    </div>
    <div v-if="userStore.isLoggedIn" class="stamina-bar-wrap">
      <div class="stamina-bar-fill" :style="{ width: staminaPercent + '%' }"></div>
      <canvas ref="staminaCanvasRef" class="stamina-canvas" />
      <span class="stamina-text">{{ userStore.stamina }}/{{ userStore.maxStamina }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const staminaPercent = computed(() =>
  Math.min(100, Math.max(0, (userStore.stamina / userStore.maxStamina) * 100))
);

const staminaCanvasRef = ref<HTMLCanvasElement | null>(null);
let staminaAnimId: number | null = null;
let staminaTime = 0;
let staminaLastTime = 0;

const BAR_W = 60;
const BAR_H = 8;

const drawStaminaElectric = (now: number) => {
  const canvas = staminaCanvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = BAR_W * dpr;
  canvas.height = BAR_H * dpr;
  canvas.style.width = BAR_W + 'px';
  canvas.style.height = BAR_H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const delta = staminaLastTime ? (now - staminaLastTime) / 1000 : 0.016;
  staminaLastTime = now;

  const pct = staminaPercent.value / 100;
  const speed = 0.4 + pct * 2.0;
  const chaos = 0.02 + pct * 0.28;

  staminaTime += delta * speed;

  ctx.clearRect(0, 0, BAR_W, BAR_H);

  const fillW = Math.max(0, BAR_W * pct);
  if (fillW <= 0) {
    staminaAnimId = requestAnimationFrame(drawStaminaElectric);
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, fillW, BAR_H);
  ctx.clip();

  ctx.strokeStyle = '#8bc34a';
  ctx.lineWidth = 0.6;

  for (let line = 0; line < 3; line++) {
    const phase = line * 2.1;
    ctx.beginPath();
    for (let x = 0; x <= BAR_W; x += 1) {
      const n1 = Math.sin(x * 0.35 + staminaTime * 3.5 + phase) * chaos * BAR_H * 0.45;
      const n2 = Math.sin(x * 0.7 + staminaTime * 6.0 + phase * 1.7) * chaos * BAR_H * 0.25;
      const n3 = Math.sin(x * 1.3 + staminaTime * 9.0 + phase * 0.5) * chaos * BAR_H * 0.15;
      const y = BAR_H / 2 + n1 + n2 + n3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
  staminaAnimId = requestAnimationFrame(drawStaminaElectric);
};

onMounted(() => {
  staminaAnimId = requestAnimationFrame(drawStaminaElectric);
});

onUnmounted(() => {
  if (staminaAnimId) cancelAnimationFrame(staminaAnimId);
});

const handleUserClick = () => {
  if (!userStore.isLoggedIn) {
    userStore.showAuthModal = true;
  } else {
    userStore.showInfoModal = true;
  }
};
</script>

<style scoped>
.user-module-wrapper {
  position: fixed;
  top: calc(20px + env(safe-area-inset-top));
  left: calc(20px + env(safe-area-inset-left));
  z-index: 1001;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.text-avatar-mini {
  width: 58px;
  height: 58px;
  border-radius: 12px;
  background: var(--primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
}

.user-module {
  width: 60px;
  height: 60px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stamina-bar-wrap {
  width: 60px;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.stamina-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.5s ease;
}

.stamina-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.stamina-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: 700;
  color: #333;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
  line-height: 1;
  z-index: 2;
}
</style>
