<template>
<div class="background">
    <img class="bg-img" src="/public/store.png" />
    <div class="Wrap">
      <span class="Salesperson">👾</span>
      <span class="Text">{{ feedbackMessage }}</span>
    </div>

    <div class="actionGroup">
      <button class="actionBtn" :class="{ primary: mode === 'buy' }" @click="switchMode('buy')">buy</button>
      <button class="actionBtn" :class="{ primary: mode === 'sell' }" @click="switchMode('sell')">sell</button>
    </div>
  </div>

  <div class="page">
    <div class="shell">
      <main class="content" :class="{ noSidebar: mode === 'sell' }">
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
                <span v-else class="emoji">{{ item.emoji || '📀' }}</span>
              </div>
              <div class="cardBody">
                <h3 class="title">{{ item.name }}</h3>
                <p v-if="item._isCollection && item.description" class="desc-text">{{ item.description }}</p>
                <p v-if="mode === 'buy'" class="desc">{{ item.buy_price }} Coins</p>
                <p v-else class="desc">x{{ item.quantity }} · {{ item.sell_price }} Coin each</p>
              </div>
            </article>
          </div>
        </section>

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
      </main>

      <button class="backBtn" @click="goBack">🔙 </button>
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

    <Album
      :visible="showAlbum"
      :image-url="albumItem?.image_url || null"
      :media-url="albumItem?.media_url || null"
      :name="albumItem?.name || ''"
      mode="store"
      :price="albumItem?.buy_price || 0"
      :collection-id="albumItem?.id || 0"
      @close="showAlbum = false"
      @buy="handleAlbumBuy"
      @timeout="handleAlbumTimeout"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import request from '@/api/request';
import ItemDetailModal from '@/components/ItemDetailModal.vue';
import Album from '@/components/Album.vue';
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

const feedbackMessage = ref('Welcome to the DID Store! What do you need?');
let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

const setFeedback = (msg: string) => {
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackMessage.value = msg;
  feedbackTimer = setTimeout(() => {
    feedbackMessage.value = mode.value === 'buy'
      ? 'Welcome to the DID Store! What do you need?'
      : 'What do you want to sell?';
  }, 5000);
};

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
  category?: string;
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
        media_url: c.media_url,
        category: c.category
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
  if (item._isCollection && item.category === 'album') {
    albumItem.value = item;
    showAlbum.value = true;
    return;
  }
  selectedItem.value = { ...item };
  detailVisible.value = true;
};

// Album overlay state
const showAlbum = ref(false);
const albumItem = ref<ProductItem | null>(null);

const handleAlbumBuy = async (collectionId: number) => {
  const album = albumItem.value;
  try {
    const res: any = await request.post('/shop/buy', { collectionId });
    userStore.updateCoins(res.coins);
    if (album) setFeedback(`You bought ${album.name} for ${album.buy_price} coins!`);
    showAlbum.value = false;
    await fetchProducts();
    const statsRes: any = await request.get('/user/stats');
    if (statsRes) {
      userStore.updateCoins(statsRes.coins);
    }
  } catch (err) {
    setFeedback("You don't have enough coins! Keep practicing to earn more.");
    console.error('Buy album failed', err);
  }
};

const handleAlbumTimeout = () => {
  setFeedback("You can only enjoy it for 5 seconds if you haven't purchased it.");
};

const switchMode = (m: 'buy' | 'sell') => {
  mode.value = m;
  if (m === 'buy') {
    selectedCategory.value = 'food';
    feedbackMessage.value = 'Welcome to the DID Store! What do you need?';
  } else {
    feedbackMessage.value = 'What do you want to sell?';
  }
  fetchProducts();
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    if (mode.value === 'buy') {
      const [itemsRes, colsRes] = await Promise.all([
        request.get('/shop/items').catch(() => ({ items: [] })),
        request.get('/shop/collections').catch(() => ({ collections: [] }))
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
      setFeedback(`You bought ${item.name} for ${item.buy_price} coins!`);
    } else {
      const res: any = await request.post('/shop/buy', { itemId, quantity });
      userStore.updateCoins(res.coins);
      setFeedback(`You bought ${quantity} ${item.name} for ${item.buy_price * quantity} coins!`);
    }
    detailVisible.value = false;
    await fetchProducts();
    const statsRes: any = await request.get('/user/stats');
    if (statsRes) {
      userStore.updateCoins(statsRes.coins);
    }
  } catch (err) {
    setFeedback("You don't have enough coins! Keep practicing to earn more.");
    console.error('Buy failed', err);
  }
};

const handleSellItem = async (itemId: number, quantity: number) => {
  const item = selectedItem.value;
  try {
    const res: any = await request.post('/items/sell', { itemId, quantity });
    userStore.updateCoins(res.coins);
    setFeedback(`You sold ${quantity} ${item.name} for ${item.sell_price * quantity} coins!`);
    detailVisible.value = false;
    await fetchProducts();
  } catch (err) {
    console.error('Sell failed', err);
  }
};

watch(() => userStore.isLoggedIn, (v) => { if (v) fetchProducts(); });

onUnmounted(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer);
});
</script>

<style scoped>
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60vh;
  z-index: 1;
  overflow: hidden;
}

.bg-img {
  width: 100%;
  height: 80%;
  object-fit: cover;
  display: block;
  mask-image: linear-gradient(to top, transparent 0%, black 30%);
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 30%);
}

.page {
  margin-top: 50%;
  position: relative;
  z-index: 2;
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.shell {
    margin-top: -30%;
  width: 100%;
  max-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.Wrap {
  position: absolute;
  top: 15%;
  left: 30%;
  transform: translate(-50%, -50%);
  height: 100px;
  /* border: 1px solid rgba(255, 255, 255, 0.5); */
  border-radius: 24px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-sizing: border-box;
  background: transparent;
  /* backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); */
  white-space: nowrap;
}

.Salesperson {
  font-size: 80px;
  width: 80px;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
  animation: wave 1.2s ease-in-out infinite;
  display: inline-block;
  transform-origin: bottom center;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
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
  position: absolute;
  top: 25%;
  right: 5%;
  transform: translateY(-50%);
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actionBtn {
  height: 45px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
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
  grid-template-columns: 1fr 180px;
  grid-template-rows: 1fr;
  gap: 24px;
  overflow: hidden;
}

.content.noSidebar {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
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
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-width: 0;
  min-height: 0;
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
  width: 100px;
  height: 100px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 26px;
  color: var(--primary-color);
  overflow: hidden;
}

.emoji {
  font-size: 36px;
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

.desc-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: #555;
  text-align: center;
  line-height: 1.3;
  max-height: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.desc {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  opacity: 0.9;
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
  .background {
    height: 200px;
    z-index: 3;
    pointer-events: none;
  }

  .page {
    padding: 12px;
  }

  .bg-img {
    height: 100%;
    width: 100%;
  }

  .shell {
    position: relative;
    margin-top: -10%;
    padding: 0 16px;
    max-height: calc(100vh - 300px);
    border-radius: 16px;
  }

  .Wrap {
    transform: translate(-40%, 30%) scale(0.5);
  }

  .content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    gap: 16px;
    padding-top: 30px;
    padding-bottom: 10px;
  }

  .content.noSidebar {
    grid-template-rows: 1fr;
    padding-top: 0;
  }

  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    flex-direction: row;
    justify-content: center;
    gap: 12px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 16px 16px 0 0;
    flex-shrink: 0;
  }

  .categoryBtn {
    flex: 0 0 auto;
    min-height: 36px;
    max-height: 36px;
    font-size: 16px;
    padding: 0 20px;
    border-radius: 20px;
    box-shadow: none;
    transition: opacity 0.15s, background 0.2s;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  .categoryBtn.active {
    background: rgba(255, 255, 255, 0.55);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    opacity: 1;
    font-weight: 600;
  }


  .actionGroup {
    position: fixed;
    top: auto;
    right: auto;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    max-width: 500px;
    height: 64px;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.18) 50%, rgba(255, 255, 255, 0.14) 100%);
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(15px) saturate(120%);
    border: 1px solid rgba(255, 255, 255, 0.42);
    box-shadow: 0 18px 52px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(255, 255, 255, 0.5);
    border-radius: 34px;
    gap: 0;
    z-index: 1000;
    pointer-events: auto;
  }

  .actionBtn {
    height: auto;
    width: auto;
    border: none;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 1px;
    box-shadow: none;
    opacity: 0.5;
    padding: 8px 24px;
    border-radius: 0;
    position: relative;
    z-index: 1;
    color: var(--text-color);
    transition: opacity 0.3s, color 0.3s, transform 0.15s;
  }

  .actionBtn.primary {
    opacity: 1;
    color: var(--primary-color);
    text-shadow: 0 0 10px var(--primary-color);
    box-shadow: none;
  }

  .productPanel {
    min-height: 0;
    max-width: 100%;
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 100%;
  }

  .card {
    min-height: 140px;
    padding: 12px 8px;
  }

  .thumb {
    width: 50px;
    height: 50px;
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
    bottom: 100px;
    right: 20px;
  }
}
</style>
