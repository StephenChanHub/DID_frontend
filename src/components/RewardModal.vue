<template>
  <Teleport to="body">
    <div v-if="visible" class="reward-overlay" @click.self="handleClose">
      <div class="reward-modal">
        <h2 class="reward-title">{{ isPassed ? '🎉 Congratulations!' : 'Keep Trying!' }}</h2>
        <p class="reward-score">
          Score: {{ correctCount }}/{{ totalQuestions }}
          <span v-if="isPassed"> (Passed!)</span>
          <span v-else> (Need ≥60%)</span>
        </p>
        <div v-if="isPassed && drops.length > 0" class="drops-section">
          <p class="drops-label">You obtained:</p>
          <div class="drops-list">
            <div v-for="(drop, i) in drops" :key="i" class="drop-item">
              <span v-if="drop.emoji" class="drop-emoji">{{ drop.emoji }}</span>
              <span v-else class="drop-icon">📀</span>
              <span class="drop-name">{{ drop.name }}</span>
              <span v-if="drop.quantity > 1" class="drop-qty">x{{ drop.quantity }}</span>
            </div>
          </div>
        </div>
        <p v-else-if="isPassed" class="drops-empty">Passed but no items dropped. Better luck next time!</p>
        <p v-if="!isPassed" class="drops-empty">Correct rate too low, no rewards this time.</p>
        <button class="confirm-btn" @click="handleClose">Confirm</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';

interface Drop {
  rewardType: string;
  rewardId: number;
  name: string;
  emoji?: string;
  quantity: number;
}

const props = defineProps<{
  visible: boolean;
  isPassed: boolean;
  correctCount: number;
  totalQuestions: number;
  drops: Drop[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.reward-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
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

.reward-modal {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px 28px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.reward-title {
  margin: 0 0 8px;
  font-size: 1.5rem;
}

.reward-score {
  color: #555;
  margin: 0 0 16px;
}

.drops-section {
  margin: 16px 0;
}

.drops-label {
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.drops-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.drop-item {
  background: rgba(var(--primary-color-rgb, 74, 144, 226), 0.1);
  border: 1px solid rgba(var(--primary-color-rgb, 74, 144, 226), 0.2);
  border-radius: 12px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
}

.drop-emoji,
.drop-icon {
  font-size: 1.3rem;
}

.drop-name {
  font-weight: 600;
  color: #333;
}

.drop-qty {
  color: var(--primary-color);
  font-weight: 700;
}

.drops-empty {
  color: #888;
  margin: 16px 0;
}

.confirm-btn {
  margin-top: 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 48px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
}
</style>
