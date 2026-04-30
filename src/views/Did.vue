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
          <!-- 体力条 -->
          <div class="stamina-row">
            <div class="stamina-bar-bg">
              <div class="stamina-bar-fill" :style="{ width: staminaPercent + '%' }"></div>
            </div>
            <span class="stamina-text">{{ userStore.stamina }}/{{ userStore.maxStamina }}</span>
          </div>
        </div>
      </div>

      <!-- 第二行：edit按钮和做题数 -->
      <div class="profile-second-row">
        <button class="edit-btn" @click="handleEditProfile">Edit</button>
        <div class="exercise-count">
          <span class="count-label">practiced</span>
          <span class="count-value">{{ userStore.totalQuestions || 0 }}</span>
        </div>
      </div>

      <!-- 第三行：导航栏 -->
      <div class="navigation-tabs">
        <div class="nav-dropdown-wrapper">
          <div class="did-nav-item" :class="{ active: activeTab === 'bookmark', 'dropdown-open': showBookmarkDropdown }" @click="toggleBookmarkDropdown">
            <span class="nav-label">Bookmark</span>
            <span class="dropdown-arrow">▾</span>
          </div>
          <div v-if="showBookmarkDropdown" class="dropdown-menu">
            <div class="dropdown-item" :class="{ selected: bookmarkFilter === 'all' }" @click="selectBookmarkFilter('all')">Bookmark</div>
            <div class="dropdown-item" :class="{ selected: bookmarkFilter === 'listening' }" @click="selectBookmarkFilter('listening')">listening</div>
            <div class="dropdown-item" :class="{ selected: bookmarkFilter === 'reading' }" @click="selectBookmarkFilter('reading')">reading</div>
          </div>
        </div>
        <div class="nav-dropdown-wrapper">
          <div class="did-nav-item" :class="{ active: activeTab === 'bag', 'dropdown-open': showBagDropdown }" @click="toggleBagDropdown">
            <span class="nav-label">Bag</span>
            <span class="dropdown-arrow">▾</span>
          </div>
          <div v-if="showBagDropdown" class="dropdown-menu">
            <div class="dropdown-item" :class="{ selected: bagSubTab === 'all' }" @click="selectBagSubTab('all')">bag</div>
            <div class="dropdown-item" :class="{ selected: bagSubTab === 'food' }" @click="selectBagSubTab('food')">food</div>
            <div class="dropdown-item" :class="{ selected: bagSubTab === 'items' }" @click="selectBagSubTab('items')">items</div>
          </div>
        </div>
        <div class="did-nav-item" :class="{ active: activeTab === 'collections' }" @click="switchTab('collections')">
          <span class="nav-label">Collections</span>
        </div>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'bookmark'" class="bookmark-content">
          <div class="material-grid">
            <div v-for="item in filteredMaterials" :key="item.id" class="material-card" @click="goToPractice(item.id)">
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

            <div v-if="filteredMaterials.length === 0" class="empty-state">
              暂无收藏内容，去 Practice 页面点亮收藏星标吧。
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'bag'" class="bag-content">
          <Bag :filter="bagSubTab" />
        </div>

        <div v-else-if="activeTab === 'collections'" class="collections-content">
          <Collections @open-album="handleOpenAlbum" />
        </div>
      </div>

    </div>

    <Album
      :visible="showAlbum"
      :image-url="albumItem?.image_url || null"
      :media-url="albumItem?.media_url || null"
      :name="albumItem?.name || ''"
      mode="view"
      :price="0"
      :collection-id="albumItem?.collection_id || 0"
      @close="showAlbum = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';
import request from '@/api/request';
import Bag from '@/components/Bag.vue';
import Collections from '@/components/Collections.vue';
import Album from '@/components/Album.vue';

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();
const favoriteMaterials = ref<any[]>([]);

// 体力百分比
const staminaPercent = computed(() =>
  Math.min(100, Math.max(0, (userStore.stamina / userStore.maxStamina) * 100))
);

// 当前激活的标签页
const activeTab = ref<'bookmark' | 'bag' | 'collections'>('bookmark');

// 收藏筛选
const bookmarkFilter = ref<'all' | 'listening' | 'reading'>('all');

// Bag 子标签
const bagSubTab = ref<'all' | 'food' | 'items'>('all');

// 下拉菜单状态
const showBookmarkDropdown = ref(false);
const showBagDropdown = ref(false);

// 筛选后的收藏内容
const filteredMaterials = computed(() => {
  if (bookmarkFilter.value === 'all') return favoriteMaterials.value;
  return favoriteMaterials.value.filter((item: any) => item.type === bookmarkFilter.value);
});

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

// 同步用户状态数据
const syncUserStats = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    const res: any = await request.get('/user/stats');
    if (res) {
      userStore.updateStamina(res.stamina, res.maxStamina);
      userStore.updateCoins(res.coins);
      if (typeof res.totalQuestions === 'number') {
        userStore.updateTotalQuestions(res.totalQuestions);
      }
    }
  } catch (err) {
    console.error('Sync user stats failed', err);
  }
};

// 切换标签页
const switchTab = (tab: 'bookmark' | 'bag' | 'collections') => {
  activeTab.value = tab;
  showBookmarkDropdown.value = false;
  showBagDropdown.value = false;
  if (tab === 'bookmark') {
    fetchFavoriteMaterials();
  }
};

// Bookmark 下拉菜单
const toggleBookmarkDropdown = () => {
  activeTab.value = 'bookmark';
  showBagDropdown.value = false;
  showBookmarkDropdown.value = !showBookmarkDropdown.value;
};

const selectBookmarkFilter = (filter: 'all' | 'listening' | 'reading') => {
  bookmarkFilter.value = filter;
  showBookmarkDropdown.value = false;
};

// Bag 下拉菜单
const toggleBagDropdown = () => {
  activeTab.value = 'bag';
  showBookmarkDropdown.value = false;
  showBagDropdown.value = !showBagDropdown.value;
};

const selectBagSubTab = (tab: 'all' | 'food' | 'items') => {
  bagSubTab.value = tab;
  showBagDropdown.value = false;
};

// 点击外部关闭下拉菜单
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.nav-dropdown-wrapper')) {
    showBookmarkDropdown.value = false;
    showBagDropdown.value = false;
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

// Album overlay state
const showAlbum = ref(false);
const albumItem = ref<any>(null);

const handleOpenAlbum = (item: any) => {
  albumItem.value = item;
  showAlbum.value = true;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchFavoriteMaterials();
  syncUserStats();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchFavoriteMaterials();
    syncUserStats();
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

/* 体力条 */
.stamina-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.stamina-bar-bg {
  flex: 1;
  max-width: 180px;
  height: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.stamina-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.5s ease;
}

.stamina-text {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

/* 第二行：edit按钮和做题数 */
.profile-second-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding: 15px 0;
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

/* 下拉菜单 */
.nav-dropdown-wrapper {
  position: relative;
  flex: 1;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  color: #333;
}

.dropdown-item:hover {
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.1);
}

.dropdown-item.selected {
  color: var(--primary-color);
  font-weight: 700;
}

.dropdown-arrow {
  font-size: 20px;
  margin-left: 4px;
  display: inline-block;
  transition: transform 0.3s ease;
}

.dropdown-open .dropdown-arrow {
  transform: rotate(180deg);
}

.did-nav-item.active .dropdown-arrow {
  color: white;
}

.bag-content,
.collections-content {
  width: 100%;
}

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

  .stamina-bar-bg {
    max-width: 120px;
  }

  .navigation-tabs {
    gap: 8px;
  }

  .nav-label {
    font-size: 13px;
  }

  .nickname-row {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .profile-header {
    gap: 12px;
  }

  .avatar-large {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }

  .nickname {
    margin-right: auto;
    font-size: 1.2rem;
  }

  .level-coin-row {
    gap: 6px;
  }

  .level-tag {
    padding: 3px 10px;
    font-size: 12px;
  }

  .points-tag {
    font-size: 14px;
  }

  .stamina-row {
    gap: 6px;
  }

  .stamina-bar-bg {
    max-width: 100px;
  }

  .stamina-text {
    font-size: 10px;
  }

  .profile-second-row {
    padding: 12px 0;
  }

  .edit-btn {
    padding: 6px 16px;
    font-size: 13px;
  }

  .count-value {
    font-size: 20px;
  }

  .navigation-tabs {
    gap: 6px;
  }

  .did-nav-item {
    padding: 12px 6px;
    border-radius: 14px;
  }

  .nav-label {
    font-size: 12px;
    font-weight: 500;
  }
}
</style>




