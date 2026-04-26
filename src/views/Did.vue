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
          <div class="nickname-row">
            <h2 class="nickname">{{ userStore.nickname }}</h2>
          </div>
          <div class="level-coin-row">
            <span class="level-tag">LV: {{ userStore.level }}</span>
            <img src="/coin.png" alt="Coin" class="coin">
            <span class="points-tag">{{ userStore.coins }}</span>
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
        <div class="did-nav-item" :class="{ active: activeTab === 'bookmark' }" @click="switchTab('bookmark')">
          <!-- <span class="nav-icon">📚</span> -->
          <span class="nav-label">Bookmark</span>
        </div>
        <div class="did-nav-item" :class="{ active: activeTab === 'bag' }" @click="switchTab('bag')">
          <!-- <span class="nav-icon">🎒</span> -->
          <span class="nav-label">Bag</span>
        </div>
        <div class="did-nav-item" :class="{ active: activeTab === 'Store' }" @click="switchTab('Store')">
          <!-- <span class="nav-icon">📁</span> -->
          <span class="nav-label">Store</span>
        </div>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'bookmark'" class="bookmark-content">
          <div class="material-grid">
            <div v-for="item in favoriteMaterials" :key="item.id" class="material-card" @click="goToPractice(item.id)">
              <div class="card-content">
                <h3>{{ item.title }}</h3>
                <p class="summary">{{ item.content }}</p>
              </div>
              <div class="card-footer">
                <span class="type-badge">{{ item.level }}</span>
                <div v-if="hasMeta(item.country) || hasMeta(item.topic)" class="meta-tags">
                  <span v-if="hasMeta(item.country)" class="meta-tag">{{ item.country }}</span>
                  <span v-if="hasMeta(item.topic)" class="meta-tag">{{ item.topic }}</span>
                </div>
              </div>
            </div>

            <div v-if="favoriteMaterials.length === 0" class="empty-state">
              暂无收藏内容，去 Practice 页面点亮收藏星标吧。
            </div>
          </div>
        </div>

        <div v-else class="placeholder-content">
          {{ activeTab === 'bag' ? 'Bag 功能建设中' : 'Store 功能建设中' }}
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';
import request from '@/api/request';

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();
const favoriteMaterials = ref<any[]>([]);

// 当前激活的标签页
const activeTab = ref<'bookmark' | 'bag' | 'Store'>('bookmark');

const fetchFavoriteMaterials = async () => {
  if (!userStore.isLoggedIn) {
    favoriteMaterials.value = [];
    return;
  }

  try {
    const res: any = await request.get('/favorites');
    favoriteMaterials.value = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('获取收藏列表失败', error);
    favoriteMaterials.value = [];
  }
};

// 切换标签页
const switchTab = (tab: 'bookmark' | 'bag' | 'Store') => {
  activeTab.value = tab;
  if (tab === 'bookmark') {
    fetchFavoriteMaterials();
  }
};

// 编辑资料
const handleEditProfile = () => {
  userStore.toggleInfoModal(true);
};

const goToPractice = (id: number) => {
  router.push({
    path: `/practice/${id}`,
    query: {
      source: 'favorites'
    }
  });
};

const hasMeta = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

onMounted(() => {
  fetchFavoriteMaterials();
});

watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchFavoriteMaterials();
  } else {
    favoriteMaterials.value = [];
  }
});
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
  font-size: 40px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  will-change: transform;
}

.settings-btn:hover {
  animation: settings-pop-spin 1s ease;
}

@keyframes settings-pop-spin {
  0% {
    transform: scale(1) rotate(0deg);
  }

  18% {
    transform: scale(1.14) rotate(0deg);
  }

  100% {
    transform: scale(1) rotate(360deg);
  }
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
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.nickname-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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
  /* border-top: 1px solid rgba(0, 0, 0, 0.1); */
  /* border-bottom: 1px solid rgba(0, 0, 0, 0.1); */
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
  margin-bottom: 20px;
  gap: 10px;
}

.did-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.did-nav-item:hover {
  /* background: var(--primary-color); */
  /* color: white; */
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.did-nav-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb, 74, 144, 226), 0.3);
}



/* .nav-icon {
  font-size: 24px;
  margin-bottom: 8px;
} */

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

.tab-content {
  margin-bottom: 20px;
}

.bookmark-content {
  width: 100%;
}

.material-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.material-card {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
}

.card-content h3 {
  margin: 0 0 10px;
  font-size: 1.02rem;
}

.summary {
  margin: 0;
  color: #5d6470;
  line-height: 1.5;
  max-height: 3em;
  overflow: hidden;
}

.card-footer {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-badge {
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.15);
  color: var(--primary-color);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.meta-tags {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tag {
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.12);
  color: var(--primary-color);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.empty-state,
.placeholder-content {
  border-radius: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  color: #606a77;
  padding: 24px;
  text-align: center;
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

  .nickname-row {
    justify-content: center;
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
    flex-direction: row;
    gap: 8px;
  }

  .nav-item {
    flex: 1;
    padding: 12px 8px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .nav-icon {
    font-size: 20px;
    margin-bottom: 6px;
  }

  .nav-label {
    font-size: 12px;
    font-weight: 500;
  }

  .nickname-row {
    justify-content: center;
  }
}
</style>
