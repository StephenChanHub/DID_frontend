<template>
    <div class="do-container">
        <div class="grid-layout">

            <div class="glass-card" @click="goPreview('listening')">
                <span class="card-emoji">🎧</span>
                <span class="card-label">Listening</span>
            </div>
            <div class="glass-card" @click="goPreview('reading')">
                <span class="card-emoji">📖</span>
                <span class="card-label">Reading</span>
            </div>
            <div class="glass-card disabled-card" aria-disabled="true">
                <span class="card-emoji">✏️</span>
                <span class="card-label">Writing</span>
            </div>
            <div class="glass-card disabled-card" aria-disabled="true">
                <span class="card-emoji">🗣️</span>
                <span class="card-label">Speaking</span>
            </div>
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
    position: relative;
    overflow: hidden;
    height: 260px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--primary-color);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.glass-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1.5px;
    background: linear-gradient(120deg,
            rgba(255, 255, 255, 0) 10%,
            rgba(255, 255, 255, 0.95) 30%,
            rgba(113, 201, 255, 0.9) 45%,
            rgba(201, 144, 255, 0.9) 60%,
            rgba(255, 255, 255, 0) 85%);
    background-size: 220% 220%;
    opacity: 0;
    pointer-events: none;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    transition: opacity 0.25s ease;
}

.card-emoji {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    line-height: 1;
    transform-origin: center center;
    animation: emoji-fall-heavy 820ms linear both;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
    filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.18));
}

.glass-card:nth-child(1) .card-emoji {
    animation-delay: 0.02s;
}

.glass-card:nth-child(2) .card-emoji {
    animation-delay: 0.12s;
}

.glass-card:nth-child(3) .card-emoji {
    animation-delay: 0.22s;
}

.glass-card:nth-child(4) .card-emoji {
    animation-delay: 0.32s;
}

.card-label {
    display: block;
    font-size: 1.25rem;
    letter-spacing: 0.02em;
}

.glass-card:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

.glass-card:hover::before {
    opacity: 1;
    animation: border-flow 2.2s linear infinite;
}

.glass-card:hover .card-emoji {
    transform: translate3d(0, -2px, 0) scale(1.03);
}

.disabled-card {
    cursor: default;
}

.disabled-card:hover {
    transform: none;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.disabled-card:hover::before {
    opacity: 0;
    animation: none;
}

.disabled-card:hover .card-emoji {
    transform: none;
}

@keyframes border-flow {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 200% 50%;
    }
}

@keyframes emoji-fall-heavy {
    0% {
        opacity: 0;
        transform: translate3d(0, -260px, 0) rotate(-122deg) scale(0.88);
    }

    12% {
        opacity: 1;
        transform: translate3d(0, -248px, 0) rotate(-118deg) scale(0.89);
    }

    38% {
        transform: translate3d(0, -110px, 0) rotate(-76deg) scale(0.95);
    }

    58% {
        transform: translate3d(0, 20px, 0) rotate(12deg) scale(1.04, 0.9);
    }

    72% {
        transform: translate3d(0, -10px, 0) rotate(-5deg) scale(0.99, 1.02);
    }

    84% {
        transform: translate3d(0, 4px, 0) rotate(2deg) scale(1.01, 0.985);
    }

    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    }
}

.full-width {
    grid-column: span 2;
    height: 200px;
    margin-top: 10px;
    font-size: 1.1rem;
    opacity: 0.8;
}
</style>
