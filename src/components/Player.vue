<template>
  <div class="audio-player-container">
    <audio 
      ref="audioRef" 
      :src="src" 
      @timeupdate="onTimeUpdate" 
      @loadedmetadata="onLoadedMetadata"
      @ended="isPlaying = false"
    ></audio>

    <div class="player-card">
      <div class="progress-area">
        <span class="time-label">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }"></div>
          <input
            type="range"
            class="progress-bar-input"
            min="0"
            :max="duration"
            step="0.1"
            v-model="currentTime"
            @input="onSeek"
          />
        </div>
        <span class="time-label">{{ formatTime(duration) }}</span>
      </div>

      <div class="controls-area">
        <button class="ctrl-btn skip-btn" @click="skip(-5)">
          <span class="icon"><< 5s</span>
        </button>

        <button class="ctrl-btn play-btn" @click="togglePlay">
          <div :class="['play-icon', { 'is-playing': isPlaying }]"></div>
        </button>

        <button class="ctrl-btn skip-btn" @click="skip(5)">
          <span class="icon">5s >></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue';

const props = withDefaults(defineProps<{
  src: string; // 听力文件的 URL
  active?: boolean; // 是否处于激活状态（在视图中）
}>(), {
  active: true
});

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

// 计算进度百分比
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// 1. 播放/暂停逻辑
const togglePlay = () => {
  // 触觉反馈：点击震动（主要针对 Safari 移动端）
  try {
    if (typeof navigator.vibrate === 'function') {
      // 使用数组格式确保兼容性，50ms 短震动
      navigator.vibrate([50]);
    }
  } catch (e) {
    // 忽略震动失败
  }

  if (!audioRef.value || !props.active) return; // 非激活状态不允许播放
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

// 2. 快进/快退 5s 逻辑
const skip = (seconds: number) => {
  if (!audioRef.value) return;
  audioRef.value.currentTime += seconds;
};

// 3. 拖动进度条逻辑
const onSeek = () => {
  if (!audioRef.value) return;
  audioRef.value.currentTime = currentTime.value;
};

// 4. 音频元数据加载（获取总时长）
const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
};

// 5. 更新当前播放时间点
const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

// 辅助函数：格式化时间 (00:00)
const formatTime = (time: number) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 监听 active 状态变化
watch(() => props.active, (newActive) => {
  if (!newActive && audioRef.value && isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
});

onUnmounted(() => {
  if (audioRef.value) audioRef.value.pause();
});
</script>

<style scoped>
.audio-player-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.player-card {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

/* 进度条样式 */
.progress-area {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.time-label {
  font-size: 15px;
  color: black;
  /* opacity: 0.7; */
  min-width: 40px;
}

/* 新的进度条容器 */
.progress-bar-container {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

/* 已播放部分的填充 */
.progress-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  z-index: 1;
}

/* 隐藏的原生输入 */
.progress-bar-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  margin: 0;
}

/* 控制按钮样式 */
.controls-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  
}

.ctrl-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: black;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  
}

.skip-btn {
bottom: 10px;
  font-size: 14px;
  font-weight: bold;
  /* opacity: 0.6; */
}

.skip-btn:hover {
  opacity: 1;
  color: var(--primary-color);
}

.play-btn {
    margin-bottom: 20px;
  width: 56px;
  height: 56px;
  background: var(--primary-color);
  border-radius: 50%;
  color: white;
  box-shadow: 2px 3px 3px rgba(0, 0, 0, 0.3);
}

.play-btn:hover {
  transform: scale(1.1);
}

.play-btn:active {
  transform: translateY(5px);
  box-shadow: 2px 3px 3px rgba(0, 0, 0, 0.1);
}


/* 播放/暂停图标切换 */
.play-icon {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 10px 0 10px 18px;
  border-color: transparent transparent transparent #ffffff;
  margin-left: 4px;
  transition: all 0.2s;
}

.play-icon.is-playing {
  width: 16px;
  height: 18px;
  border-style: double;
  border-width: 0px 0px 0px 16px;
  border-color: #ffffff;
  margin-left: 0;
}
</style>