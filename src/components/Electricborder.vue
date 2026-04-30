<template>
  <div ref="containerRef" :class="['electric-border', className]" :style="containerStyle">
    <div class="eb-canvas-container">
      <canvas ref="canvasRef" class="eb-canvas" />
    </div>

    <div class="eb-layers">
      <div class="eb-glow-1" />
      <div class="eb-glow-2" />
      <div class="eb-background-glow" />
    </div>

    <div class="eb-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

const props = defineProps({
  color: { type: String, default: '#5227FF' },       // 描边颜色 (传空或未设置时跟随 --primary-color CSS 变量)
  speed: { type: Number, default: 2 },                // 电流波动动画速度倍率
  chaos: { type: Number, default: 0.1 },             // 电流抖动幅度 (0~1, 越小越平滑)
  borderRadius: { type: Number, default: 24 },        // 容器圆角大小 (px)
  className: { type: String, default: '' },           // 追加到根元素的 CSS 类名
  customStyle: { type: Object, default: () => ({}) }  // 自定义内联样式
});

const canvasRef = ref(null);
const containerRef = ref(null);
const timeRef = ref(0);
const lastFrameTimeRef = ref(0);
let animationId = null;
let resizeObserver = null;

// 计算容器样式
const containerStyle = computed(() => ({
  '--electric-border-color': props.color,
  borderRadius: `${props.borderRadius}px`,
  ...props.customStyle
}));

// --- 噪声算法与数学逻辑 (从 React 源码迁移) ---

const random = (x) => (Math.sin(x * 12.9898) * 43758.5453) % 1;

const noise2D = (x, y) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const a = random(i + j * 57);
  const b = random(i + 1 + j * 57);
  const c = random(i + (j + 1) * 57);
  const d = random(i + 1 + (j + 1) * 57);
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
};

const octavedNoise = (x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) => {
  let y = 0;
  let amplitude = baseAmplitude;
  let frequency = baseFrequency;
  for (let i = 0; i < octaves; i++) {
    let octaveAmplitude = amplitude;
    if (i === 0) octaveAmplitude *= baseFlatness;
    y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return y;
};

const getCornerPoint = (centerX, centerY, radius, startAngle, arcLength, progress) => {
  const angle = startAngle + progress * arcLength;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};

const getRoundedRectPoint = (t, left, top, width, height, radius) => {
  const straightWidth = width - 2 * radius;
  const straightHeight = height - 2 * radius;
  const cornerArc = (Math.PI * radius) / 2;
  const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
  const distance = t * totalPerimeter;
  let acc = 0;

  if (distance <= acc + straightWidth) return { x: left + radius + ((distance - acc) / straightWidth) * straightWidth, y: top };
  acc += straightWidth;
  if (distance <= acc + cornerArc) return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (distance - acc) / cornerArc);
  acc += cornerArc;
  if (distance <= acc + straightHeight) return { x: left + width, y: top + radius + ((distance - acc) / straightHeight) * straightHeight };
  acc += straightHeight;
  if (distance <= acc + cornerArc) return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (distance - acc) / cornerArc);
  acc += cornerArc;
  if (distance <= acc + straightWidth) return { x: left + width - radius - ((distance - acc) / straightWidth) * straightWidth, y: top + height };
  acc += straightWidth;
  if (distance <= acc + cornerArc) return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (distance - acc) / cornerArc);
  acc += cornerArc;
  if (distance <= acc + straightHeight) return { x: left, y: top + height - radius - ((distance - acc) / straightHeight) * straightHeight };
  acc += straightHeight;
  return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (distance - acc) / cornerArc);
};

// --- 动画循环与渲染 ---

let ctx, canvasW, canvasH;

const updateSize = () => {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  const borderOffset = 60;
  const rect = container.getBoundingClientRect();
  canvasW = rect.width + borderOffset * 2;
  canvasH = rect.height + borderOffset * 2;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = `${canvasW}px`;
  canvas.style.height = `${canvasH}px`;
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
};

const draw = (currentTime) => {
  if (!ctx) return;

  const deltaTime = (currentTime - lastFrameTimeRef.value) / 1000;
  timeRef.value += deltaTime * props.speed;
  lastFrameTimeRef.value = currentTime;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.clearRect(0, 0, canvasW * dpr, canvasH * dpr);
  ctx.scale(dpr, dpr);

  // resolveColor: 优先使用 --primary-color CSS 变量，退化到 props.color
  const resolveStrokeColor = () => {
    const el = containerRef.value;
    if (!el) return props.color;
    return getComputedStyle(el).getPropertyValue('--primary-color').trim() || props.color;
  };
  ctx.strokeStyle = resolveStrokeColor();
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const displacement = 20;
  const borderOffset = 60;
  const left = borderOffset;
  const top = borderOffset;
  const borderWidth = canvasW - 2 * borderOffset;
  const borderHeight = canvasH - 2 * borderOffset;
  const radius = Math.min(props.borderRadius, Math.min(borderWidth, borderHeight) / 2);

  const sampleCount = Math.floor((2 * (borderWidth + borderHeight) + 2 * Math.PI * radius) / 2);

  ctx.beginPath();
  for (let i = 0; i <= sampleCount; i++) {
    const progress = i / sampleCount;
    const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);
    const xNoise = octavedNoise(progress * 8, 10, 1.6, 0.7, props.chaos, 10, timeRef.value, 0, 0);
    const yNoise = octavedNoise(progress * 8, 10, 1.6, 0.7, props.chaos, 10, timeRef.value, 1, 0);

    if (i === 0) ctx.moveTo(point.x + xNoise * displacement, point.y + yNoise * displacement);
    else ctx.lineTo(point.x + xNoise * displacement, point.y + yNoise * displacement);
  }
  ctx.closePath();
  ctx.stroke();

  animationId = requestAnimationFrame(draw);
};

onMounted(() => {
  updateSize();
  resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(containerRef.value);
  animationId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.electric-border {
  /* 使用 OKLCH 颜色空间获得更好的发光效果 */
  --electric-light-color: oklch(from var(--primary-color) l c h);
  position: relative;
  border-radius: inherit;
  overflow: visible;
  isolation: isolate;
}

.eb-canvas-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}

.eb-canvas {
  display: block;
}

.eb-content {
  position: relative;
  border-radius: inherit;
  z-index: 1;
}

.eb-layers {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.eb-glow-1,
.eb-glow-2,
.eb-background-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-sizing: border-box;
}

.eb-glow-1 {
  border: 2px solid oklch(from var(--primary-color) l c h / 0.6);
  filter: blur(1px);
}

.eb-glow-2 {
  border: 2px solid var(--primary-color);
  filter: blur(4px);
}

.eb-background-glow {
  z-index: -1;
  transform: scale(1.1);
  filter: blur(32px);
  opacity: 0.3;
  background: linear-gradient(-30deg,
      var(--primary-color) 0%,
      transparent,
      var(--primary-color));
}
</style>