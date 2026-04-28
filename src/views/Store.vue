<template>
  <div class="page">
    <div class="shell">
      <header class="topbar">
        <div class="Wrap">
          <img class="Salesperson" :src="`/public/Salesperson0${salesperson}.png`" alt="salesperson" />
          <span class="Text">{{ mode === 'buy' ? 'Welcome to the DID Store! What do you need?' : 'Welcome! What do you want to sell?' }}</span>
        </div>

        <div class="actionGroup">
          <button class="actionBtn" :class="{ primary: mode === 'buy' }" @click="switchMode('buy')">buy</button>
          <button class="actionBtn" :class="{ primary: mode === 'sell' }" @click="switchMode('sell')">sell</button>
        </div>
      </header>

      <main class="content" :class="{ noSidebar: mode === 'sell' }">
        <aside v-if="mode === 'buy'" class="sidebar">
          <button
            v-for="cat in categories"
            :key="cat.value"
            class="categoryBtn"
            :class="{ active: selectedCategory === cat.value }"
            @click="selectedCategory = cat.value"
          >
            {{ cat.label }}
          </button>
        </aside>

        <section class="productPanel">
          <div v-if="loading" class="loading-state">Loading...</div>
          <div v-else-if="filteredProducts.length === 0" class="empty-state">
            {{ mode === 'buy' ? 'Nothing available for purchase right now.' : 'No items to sell.' }}
          </div>
          <div v-else class="grid">
            <article
              v-for="item in filteredProducts"
              :key="item.uid"
              class="card"
              @click="openDetail(item)"
            >
              <div class="thumb">
                <img
                  v-if="item._isCollection && item.image_url"
                  :src="buildFileUrl(item.image_url) || undefined"
                  :alt="item.name"
                  class="thumb-img"
                />
                <span v-else>{{ item.emoji || '📀' }}</span>
              </div>
              <div class="cardBody">
                <h3 class="title">{{ item.name }}</h3>
                <p v-if="mode === 'buy'" class="desc">{{ item.buy_price }} Coins</p>
                <p v-else class="desc">x{{ item.quantity }} · {{ item.sell_price }} Coin each</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <button class="backBtn" @click="goBack">← back</button>
    </div>

    <ItemDetailModal
      :visible="detailVisible"
      :item="selectedItem"
      mode="store"
      :store-sub-mode="mode"
      @cancel="detailVisible = false"
      @buy="handleBuy"
      @sell="handleSellItem"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import request from '@/api/request';
import ItemDetailModal from '@/components/ItemDetailModal.vue';
import { buildFileUrl } from '@/config/env';

const router = useRouter();
const userStore = useUserStore();
const goBack = () => router.back();

onMounted(() => {
  if (!userStore.isLoggedIn) {
    userStore.showAuthModal = true;
  }
  fetchProducts();
});

const salesperson = ref(Math.floor(Math.random() * 3) + 1);
const mode = ref<'buy' | 'sell'>('buy');
const selectedCategory = ref('food');
const loading = ref(false);

const categories = [
  { value: 'food', label: 'food' },
  { value: 'collections', label: 'collections' }
];

// 所有可购买的商品
const buyItems = ref<any[]>([]);
const buyCollections = ref<any[]>([]);

// 用户可出售的物品
const sellItems = ref<any[]>([]);

// 产品列表（统一格式）
interface ProductItem {
  uid: string;
  _isCollection: boolean;
  id: number;
  name: string;
  emoji: string;
  description: string;
  buy_price: number;
  sell_price: number;
  image_url?: string;
  media_url?: string;
  type?: string;
  quantity?: number;
  recovery_value?: number;
}

const products = computed<ProductItem[]>(() => {
  if (mode.value === 'buy') {
    const items: ProductItem[] = buyItems.value
      .filter((i: any) => i.buy_price > 0)
      .map((i: any) => ({
        uid: `item-${i.id}`,
        _isCollection: false,
        id: i.id,
        name: i.name,
        emoji: i.emoji,
        description: i.description || '',
        buy_price: i.buy_price,
        sell_price: i.sell_price || 0,
        type: i.type,
        recovery_value: i.recovery_value || 0
      }));
    const cols: ProductItem[] = buyCollections.value
      .filter((c: any) => c.buy_price > 0)
      .map((c: any) => ({
        uid: `col-${c.id}`,
        _isCollection: true,
        id: c.id,
        name: c.name,
        emoji: '',
        description: c.description || '',
        buy_price: c.buy_price,
        sell_price: 0,
        image_url: c.image_url,
        media_url: c.media_url
      }));
    return [...items, ...cols];
  }
  return sellItems.value
    .filter((i: any) => i.type === 'item' && i.sell_price > 0)
    .map((i: any) => ({
      uid: `sell-${i.item_id}`,
      _isCollection: false,
      id: i.item_id,
      name: i.name,
      emoji: i.emoji,
      description: i.description || '',
      buy_price: 0,
      sell_price: i.sell_price,
      quantity: i.quantity,
      type: i.type
    }));
});

const filteredProducts = computed(() => {
  if (mode.value === 'sell') return products.value;
  if (selectedCategory.value === 'food') {
    return products.value.filter(p => !p._isCollection);
  }
  return products.value.filter(p => p._isCollection);
});

// 详情弹窗
const detailVisible = ref(false);
const selectedItem = ref<ProductItem>({
  uid: '',
  _isCollection: false,
  id: 0,
  name: '',
  emoji: '',
  description: '',
  buy_price: 0,
  sell_price: 0
});

const openDetail = (item: ProductItem) => {
  selectedItem.value = { ...item };
  detailVisible.value = true;
};

const switchMode = (m: 'buy' | 'sell') => {
  mode.value = m;
  if (m === 'buy') {
    selectedCategory.value = 'food';
  }
  fetchProducts();
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    if (mode.value === 'buy') {
      const [itemsRes, colsRes] = await Promise.all([
        request.get('/admin/items', { params: { type: 'food' } }).catch(() => ({ items: [] })),
        request.get('/admin/collections').catch(() => ({ collections: [] }))
      ]);
      buyItems.value = (itemsRes as any)?.items || [];
      buyCollections.value = (colsRes as any)?.collections || [];
    } else {
      const res: any = await request.get('/items/inventory');
      sellItems.value = Array.isArray(res.items) ? res.items : [];
    }
  } catch (err) {
    console.error('Failed to fetch products', err);
  } finally {
    loading.value = false;
  }
};

const handleBuy = async (itemId: number, quantity: number) => {
  const item = selectedItem.value;
  try {
    if (item._isCollection) {
      const res: any = await request.post('/shop/buy', { collectionId: itemId });
      userStore.updateCoins(res.coins);
    } else {
      const res: any = await request.post('/shop/buy', { itemId, quantity });
      userStore.updateCoins(res.coins);
    }
    detailVisible.value = false;
    await fetchProducts();
    // Refresh user stats
    const statsRes: any = await request.get('/user/stats');
    if (statsRes) {
      userStore.updateCoins(statsRes.coins);
    }
  } catch (err) {
    console.error('Buy failed', err);
  }
};

const handleSellItem = async (itemId: number, quantity: number) => {
  try {
    const res: any = await request.post('/items/sell', { itemId, quantity });
    userStore.updateCoins(res.coins);
    detailVisible.value = false;
    await fetchProducts();
  } catch (err) {
    console.error('Sell failed', err);
  }
};

watch(() => userStore.isLoggedIn, (v) => { if (v) fetchProducts(); });
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-color);
  display: flex;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.shell {
  width: min(1200px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.topbar {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.Wrap {
  flex: 1;
  height: 100px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-sizing: border-box;
  background: transparent;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.Salesperson {
  width: 80px;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
}

.Text {
  position: relative;
  margin-left: 24px;
  padding: 14px 22px;
  font-size: 24px;
  color: black;
  font-weight: 800;
  background: #fff;
  border-radius: 4px 18px 18px 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  line-height: 1.4;
}

.Text::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 24px;
  border: 6px solid transparent;
  border-right-color: #fff;
}

.actionGroup {
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actionBtn {
  height: 45px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 24px;
  color: var(--primary-color);
  opacity: 0.7;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  -webkit-appearance: none;
  appearance: none;
  touch-action: manipulation;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.actionBtn.primary {
  opacity: 1;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
}

.content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 24px;
}

.content.noSidebar {
  grid-template-columns: 1fr;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.categoryBtn {
  min-height: 96px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 28px;
  color: black;
  font-weight: 500;
  text-transform: lowercase;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  appearance: none;
  touch-action: manipulation;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.categoryBtn:active {
  transform: scale(0.96);
}

.categoryBtn.active {
  background: rgba(255, 255, 255, 0.6);
  opacity: 1;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
}

.categoryBtn:not(.active) {
  opacity: 0.7;
}

.productPanel {
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-width: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
}

.card {
  min-height: 170px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  box-sizing: border-box;
  transition: background 0.2s;
  cursor: pointer;
}

.card:hover {
  background: rgba(255, 255, 255, 0.3);
}

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 26px;
  color: var(--primary-color);
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  margin: 0;
  font-size: 20px;
  color: black;
  font-weight: 500;
  text-align: center;
}

.desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: black;
  opacity: 0.7;
  text-align: center;
}

.loading-state,
.empty-state {
  padding: 60px 24px;
  text-align: center;
  color: #606a77;
  font-size: 0.95rem;
}

.backBtn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 72px;
  height: 72px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 18px;
  color: var(--primary-color);
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 100;
}

.backBtn:hover {
  transform: scale(1.08);
  background: rgba(255, 255, 255, 0.6);
}

@media (max-width: 900px) {
  .topbar {
    flex-direction: column;
  }

  .actionGroup {
    position: fixed;
    bottom: 96px;
    right: 20px;
    width: auto;
    flex-direction: column;
    gap: 8px;
    z-index: 99;
  }

  .actionBtn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    margin: 0;
    opacity: 1;
  }

  .actionBtn.primary {
    background: rgba(255, 255, 255, 0.6);
  }

  .content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }

  .categoryBtn {
    flex: 1 1 120px;
    min-height: 44px;
    font-size: 18px;
  }

  .Wrap {
    height: auto;
    padding: 12px 16px;
  }

  .Salesperson {
    width: 72px;
    height: 72px;
  }

  .Text {
    font-size: 16px;
    padding: 10px 14px;
    margin-left: 16px;
    border-radius: 3px 14px 14px 14px;
  }

  .Text::before {
    left: -8px;
    top: 18px;
    border-width: 5px;
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    min-height: 140px;
    padding: 12px 8px;
  }

  .thumb {
    width: 36px;
    height: 36px;
    font-size: 20px;
    margin-bottom: 10px;
  }

  .title {
    font-size: 16px;
  }

  .desc {
    font-size: 12px;
  }

  .backBtn {
    width: 56px;
    height: 56px;
    font-size: 14px;
    bottom: 20px;
    right: 20px;
  }
}
</style>
