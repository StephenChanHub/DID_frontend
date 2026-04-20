<template>
  <div class="did-container">
    <button class="settings-btn" @click="themeStore.showSettingModal = true">⚙️</button>

    <!-- 未登录状态 -->
    <div v-if="!userStore.isLoggedIn" class="guest-section">
      <button class="login-btn" @click="userStore.showAuthModal = true">登录 / 注册</button>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="profile-section">
      <!-- 第一行：头像、昵称、level和coin -->
      <div class="profile-header">
        <div class="avatar-container">
          <div class="avatar-large">{{ userStore.avatarText }}</div>
        </div>
        <div class="profile-info">
          <h2 class="nickname">{{ userStore.nickname }}</h2>
          <div class="level-coin-row">
            <span class="level-tag">LV: {{ userStore.level }}</span>
            <img src="/public/coin.png" alt="Coin" class="coin">
            <span class="points-tag">{{ userStore.points }}</span>
          </div>
        </div>
      </div>

      <!-- 第二行：edit按钮和做题数 -->
      <div class="profile-second-row">
        <button class="edit-btn" @click="handleEditProfile">Edit</button>
        <div class="exercise-count">
          <span class="count-label">做题数</span>
          <span class="count-value">{{ userStore.exerciseCount || 0 }}</span>
        </div>
      </div>

      <!-- 第三行：导航栏 -->
      <div class="navigation-tabs">
        <div class="nav-item" :class="{ active: activeTab === 'bookmark' }" @click="switchTab('bookmark')">
          <span class="nav-icon">📚</span>
          <span class="nav-label">Bookmark</span>
        </div>
        <div class="nav-item" :class="{ active: activeTab === 'bag' }" @click="switchTab('bag')">
          <span class="nav-icon">🎒</span>
          <span class="nav-label">Bag</span>
        </div>
        <div class="nav-item" :class="{ active: activeTab === 'albums' }" @click="switchTab('albums')">
          <span class="nav-icon">📁</span>
          <span class="nav-label">Albums</span>
        </div>
      </div>

      <!-- 退出登录按钮 -->
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

// 当前激活的标签页
const activeTab = ref<'bookmark' | 'bag' | 'albums'>('bookmark');

const handleLogout = () => {
  userStore.logout();
  // 使用router跳转而不是window.location.href
  router.push('/do');
};

// 切换标签页
const switchTab = (tab: 'bookmark' | 'bag' | 'albums') => {
  activeTab.value = tab;
  // 这里可以根据tab加载不同的内容
  console.log('切换到标签:', tab);
};

// 编辑资料
const handleEditProfile = () => {
  userStore.toggleInfoModal(true);
};
</script>

<style scoped>
.did-container {
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box;
}

.settings-btn {
  position: fixed;
  top: calc(25px + env(safe-area-inset-top));
  right: calc(25px + env(safe-area-inset-right));
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 100;
}

/* 未登录状态 */
.guest-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80vh;
}

.login-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* 登录状态 */
.profile-section {
  width: 100%;
}

/* 第一行：头像、昵称、level和coin */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
}

.profile-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nickname {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.level-coin-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-tag {
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.1);
  color: var(--primary-color);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.coin {
  width: 24px;
  height: 24px;
}

.points-tag {
  font-weight: 600;
  color: #ff9900;
  font-size: 16px;
}

/* 第二行：edit按钮和做题数 */
.profile-second-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding: 15px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.edit-btn {
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: var(--primary-color);
  color: white;
}

.exercise-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.count-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.count-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

/* 第三行：导航栏 */
.navigation-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 10px;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-item:hover {
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.05);
  transform: translateY(-2px);
}

.nav-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

/* 退出登录按钮 */
.logout-btn {
  width: 100%;
  margin-top: 20px;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  background: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: var(--primary-color);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    gap: 15px;
  }

  .avatar-large {
    width: 70px;
    height: 70px;
    font-size: 24px;
  }

  .nickname {
    font-size: 1.3rem;
  }

  .navigation-tabs {
    gap: 8px;
  }

  .nav-item {
    padding: 12px 8px;
  }

  .nav-icon {
    font-size: 20px;
  }

  .nav-label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .level-coin-row {
    justify-content: center;
  }

  .profile-second-row {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .exercise-count {
    align-items: flex-start;
  }

  .navigation-tabs {
    flex-direction: column;
  }
}
</style>