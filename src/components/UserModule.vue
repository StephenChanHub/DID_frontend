<template>
  <div class="user-module" @click="handleUserClick">
    <div v-if="!userStore.avatar" class="text-avatar-mini">
      {{ userStore.avatarText }}
    </div>
    <img v-else :src="userStore.avatar" class="mini-avatar" />
    <div v-if="userStore.isLoggedIn" class="user-name">
      {{ userStore.nickname }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';
const userStore = useUserStore();

const handleUserClick = () => {
  if (!userStore.isLoggedIn) {
    userStore.showAuthModal = true; // 强制呼出登录
  } else {
    userStore.showInfoModal = true; // 强制呼出修改信息
  }
};
</script>

<style scoped>
.user-module {
  position: fixed;
  top: calc(20px + env(safe-area-inset-top));
  left: calc(20px + env(safe-area-inset-left));
  width: 60px; height: 60px;
  background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    border: 0.5px solid rgba(255, 255, 255, 0.4);
    box-shadow:
        0 18px 46px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  transition: 0.3s;
}
.text-avatar-mini {
  width: 42px; height: 42px; border-radius: 12px;
  background: var(--primary-color); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 14px;
}
.user-name {
  position: absolute; left: 70px; font-size: 13px;
  color: var(--text-color); font-weight: 600;
  background: var(--glass-bg); padding: 4px 10px; border-radius: 8px;
}
</style>