<template>
    <!-- 背景虚化遮罩层 -->
    <div v-if="isDropdownOpen" class="dropdown-backdrop" @click="closeDropdown"></div>

    <!-- 右上角悬浮容器（带下拉菜单） -->
    <div class="floating-container" :class="{ active: isDropdownOpen }" @click.stop="isDropdownOpen = !isDropdownOpen">
        <div class="floating-content">
            {{ typeName }}
            <span class="dropdown-arrow">▼</span>
        </div>

        <!-- 下拉菜单 -->
        <div v-if="isDropdownOpen" class="dropdown-menu">
            <div v-for="item in trainingTypes" :key="item.value" class="dropdown-item"
                :class="{ active: type === item.value }" @click.stop="switchTrainingType(item.value)">
                {{ item.label }}
            </div>
        </div>
    </div>

    <!-- <header class="page-header">
        <span class="count-tag">Items: {{ materials.length }} </span>
    </header> -->
    <div class="preview-page">
        <aside class="level-sidebar">
            <div v-for="(lv, index) in levels" :key="lv" :class="['level-item', { active: currentLevel === lv }]"
                :style="{ '--stack-delay': `${(levels.length - 1 - index) * 0.08}s` }" @click="changeLevel(lv)">
                {{ lv }}
            </div>
        </aside>

        <section class="content-area">


            <div class="material-grid">
                <div v-for="item in materials" :key="item.id" class="material-card" @click="goToDetail(item.id)">
                    <div class="card-content">
                        <h3>{{ item.title }}</h3>
                        <p class="summary">
                            {{ item.title }} 的相关练习内容，点击进入详细学习界面进行深度训练。
                        </p>
                    </div>
                    <div class="card-footer">
                        <span class="type-badge">{{ item.level }}</span>
                        <span class="date">{{ formatDate(item.created_at) }}</span>
                    </div>
                </div>

                <div v-if="materials.length === 0" class="empty-state">
                    There is nothing here yet. Please check back later or try another level/type.
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '@/api/request';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const currentLevel = ref('B1'); // 默认展示 B1
const materials = ref<any[]>([]);
const loginTimer = ref<ReturnType<typeof setTimeout> | null>(null);

// 获取当前训练类型 (reading/listening 等)
const type = computed(() => route.query.type as string || 'reading');
const typeName = computed(() => {
    const map: any = { reading: 'Reading', listening: 'Listening', writing: 'Writing', speaking: 'Speaking' };
    return map[type.value] || '练习';
});

// 下拉菜单状态
const isDropdownOpen = ref(false);

// 所有可用的训练类型
const trainingTypes = [
    { value: 'reading', label: 'Reading' },
    { value: 'listening', label: 'Listening' },
    { value: 'writing', label: 'Writing' },
    { value: 'speaking', label: 'Speaking' }
];

// 切换训练类型
const switchTrainingType = (typeValue: string) => {
    router.push({ query: { ...route.query, type: typeValue } });
    isDropdownOpen.value = false;
};

// 关闭下拉菜单（点击外部）
const closeDropdown = () => {
    isDropdownOpen.value = false;
};

// 拉取列表数据
const fetchList = async () => {
    try {
        const res: any = await request.get('/materials', {
            params: { type: type.value, level: currentLevel.value }
        });
        materials.value = res;
    } catch (err) {
        console.error('获取列表失败');
    }
};

const changeLevel = (lv: string) => {
    currentLevel.value = lv;
    fetchList();
};

const goToDetail = (id: number) => {
    router.push(`/practice/${id}`);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
};

onMounted(() => {
    // 始终获取真实数据
    fetchList();

    // 如果未登录，设置10秒后显示登录模态框
    if (!userStore.isLoggedIn) {
        loginTimer.value = setTimeout(() => {
            if (!userStore.isLoggedIn) {
                userStore.showAuthModal = true;
            }
        }, 10000);
    }
});

// 清理定时器
onUnmounted(() => {
    if (loginTimer.value) {
        clearTimeout(loginTimer.value);
        loginTimer.value = null;
    }
});

// 监听路由参数变化（如从阅读切到听力）
watch(() => route.query.type, () => {
    fetchList();
});

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (isLoggedIn) => {
    if (isLoggedIn) {
        // 用户刚登录：获取真实数据
        fetchList();
    } else {
        // 用户退出登录：清空数据
        materials.value = [];
    }
});

</script>

<style scoped>
.preview-page {
    display: flex;
    justify-content: center;
    min-height: 80vh;
    width: 100%;
    padding: 0 50px;
}

/* 右侧悬浮导航栏 */
.level-sidebar {
    position: fixed;
    right: 10px;
    top: 50%;
    transform: translateY(-30%);
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 100;
}

.level-item {
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease, transform 0.25s ease;
    color: #555;
    opacity: 0;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translate3d(0, -140px, 0) rotate(-10deg) scale(0.94);
    animation: level-stack-drop 760ms linear both;
    animation-delay: var(--stack-delay, 0s);
}

.level-item.active {
    background: var(--primary-color);
    color: #fff;
    border-color: #fff;
    transform: scale(1.1);
}

.level-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
}

@keyframes level-stack-drop {
    0% {
        opacity: 0;
        transform: translate3d(0, -220px, 0) rotate(-12deg) scale(0.9);
    }

    12% {
        opacity: 1;
        transform: translate3d(0, -205px, 0) rotate(-11deg) scale(0.91);
    }

    42% {
        transform: translate3d(0, -88px, 0) rotate(-7deg) scale(0.96);
    }

    62% {
        transform: translate3d(0, 12px, 0) rotate(3deg) scale(1.02, 0.95);
    }

    76% {
        transform: translate3d(0, -6px, 0) rotate(-1.5deg) scale(0.995, 1.01);
    }

    88% {
        transform: translate3d(0, 2px, 0) rotate(0.8deg) scale(1.002, 0.998);
    }

    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    }
}

/* 主内容区 */
.content-area {
    width: 100%;
    padding-bottom: 40px;

}

/* .page-header {
    display: flex;
    align-items: baseline;
    gap: 15px;
    margin-bottom: 30px;
} */

/* .count-tag {
    margin-left: 80%;
    font-size: 20PX;
    color: #000;
} */

/* 自适应题目预览网格 */
.material-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 25px;
}

.material-card {
    width: 100%;
    height: 200px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
}

.material-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.material-card h3 {
    margin: 0 0 10px 0;
    font-size: 1.2rem;
    color: #2c3e50;
    /* 标题超过两行省略 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.summary {
    font-size: 0.9rem;
    color: #666;
    line-height: 1.5;
    /* 内容超过三行省略 */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    border: 0.5px solid rgba(255, 255, 255, 0.4);
    box-shadow:
        0 18px 46px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.4); */
}

.type-badge {
    font-size: 0.75rem;
    padding: 3px 10px;
    background: rgba(66, 185, 131, 0.1);
    color: #42b983;
    border-radius: 8px;
    font-weight: bold;
}

.date {
    font-size: 0.8rem;
    color: #999;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px;
    color: #999;
    font-style: italic;
}

/* 右上角悬浮容器 */
.floating-container {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 80px;
    height: 60px;
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    border: 0.5px solid rgba(255, 255, 255, 0.4);
    box-shadow:
        0 18px 46px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
    transition: 0.3s;
}

.floating-container.active {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, 0.4);
}

.floating-content {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 8px;
}

.dropdown-arrow {
    font-size: 10px;
    transition: transform 0.3s;
}

.floating-container.active .dropdown-arrow {
    transform: rotate(180deg);
}

/* 下拉菜单 */
.dropdown-menu {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    min-width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 0.5px solid rgba(255, 255, 255, 0.6);
    box-shadow:
        0 20px 50px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 8px 0;
    z-index: 1002;
    animation: dropdownFadeIn 0.2s ease-out;
}

@keyframes dropdownFadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 下拉选项 */
.dropdown-item {
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.dropdown-item:hover {
    background: rgba(0, 0, 0, 0.05);
}

.dropdown-item.active {
    color: var(--primary-color);
    font-weight: 600;
    /* background: rgba(var(--primary-color-rgb, 245, 86, 155), 0.1); */
}

/* 背景虚化遮罩层 */
.dropdown-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 1000;
    animation: backdropFadeIn 0.2s ease-out;
}

@keyframes backdropFadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* 大屏幕（电脑全屏） */
@media (min-width: 2000px) {
    .material-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .empty-state {
        grid-column: 1 / -1;
    }
}

/* 适配移动端 */
@media (max-width: 600px) {
    .material-grid {
        grid-template-columns: 1fr;
    }

    .preview-page {
        padding: 0 20px;
    }

    .floating-container {
        top: 15px;
        right: 15px;
        min-width: 70px;
        height: 50px;
        padding: 0 15px;
        border-radius: 14px;
    }

    .floating-content {
        font-size: 15px;
    }

    .dropdown-menu {
        min-width: 100%;
        border-radius: 10px;
    }

    .dropdown-item {
        padding: 8px 14px;
        font-size: 12px;
    }
}
</style>
