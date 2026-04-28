<template>
  <section class="bag-panel">
    <div v-if="loading" class="loading-state">Loading...</div>
    <div v-else-if="filteredItems.length === 0" class="empty-state">No items here yet.</div>
    <div v-else class="grid">
      <article
        v-for="item in filteredItems"
        :key="item.item_id"
        class="card"
        @click="openDetail(item)"
      >
        <div class="thumb">{{ item.emoji }}</div>
        <div class="cardBody">
          <h3 class="title">{{ item.name }}</h3>
          <div class="meta-row">
            <span v-if="item.type === 'food' && item.recovery_value" class="tag recovery">
              +{{ item.recovery_value }} STA
            </span>
            <span v-if="item.sell_price" class="tag sell">
              {{ item.sell_price }} Coin
            </span>
          </div>
        </div>
        <span class="qty-badge">x{{ item.quantity }}</span>
      </article>
    </div>

    <ItemDetailModal
      :visible="detailVisible"
      :item="selectedItem"
      mode="bag"
      @cancel="detailVisible = false"
      @use="handleUse"
      @sell="handleSell"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import request from '@/api/request';
import { useUserStore } from '@/store/user';
import ItemDetailModal from '@/components/ItemDetailModal.vue';

const props = defineProps<{
  filter: 'all' | 'food' | 'items';
}>();

const userStore = useUserStore();

interface InventoryItem {
  item_id: number;
  quantity: number;
  name: string;
  emoji: string;
  type: string;
  description: string;
  recovery_value: number;
  sell_price: number;
}

const items = ref<InventoryItem[]>([]);
const loading = ref(false);

const filteredItems = computed(() => {
  if (props.filter === 'all') return items.value;
  const type = props.filter === 'items' ? 'item' : props.filter;
  return items.value.filter(item => item.type === type);
});

const detailVisible = ref(false);
const selectedItem = ref<InventoryItem>({
  item_id: 0,
  quantity: 0,
  name: '',
  emoji: '',
  type: 'item',
  description: '',
  recovery_value: 0,
  sell_price: 0
});

const openDetail = (item: InventoryItem) => {
  selectedItem.value = { ...item };
  detailVisible.value = true;
};

const fetchInventory = async () => {
  if (!userStore.isLoggedIn) return;
  loading.value = true;
  try {
    const res: any = await request.get('/items/inventory');
    items.value = Array.isArray(res.items) ? res.items : [];
  } catch (err) {
    console.error('Failed to fetch inventory', err);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const handleUse = async (itemId: number, quantity: number) => {
  try {
    const res: any = await request.post('/items/use', { itemId, quantity });
    userStore.updateStamina(res.stamina, res.maxStamina);
    detailVisible.value = false;
    await fetchInventory();
  } catch (err) {
    console.error('Use item failed', err);
  }
};

const handleSell = async (itemId: number, quantity: number) => {
  try {
    const res: any = await request.post('/items/sell', { itemId, quantity });
    userStore.updateCoins(res.coins);
    detailVisible.value = false;
    await fetchInventory();
  } catch (err) {
    console.error('Sell item failed', err);
  }
};

onMounted(fetchInventory);
watch(() => userStore.isLoggedIn, (v) => { if (v) fetchInventory(); });
</script>

<style scoped>
.bag-panel {
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
}

.grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.card {
  min-height: 150px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  box-sizing: border-box;
  transition: background 0.2s;
  cursor: pointer;
  position: relative;
}

.card:nth-child(6n) {
  border-right: none;
}

.card:hover {
  background: rgba(255, 255, 255, 0.3);
}

.thumb {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  font-size: 24px;
  color: var(--primary-color);
}

.title {
  margin: 0;
  font-size: 16px;
  color: black;
  font-weight: 500;
  text-align: center;
}

.meta-row {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
}

.tag.recovery {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.tag.sell {
  background: rgba(255, 152, 0, 0.15);
  color: #f90;
}

.qty-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--primary-color);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.loading-state,
.empty-state {
  padding: 40px;
  text-align: center;
  color: #606a77;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .card:nth-child(6n) {
    border-right: 1px solid rgba(255, 255, 255, 0.3);
  }

  .card:nth-child(4n) {
    border-right: none;
  }

  .card {
    min-height: 120px;
    padding: 10px 6px;
  }

  .thumb {
    width: 36px;
    height: 36px;
    font-size: 20px;
    margin-bottom: 8px;
  }

  .title {
    font-size: 13px;
  }
}
</style>
