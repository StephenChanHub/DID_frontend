<template>
    <div class="do-container">
        <div class="grid-layout">
            
            <div class="glass-card" @click="goPreview('listening')">🎧<br>Listening</div>
            <div class="glass-card" @click="goPreview('reading')">📖<br>Reading</div>
            <div class="glass-card" @click="goPreview('writing')">✏️<br>Writing</div>
            <div class="glass-card" @click="goPreview('speaking')">🗣️<br>Speaking</div>
            <div class="glass-card full-width">💯<br>Testing</div>
            <div class="glass-card full-width"><br>Relaxing</div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const goPreview = (type) => {
    router.push({ path: '/preview', query: { type } });
};
</script>

<style scoped>
.do-container {
    padding: 20px;
}

.grid-layout {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
}

.glass-card {
    height: 260px;
    /* 统一悬浮玻璃卡片 */
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--primary-color);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.glass-card:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}


.full-width {
    grid-column: span 2;
    height: 200px;
    margin-top: 10px;
    font-size: 1.1rem;
    opacity: 0.8;
}
</style>