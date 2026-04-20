<template>
  <div class="practice-wrapper">
    <div class="main-scroller" ref="scroller">
      <div v-for="(item, index) in practiceList" :key="item.id" class="practice-slide" :data-material-id="item.id">
        <div class="practice-card">
          <button
            class="favorite-btn"
            :class="{ 'active': favoriteCards[item.id] }"
            @click="toggleFavorite(item.id)"
            :title="favoriteCards[item.id] ? '已收藏' : '收藏'"
          >
            {{ favoriteCards[item.id] ? '★' : '☆' }}
          </button>
          <div class="media-container">
            <div class="image-box" v-if="item.image_url">
              <img :src="item.image_url" alt="material image" />
            </div>
            <div class="player" v-if="item.audio_url">
              <Player :src="item.audio_url" :active="activeCards[item.id]" />
            </div>
          </div>

          <div class="content-section">
            <h1 class="title">{{ item.title }}</h1>
            <div class="article-body">{{ item.content }}</div>
          </div>

          <div class="questions-section">
            <div v-for="(q, qIdx) in item.questions" :key="q.id" class="question-item">
              <p class="q-stem">
                <span class="q-no">{{ Number(qIdx) + 1 }}.</span> {{ q.stem }}
              </p>

              <div v-if="q.q_type === 'choice'" class="options-grid">
                <button
                  v-for="opt in q.options"
                  :key="opt"
                  :class="[
                    'opt-btn',
                    { active: userAnswers[q.id] === opt.charAt(0) },
                    getOptionClass(q, opt)
                  ]"
                  @click="!showResult && (userAnswers[q.id] = opt.charAt(0))"
                  :disabled="showResult"
                >
                  {{ opt }}
                </button>
              </div>

              <div v-else-if="q.q_type === 'bool'" class="options-grid binary">
                <button
                  :class="['opt-btn', { active: userAnswers[q.id] === 'T' }, getOptionClass(q, 'T')]"
                  @click="!showResult && (userAnswers[q.id] = 'T')"
                  :disabled="showResult"
                >T</button>
                <button
                  :class="['opt-btn', { active: userAnswers[q.id] === 'F' }, getOptionClass(q, 'F')]"
                  @click="!showResult && (userAnswers[q.id] = 'F')"
                  :disabled="showResult"
                >F</button>
              </div>

              <div v-else-if="q.q_type === 'fill'" class="fill-input-wrapper">
                <input
                  v-model="userAnswers[q.id]"
                  type="text"
                  placeholder="Input your answer here..."
                  class="fill-input"
                  :disabled="showResult"
                />
                <div v-if="showResult && answerResults[q.id]" class="fill-correct-answer">
                  正确答案: {{ getCorrectAnswer(q) }}
                </div>
              </div>

              <div v-if="showResult" class="feedback-tag" :class="isAnswerCorrect(q) ? 'correct' : 'wrong'">
                <div v-if="isAnswerCorrect(q)" class="feedback-content">
                  ✓ 正确！你的答案: {{ formatAnswerDisplay(q, userAnswers[q.id]) }}
                </div>
                <div v-else class="feedback-content">
                  ✗ 错误！正确答案: {{ formatAnswerDisplay(q, getCorrectAnswer(q)) }}，你的答案: {{ formatAnswerDisplay(q, userAnswers[q.id]) }}
                </div>
              </div>
            </div>
          </div>

          <div class="action-footer">
            <button class="btn-clear" @click="clearAnswers">Clear</button>
            <button class="btn-submit" @click="handleSubmit(item.id)">Submit</button>
          </div>
        </div>
      </div>
    </div>

    <aside class="side-controls">
      <div class="nav-btns">
        <button @click="scrollPrev" class="side-btn">▲</button>
        <button @click="scrollNext" class="side-btn">▼</button>
      </div>
      <button @click="goBack" class="side-btn back-btn">↩</button>
      <button @click="refresh" class="side-btn refresh-btn">🔄</button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import request from '@/api/request';
import Player from '@/components/Player.vue';
const router = useRouter();
const route = useRoute();
const scroller = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

const practiceList = ref<any[]>([]); // 练习素材列表
const userAnswers = reactive<Record<number, string>>({}); // 存储用户填写的答案
const activeCards = reactive<Record<number, boolean>>({}); // 存储卡片激活状态（是否在视口中）
const showResult = ref(false);
const favoriteCards = reactive<Record<number, boolean>>({}); // 存储收藏状态
const answerResults = ref<Record<number, any>>({}); // 存储提交后的答案结果（来自后端）

// 构建完整的文件URL
const buildFileUrl = (url: string | null | undefined) => {
  if (!url) return null;

  // 如果已经是完整的URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是相对路径（以/开头），添加服务器基础URL
  // 根据接口文档，开发环境基础URL为：http://192.168.64.2:3000
  const baseUrl = 'http://192.168.64.2:3000';
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
};

// 获取素材详情
const fetchMaterial = async () => {
  const id = route.params.id;
  try {
    const res: any = await request.get(`/materials/${id}`);
    console.log('[fetchMaterial] API响应:', res);
    console.log('[fetchMaterial] 素材媒体信息:', {
      image_url: res?.image_url,
      media_url: res?.media_url,
      has_image: !!res?.image_url,
      has_media: !!res?.media_url
    });
    console.log('[fetchMaterial] 问题数据:', res?.questions);
    if (res?.questions) {
      res.questions.forEach((q: any, idx: number) => {
        console.log(`[fetchMaterial] 问题${idx}:`, {
          id: q.id,
          q_type: q.q_type,
          std_answer: q.std_answer,
          has_std_answer: 'std_answer' in q,
          keys: Object.keys(q)
        });
      });
    }

    // 构建完整的文件URL
    if (res) {
      res.image_url = buildFileUrl(res.image_url);
      res.media_url = buildFileUrl(res.media_url);

      // 映射字段名以兼容模板
      // 模板使用 audio_url，API返回 media_url
      res.audio_url = res.media_url;
    }

    practiceList.value = [res]; // 这里为了 TikTok 效果通常是列表，目前先处理单篇
  } catch (err) {
    console.error("Fetch failed", err);
  }
};

// 提交逻辑
const handleSubmit = async (materialId: number) => {
  const payload = {
    materialId,
    answers: Object.entries(userAnswers).map(([qId, val]) => ({ qId: Number(qId), val }))
  };

  try {
    const res: any = await request.post('/practice/submit', payload);
    showResult.value = true;
    alert(res.message);

    // 保存答案结果，用于显示反馈
    if (res.answerDetails) {
      res.answerDetails.forEach((detail: any) => {
        answerResults.value[detail.qId] = detail;
      });
      console.log('[handleSubmit] answerResults:', answerResults.value);
    }
  } catch (err) {
    console.error('提交失败', err);
  }
};

// 判分辅助函数
const checkAnswer = (q: any) => {
  const userAnswer = userAnswers[q.id];
  const stdAnswer = q.std_answer;

  // 详细调试信息
  console.log(`[checkAnswer] 调试信息:`, {
    questionId: q.id,
    questionIdType: typeof q.id,
    userAnswer,
    userAnswerType: typeof userAnswer,
    stdAnswer,
    stdAnswerType: typeof stdAnswer,
    q_type: q.q_type,
    hasStdAnswer: 'std_answer' in q,
    questionKeys: Object.keys(q),
    userAnswersKeys: Object.keys(userAnswers)
  });

  if (!userAnswer) return false;

  // 检查std_answer是否存在
  if (stdAnswer === undefined || stdAnswer === null) {
    console.error(`[checkAnswer] 错误: 问题${q.id}的std_answer为${stdAnswer}`);
    return false;
  }

  // 根据题型进行不同的标准化
  if (q.q_type === 'choice' || q.q_type === 'bool') {
    // 选择题和判断题：统一大写比较
    const normalizedUser = String(userAnswer).trim().toUpperCase();
    const normalizedStd = String(stdAnswer).trim().toUpperCase();
    console.log(`[checkAnswer] 比较结果: "${normalizedUser}" === "${normalizedStd}" => ${normalizedUser === normalizedStd}`);
    return normalizedUser === normalizedStd;
  } else if (q.q_type === 'fill') {
    // 填空题：仅去除首尾空格，保留大小写
    const normalizedUser = String(userAnswer).trim();
    const normalizedStd = String(stdAnswer).trim();
    console.log(`[checkAnswer] 比较结果: "${normalizedUser}" === "${normalizedStd}" => ${normalizedUser === normalizedStd}`);
    return normalizedUser === normalizedStd;
  }

  console.log(`[checkAnswer] 未知题型: ${q.q_type}`);
  return false;
};

// 格式化答案显示
const formatAnswerDisplay = (q: any, answer: string) => {
  if (!answer) return "未作答";

  const normalized = String(answer).trim().toUpperCase();

  if (q.q_type === 'choice') {
    // 选择题：查找对应的选项文本
    const option = q.options?.find((opt: string) =>
      opt.charAt(0).toUpperCase() === normalized
    );
    return option || `选项 ${normalized}`;
  } else if (q.q_type === 'bool') {
    // 判断题：显示完整文本
    return normalized === 'T' ? '正确 (T)' : '错误 (F)';
  } else {
    // 填空题：直接显示
    return answer;
  }
};

// 获取正确答案（优先从后端返回的结果中获取）
const getCorrectAnswer = (q: any) => {
  if (answerResults.value[q.id]) {
    return answerResults.value[q.id].correctAnswer;
  }
  return q.std_answer;
};

// 检查答案是否正确（优先从后端返回的结果中获取）
const isAnswerCorrect = (q: any) => {
  if (answerResults.value[q.id]) {
    return answerResults.value[q.id].isCorrect;
  }

  // 如果没有后端结果，使用前端逻辑
  return checkAnswer(q);
};

// 获取选项的CSS类（用于选择题/判断题的反馈样式）
const getOptionClass = (q: any, option: string) => {
  if (!showResult.value || !answerResults.value[q.id]) {
    return '';
  }

  const result = answerResults.value[q.id];
  const optionLetter = option.charAt(0).toUpperCase();
  const userAnswer = result.userAnswer?.toUpperCase();
  const correctAnswer = result.correctAnswer?.toUpperCase();

  // 如果是正确选项
  if (optionLetter === correctAnswer) {
    return 'option-correct';
  }

  // 如果是用户选择的错误选项
  if (result.isCorrect === false && optionLetter === userAnswer) {
    return 'option-wrong';
  }

  return '';
};

// 切换收藏状态
const toggleFavorite = (materialId: number) => {
  favoriteCards[materialId] = !favoriteCards[materialId];
  // 这里可以添加API调用，将收藏状态保存到后端
  request.post('/practice/favorite', { materialId, favorite: favoriteCards[materialId] });
};

const clearAnswers = () => {
  Object.keys(userAnswers).forEach(key => delete userAnswers[Number(key)]);
  answerResults.value = {};
  showResult.value = false;
};

// TikTok 式滚动控制
const scrollNext = () => {
  scroller.value?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
};
const scrollPrev = () => {
  scroller.value?.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
};

const goBack = () => router.back();

const refresh = async () => {
  console.log('Refresh triggered', {
    practiceListCount: practiceList.value.length,
    isWeb: window.innerWidth > 1000
  });
  // 清除现有答案和结果
  clearAnswers();
  // 重新获取数据
  await fetchMaterial();
  console.log('Data fetched', { count: practiceList.value.length });
  // 随机排序（打乱顺序）
  practiceList.value = practiceList.value.slice().sort(() => Math.random() - 0.5);
  console.log('After shuffle', { firstId: practiceList.value[0]?.id });
  // 清空 activeCards（重置激活状态）
  Object.keys(activeCards).forEach(key => delete activeCards[Number(key)]);
  // 为新卡片设置激活状态为 false
  practiceList.value.forEach(item => {
    activeCards[item.id] = false;
    // 收藏状态保持不变（favoriteCards[item.id] 已存在则保留）
  });
  // 等待 DOM 更新
  await nextTick();
  // 滚动到顶部
  if (scroller.value) {
    console.log('Scrolling to top');
    scroller.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // 重新初始化观察器
  initIntersectionObserver();
  console.log('Refresh completed');
};

// 初始化 Intersection Observer
const initIntersectionObserver = () => {
  if (!scroller.value) return;

  // 清理现有的 observer
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }

  // 配置选项：当卡片至少有 50% 在视口中时认为是激活的
  const options = {
    root: scroller.value,
    rootMargin: '0px',
    threshold: 0.5 // 50% 在视口中
  };

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const cardElement = entry.target;
      const materialId = parseInt(cardElement.getAttribute('data-material-id') || '0');

      if (materialId) {
        activeCards[materialId] = entry.isIntersecting;
      }
    });
  }, options);

  // 为每个卡片添加观察
  const cards = scroller.value?.querySelectorAll('.practice-slide');
  cards?.forEach(card => {
    const materialId = parseInt(card.getAttribute('data-material-id') || '0');
    if (materialId && intersectionObserver) {
      intersectionObserver.observe(card);
    }
  });
};

// 在获取数据后初始化 observer
const initAfterFetch = async () => {
  await fetchMaterial();

  // 初始化 activeCards 状态，默认为 false
  practiceList.value.forEach(item => {
    activeCards[item.id] = false;
    // 仅当收藏状态不存在时初始化为 false（保留已有的收藏状态）
    if (favoriteCards[item.id] === undefined) {
      favoriteCards[item.id] = false;
    }
  });

  // 等待 DOM 更新后初始化 observer
  nextTick(() => {
    initIntersectionObserver();
  });
};

onMounted(() => {
  initAfterFetch();
});

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
});
</script>

<style scoped>
.practice-wrapper {
  display: flex;
  height: 100vh; /* 全屏高度 */
  width: 100%;
  gap: 0;
  position: relative;
  padding: 10px;
  box-sizing: border-box;
}

/* TikTok 滚动核心 */
.main-scroller {
  flex: 0 0 100%; /* 占满宽度，右侧按钮悬浮其上 */
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory; /* 开启捕捉 */
  border-radius: 30px;
  scrollbar-width: none; /* 隐藏滚动条 */
}
.main-scroller::-webkit-scrollbar { display: none; }

.practice-slide {
  height: 100%;
  width: 100%;
  scroll-snap-align: start; /* 每次滚动停在卡片开头 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.practice-card {
  width: 90vw;
  height: 80vh;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 5px 10px 5px rgba(0, 0, 0, 0.2);
  border-radius: 36px;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative; /* 为收藏按钮提供相对定位上下文 */
}
.practice-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* 收藏按钮 */
.favorite-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 0.5px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--primary-color); /* 使用主题主色调 */
  z-index: 10;
}

.favorite-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
}

.favorite-btn.active {
  color: var(--primary-color);
  filter: brightness(1.2); /* 激活状态更亮 */
  text-shadow: 0 0 8px var(--primary-color);
}

/* Media 容器 */
.media-container {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0px 15px 30px rgba(0, 0, 0, 0.2);
    border: #e9e9e9 solid 1px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  max-height: 50vh; /* 最大高度为视口的40% */
  min-height: 400px; /* 最小高度保证可见性 */
  aspect-ratio: 4/3; /* 保持 4:3 的宽高比 */
  margin: -10px auto;
  gap: 0;
  border-radius: 30px;
  overflow: hidden;
}

/* Image 模块 */
.image-box {
  width: 100%;
  flex: 7 0 0%; /* 占 7 份，不收缩，基础尺寸为0% */
  border-radius: 30px 30px 0 0;
  overflow: hidden;
  background: rgba(0,0,0,0.05);
}
.image-box img { width: 100%; height: 100%; object-fit: cover; }

.title { font-size: 2rem; color: #000; text-align: center; }
.article-body { line-height: 1.8; font-size: 1.1rem; white-space: pre-wrap; opacity: 0.9; }


.player {
  width: 100%;
  flex: 3 0 0%; /* 占 3 份，不收缩，基础尺寸为0% */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1); /* 添加轻微背景让播放器更可见 */
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 0 0 30px 30px;
}


.content-section { margin-top: 20px;}


/* 题目样式 */
.question-item {
  background: rgba(255,255,255,0.3);
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 20px;
  color: var(--primary-color);
}
.q-stem { font-weight: 600; margin-bottom: 15px; }
.q-no { color: var(--primary-color); margin-right: 8px; }

.options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.options-grid.binary { grid-template-columns: 1fr 1fr; }


.opt-btn {
  padding: 3vh;
  border: 1px solid var(--glass-border);
  background: rgba(255,255,255,0.5);
  border-radius: 30px;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 5px 10px 10px rgba(0, 0, 0, 0.1);
  
}

.opt-btn.active {
    transform: translateY(-5px);
    box-shadow: 5px 10px 10px rgba(0, 0, 0, 0.5);
    background: black;
    color: #fff;
    border-color: var(--primary-color);
}

/* 正确答案样式 */
.opt-btn.option-correct {
    background: #42b983 !important;
    color: white !important;
    border-color: #42b983 !important;
}

/* 用户选择的错误选项样式 */
.opt-btn.option-wrong {
    background: #ff4d4f !important;
    color: white !important;
    border-color: #ff4d4f !important;
}

.fill-input {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-bottom: 2px solid var(--glass-border);
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  outline: none;
  font-size: 1rem;
}
.fill-input:focus {
  border-bottom-color: var(--primary-color);
}

/* 填空题正确答案显示 */
.fill-correct-answer {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: rgba(66, 185, 131, 0.1);
  color: #42b983;
  border-left: 3px solid #42b983;
  border-radius: 6px;
  font-size: 0.9rem;
}

.feedback-tag {
  margin-top: 15px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
}
.feedback-tag.correct {
  color: #42b983;
  background-color: rgba(66, 185, 131, 0.1);
  border-left: 4px solid #42b983;
}
.feedback-tag.wrong {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
  border-left: 4px solid #ff4d4f;
}
.feedback-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 底部按钮 */
.action-footer { 
    height: 5vh;
    
display: flex; gap: 15px; margin-top: auto; }
.btn-clear, .btn-submit {
  flex: 1; padding: 15px; border: none; border-radius: 15px; cursor: pointer; font-weight: bold;
}
.btn-clear { background: rgba(0,0,0,0.05); }
.btn-submit { background: var(--primary-color); color: #fff; box-shadow: 0 8px 20px var(--shadow-color); }


.side-controls {
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-10%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}
.side-btn {
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
  transition: all 0.3s;
  color: #555;
  font-size: 1.2rem;
}
.side-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}
.nav-btns { display: flex; flex-direction: column; gap: 10px; }
.back-btn {
  background: rgba(255, 255, 255, 0.3);
  color: #555;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 适配移动端 */
@media (max-width: 1000px) {
  .practice-wrapper {
    padding: 10px;
    gap: 0;
  }

  .main-scroller {
    flex: 0 0 100%; /* 移动端占满宽度 */
  }

  .practice-card {
    height: 650px; /* 移动端适当减小高度 */
    padding: 10px 0px;
    border-radius: 36px;
    padding: 10px 10px;
  }

  .media-container {
    max-height: 30vh; /* 移动端最大高度为视口的30% */
    min-height: 300px; /* 移动端最小高度 */
    aspect-ratio: 4/3; /* 保持 4:3 的宽高比 */
    max-width: 100%;
    padding: 0px 2px;
    margin: 0 auto;
    
  }

  .image-box {
    width: 100%;
    /* height 由 flex 属性控制 */
  }

  .title {
    font-size: 1.5rem;
  }

  .article-body {
    font-size: 1rem;
    color: #000;
  }

 
  .opt-btn {
    color: #000;
  }

  

  /* 聚焦时效果（可选） */
.fill-input:focus {
  border-bottom-color: var(--primary-color);
  box-shadow: none;
}

  .practice-slide {
    align-items: flex-start; /* 移动端卡片顶部对齐 */
    padding-top: 20px;
  }

  .side-controls {
    right: 10px;
    transform: translateY(30%);
  }

  .side-btn {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  /* 移动端收藏按钮 */
  .favorite-btn {
    top: 30px;
    right: 30px; /* 向左偏移10px */
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  /* 移动端选项布局：选择题改为4行单列 */
  .options-grid:not(.binary) {
    grid-template-columns: 1fr;
  }

  /* 移动端反馈样式 */
  .feedback-tag {
    font-size: 0.9rem;
    padding: 10px 14px;
  }

  /* 移动端填空题正确答案显示 */
  .fill-correct-answer {
    font-size: 0.85rem;
    padding: 6px 10px;
  }
}
</style>