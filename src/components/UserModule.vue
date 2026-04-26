<template>
  <Electricborder
    class="user-module"
    :speed="0.8"
    :chaos="0.15"
    :border-radius="18"
    @click="handleUserClick"
  >
    <div v-if="!userStore.avatar" class="text-avatar-mini">
      {{ userStore.avatarText }}
    </div>
  </Electricborder>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';
import Electricborder from './Electricborder.vue';

const userStore = useUserStore();

const handleUserClick = () => {
  if (!userStore.isLoggedIn) {
    userStore.showAuthModal = true;
  } else {
    userStore.showInfoModal = true;
  }
};
</script>

<style scoped>
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
  position: fixed;
  top: calc(20px + env(safe-area-inset-top));
  left: calc(20px + env(safe-area-inset-left));
  cursor: pointer;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>