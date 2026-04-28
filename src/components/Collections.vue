<template>
  <section class="collections-panel">
    <div v-if="loading" class="loading-state">Loading...</div>
    <div v-else-if="collections.length === 0" class="empty-state">
      No collections yet. Visit the Store to purchase some!
    </div>
    <div v-else class="grid">
      <article
        v-for="item in collections"
        :key="item.collection_id"
        class="card"
        @click="openMedia(item)"
      >
        <div class="thumb">
          <img
            v-if="item.image_url"
            :src="buildFileUrl(item.image_url) || undefined"
            :alt="item.name"
            class="thumb-img"
          />
          <span v-else class="thumb-placeholder">📀</span>
        </div>
        <div class="cardBody">
          <h3 class="title">{{ item.name }}</h3>
          <span class="category-tag">{{ item.category }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import request from '@/api/request';
import { useUserStore } from '@/store/user';
import { buildFileUrl } from '@/config/env';

const userStore = useUserStore();

interface CollectionItem {
  collection_id: number;
  purchased_at: string;
  name: string;
  category: string;
  image_url: string;
  media_url: string;
  description: string;
}

const collections = ref<CollectionItem[]>([]);
const loading = ref(false);

const fetchCollections = async () => {
  if (!userStore.isLoggedIn) return;
  loading.value = true;
  try {
    const res: any = await request.get('/collections/mine');
    collections.value = Array.isArray(res.collections) ? res.collections : [];
  } catch (err) {
    console.error('Failed to fetch collections', err);
    collections.value = [];
  } finally {
    loading.value = false;
  }
};

const openMedia = (item: CollectionItem) => {
  if (item.media_url) {
    const url = buildFileUrl(item.media_url);
    if (url) window.open(url, '_blank');
  }
};

onMounted(fetchCollections);
watch(() => userStore.isLoggedIn, (v) => { if (v) fetchCollections(); });
</script>

<style scoped>
.collections-panel {
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.card:nth-child(4n) {
  border-right: none;
}

.card:hover {
  background: rgba(255, 255, 255, 0.3);
}

.thumb {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.3);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 28px;
}

.title {
  margin: 0;
  font-size: 16px;
  color: black;
  font-weight: 500;
  text-align: center;
}

.category-tag {
  margin-top: 6px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.12);
  color: var(--primary-color);
  font-weight: 600;
  text-transform: capitalize;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card:nth-child(4n) {
    border-right: 1px solid rgba(255, 255, 255, 0.3);
  }

  .card:nth-child(2n) {
    border-right: none;
  }

  .card {
    min-height: 140px;
    padding: 12px 8px;
  }

  .thumb {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }

  .title {
    font-size: 14px;
  }
}
</style>
