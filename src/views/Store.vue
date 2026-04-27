<template>
  <div class="page">
    <div class="shell">
      <header class="topbar">
        <div class="Wrap">
          <img class="Salesperson" :src="`/public/Salesperson0${salesperson}.png`" alt="salesperson" />
          <span class="Text">{{ mode === 'buy' ? 'Welcome to the DID Store! What do you need?' : 'Welcome to the DID Store! What do you want to sell?' }}</span>
        </div>

        <div class="actionGroup">
          <button class="actionBtn" :class="{ primary: mode === 'buy' }" @click="mode = 'buy'">buy</button>
          <button class="actionBtn" :class="{ primary: mode === 'sell' }" @click="mode = 'sell'">sell</button>
        </div>
      </header>

      <main class="content">
        <aside class="sidebar">
          <button
            v-for="item in categories"
            :key="item"
            class="categoryBtn"
            :class="{ active: selectedCategory === item }"
            @click="selectedCategory = item"
          >
            {{ item }}
          </button>
        </aside>

        <section class="productPanel">
          <div class="grid">
            <article v-for="item in filteredProducts" :key="item.id" class="card">
              <div class="thumb">{{ item.emoji }}</div>
              <div class="cardBody">
                <h3 class="title">{{ item.name }}</h3>
                <p class="desc">{{ item.desc }}</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <button class="backBtn" @click="goBack">← back</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const goBack = () => router.back()

onMounted(() => {
  if (!userStore.isLoggedIn) {
    userStore.showAuthModal = true
  }
})

const salesperson = ref(Math.floor(Math.random() * 3) + 1)
const mode = ref('buy')
const selectedCategory = ref('food')

const categories = ['food', 'collections']

const products = ref([
  { id: 2, category: 'collections', emoji: '🎒', name: 'Backpack', desc: 'Carry your essentials' },
   { id: 1, category: 'food', emoji: '🍎', name: 'Apple', desc: 'Fresh and sweet' },
  { id: 2, category: 'food', emoji: '👝', name: 'Pouch', desc: 'Small storage' },
  { id: 3, category: 'food', emoji: '💼', name: 'Briefcase', desc: 'Professional carry' },
  { id: 4, category: 'food', emoji: '🧳', name: 'Luggage', desc: 'Travel companion' },
  { id: 5, category: 'food', emoji: '👜', name: 'Handbag', desc: 'Everyday style' },
  { id: 6, category: 'food', emoji: '🎒', name: 'Daypack', desc: 'Light & compact' },
  { id: 7, category: 'food', emoji: '👛', name: 'Wallet', desc: 'Keep your coins' },
  { id: 8, category: 'food', emoji: '🧰', name: 'Toolbox', desc: 'Gear & tools' },
  { id: 9, category: 'food', emoji: '📦', name: 'Box', desc: 'Storage container' },
  { id: 10, category: 'food', emoji: '🧺', name: 'Basket', desc: 'Woven carry' },
  { id: 11, category: 'food', emoji: '🪣', name: 'Bucket', desc:'Waterproof bin' },
])

const filteredProducts = computed(() => {
  return products.value.filter((item) => item.category === selectedCategory.value)
})
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
}

.card:hover {
  background: rgba(255, 255, 255, 0.3);
}

.thumb {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 26px;
  color: var(--primary-color);
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
    min-height: 56px;
    font-size: 20px;
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
