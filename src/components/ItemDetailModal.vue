<template>
  <Teleport to="body">
    <div v-if="visible" class="detail-overlay" @click.self="handleCancel">
      <div class="detail-modal">
        <!-- 右上角拥有数量徽章 -->
        <div v-if="showOwnedBadge && item.quantity !== undefined" class="owned-badge">x{{ item.quantity }}</div>

        <div class="detail-emoji">{{ item.emoji || '📀' }}</div>

        <div class="name-row">
          <h2 class="detail-name">{{ item.name }}</h2>
          <span v-if="isFood && item.recovery_value" class="recovery-inline">+{{ totalRecovery }} Stamina</span>
        </div>

        <p v-if="item.description" class="detail-desc">{{ item.description }}</p>

        <!-- 总价展示 -->
        <div v-if="showTotalPrice" class="total-price-row">
          <span class="total-price-value">Costs  {{ totalPrice }}  Coins</span>
        </div>

        <div v-if="showQtySelector" class="qty-selector">
          <label class="qty-label">Quantity:</label>
          <div class="wheel-wrapper">
            <button class="wheel-btn" @click="decrementQty">−</button>
            <div class="wheel" ref="wheelRef" @scroll="onWheelScroll">
              <div
                v-for="n in maxQty"
                :key="n"
                class="wheel-item"
                :class="{ active: n === qty }"
              >{{ n }}</div>
            </div>
            <button class="wheel-btn" @click="incrementQty">+</button>
          </div>
        </div>

        <div class="detail-actions">
          <button class="action-btn cancel" @click="handleCancel">Cancel</button>
          <button
            v-if="mode === 'bag' && item.type === 'food'"
            class="action-btn primary"
            @click="handleUse"
          >Use</button>
          <button
            v-else-if="(mode === 'bag' && item.type === 'item') || (mode === 'store' && storeSubMode === 'sell')"
            class="action-btn primary"
            @click="handleSell"
          >Sell</button>
          <button
            v-else-if="mode === 'store'"
            class="action-btn primary"
            @click="handleBuy"
          >Buy</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';

interface ItemData {
  item_id?: number;
  id?: number;
  name: string;
  emoji?: string;
  type?: string;
  description?: string;
  recovery_value?: number;
  sell_price?: number;
  buy_price?: number;
  quantity?: number;
  image_url?: string;
  media_url?: string;
  _isCollection?: boolean;
}

const props = defineProps<{
  visible: boolean;
  item: ItemData;
  mode: 'bag' | 'store';
  storeSubMode?: 'buy' | 'sell';
}>();

const emit = defineEmits<{
  cancel: [];
  use: [itemId: number, quantity: number];
  sell: [itemId: number, quantity: number];
  buy: [itemId: number, quantity: number];
}>();

const qty = ref(1);
const wheelRef = ref<HTMLElement | null>(null);
const ITEM_HEIGHT = 40;

watch(() => props.visible, async (v) => {
  if (v) {
    qty.value = 1;
    await nextTick();
    scrollToQty(1);
  }
});

const scrollToQty = (value: number) => {
  if (!wheelRef.value) return;
  wheelRef.value.scrollTop = ITEM_HEIGHT * (value - 1);
};

const onWheelScroll = () => {
  if (!wheelRef.value) return;
  const idx = Math.round(wheelRef.value.scrollTop / ITEM_HEIGHT);
  qty.value = Math.max(1, Math.min(maxQty.value, idx + 1));
};

const incrementQty = () => {
  if (qty.value < maxQty.value) {
    qty.value++;
    scrollToQty(qty.value);
  }
};

const decrementQty = () => {
  if (qty.value > 1) {
    qty.value--;
    scrollToQty(qty.value);
  }
};

const showQtySelector = computed(() => {
  if (props.mode === 'bag') return true;
  if (props.mode === 'store' && props.storeSubMode === 'sell') return true;
  if (props.mode === 'store' && !props.item._isCollection) return true;
  return false;
});

const maxQty = computed(() => {
  if (props.mode === 'bag') return props.item.quantity || 1;
  if (props.mode === 'store' && props.storeSubMode === 'sell') return props.item.quantity || 1;
  return 99;
});

const isFood = computed(() => props.item.type === 'food');

const showOwnedBadge = computed(() =>
  props.mode === 'bag' || (props.mode === 'store' && props.storeSubMode === 'sell')
);

const totalRecovery = computed(() => (props.item.recovery_value || 0) * qty.value);

const showTotalPrice = computed(() => {
  // 售卖：有 sell_price 时显示总价
  if (props.mode === 'bag' && props.item.type === 'item' && props.item.sell_price) return true;
  if (props.mode === 'store' && props.storeSubMode === 'sell' && !props.item._isCollection && props.item.sell_price) return true;
  // 购买：有 buy_price 时显示总价（收藏品除外，收藏品无数量选择器）
  if (props.mode === 'store' && !props.item._isCollection && props.item.buy_price) return true;
  if (props.mode === 'store' && props.item._isCollection && props.item.buy_price) return true;
  return false;
});

const totalPrice = computed(() => {
  if (props.mode === 'store' && props.item._isCollection) return props.item.buy_price || 0;
  if (props.mode === 'store' && props.storeSubMode !== 'sell') return (props.item.buy_price || 0) * qty.value;
  return (props.item.sell_price || 0) * qty.value;
});

const itemId = () => props.item.item_id ?? props.item.id ?? 0;

const handleCancel = () => emit('cancel');
const handleUse = () => emit('use', itemId(), qty.value);
const handleSell = () => emit('sell', itemId(), qty.value);
const handleBuy = () => emit('buy', itemId(), qty.value);
</script>

<style scoped>
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(100, 100, 100, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-modal {
  position: relative;
  padding: 28px 24px;
  max-width: 360px;
  width: 90%;
  text-align: center;
  animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 右上角拥有数量徽章 */
.owned-badge {
  position: absolute;
  top: 16px;
  right: 20px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
}

.detail-emoji {
  font-size: 10rem;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.detail-name {
  color: var(--primary-color);
  margin: 0;
  font-size: 1.3rem;
}

.recovery-inline {
  font-weight: 700;
  color: #4caf50;
  font-size: 0.95rem;
}

.detail-desc {
  color: #666;
  margin: 0 0 12px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.total-price-row {
  margin-top: 20px;
}

.total-price-value {
  font-weight: 700;
  color: red;
  font-size: 1.1rem;
}

.qty-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.qty-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #ffffff;
}

.wheel-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wheel-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
  line-height: 1;
}

.wheel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.wheel-btn:active {
  background: var(--primary-color);
}

.wheel {
  height: 120px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-top: 40px;
  padding-bottom: 40px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);
}

.wheel::-webkit-scrollbar {
  display: none;
}

.wheel-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  scroll-snap-align: center;
  transition: color 0.2s, font-size 0.2s;
  cursor: pointer;
  user-select: none;
}

.wheel-item.active {
  color: var(--primary-color);
  font-size: 1.3rem;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 10px 32px;
  border-radius: 20px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn.cancel {
  background: rgba(0, 0, 0, 0.08);
  color: #ffffff;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
