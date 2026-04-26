<template>
  <section class="bag-panel">
    <div class="grid">
      <article v-for="item in items" :key="item.id" class="card">
        <div class="thumb">{{ item.emoji }}</div>
        <div class="cardBody">
          <h3 class="title">{{ item.name }}</h3>
          <p class="desc">{{ item.desc }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
const items = [
  { id: 1, emoji: '🎒', name: 'Backpack', desc: 'Carry your essentials' },
  { id: 2, emoji: '👝', name: 'Pouch', desc: 'Small storage' },
  { id: 3, emoji: '💼', name: 'Briefcase', desc: 'Professional carry' },
  { id: 4, emoji: '🧳', name: 'Luggage', desc: 'Travel companion' },
  { id: 5, emoji: '👜', name: 'Handbag', desc: 'Everyday style' },
  { id: 6, emoji: '🎒', name: 'Daypack', desc: 'Light & compact' },
  { id: 7, emoji: '👛', name: 'Wallet', desc: 'Keep your coins' },
  { id: 8, emoji: '🧰', name: 'Toolbox', desc: 'Gear & tools' },
  { id: 9, emoji: '📦', name: 'Box', desc: 'Storage container' },
  { id: 10, emoji: '🧺', name: 'Basket', desc: 'Woven carry' },
  { id: 11, emoji: '🪣', name: 'Bucket', desc: 'Waterproof bin' },
  { id: 12, emoji: '🎁', name: 'Gift Bag', desc: 'Present wrap' },
]
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

.card:nth-child(6n) {
  border-right: none;
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
}
</style>
