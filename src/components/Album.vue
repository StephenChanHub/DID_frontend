<template>
  <Teleport to="body">
    <div v-if="visible" class="album-overlay">
      <div ref="container" class="scene-container"></div>
      <audio ref="audioEl" :src="resolvedMediaUrl" style="display:none" />

      <button class="back-btn" @click="$emit('close')">← Back</button>

      <div v-if="mode === 'store'" class="store-bar">
        <span class="price-tag">{{ price }} Coins</span>
        <div class="store-btns">
          <button class="btn cancel" @click="$emit('close')">Cancel</button>
          <button class="btn buy" @click="$emit('buy', collectionId)">Buy</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { buildFileUrl } from '@/config/env';

const props = defineProps<{
  visible: boolean;
  imageUrl: string | null;
  mediaUrl: string | null;
  name: string;
  mode: 'view' | 'store';
  price: number;
  collectionId: number;
}>();

const emit = defineEmits<{
  close: [];
  buy: [collectionId: number];
  timeout: [];
}>();

const container = ref<HTMLElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let animationId: number | null = null;
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

const resolvedMediaUrl = computed(() => {
  if (!props.mediaUrl) return undefined;
  const url = buildFileUrl(props.mediaUrl);
  if (!url) return undefined;
  const ext = url.split('.').pop()?.toLowerCase();
  if (!ext || !['mp3', 'wav'].includes(ext)) return undefined;
  return url;
});

const initThree = () => {
  if (!container.value) return;

  scene = new THREE.Scene();

  // 1. 初始大小设置为最小：将相机 Z 轴设为 maxDistance 的值 (6.0)[cite: 4]
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 6.0); 

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  // 2. 调亮移动端整体亮度：提升曝光度[cite: 4]
  renderer.toneMappingExposure = 2.0; 
  
  container.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = (5 * Math.PI) / 6;
  
  // 缩放范围限制[cite: 4]
  controls.maxDistance = 10;
  controls.minDistance = 2;
  controls.enablePan = false;

  const resolvedUrl = buildFileUrl(props.imageUrl);
  const loader = new THREE.TextureLoader();
  const coverTex = resolvedUrl
    ? loader.load(resolvedUrl)
    : loader.load('/IMG_3995.JPG');
  coverTex.colorSpace = THREE.SRGBColorSpace;

  const materials = [
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.4 }),
  ];

  const album = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.05), materials);
  album.position.y = 0.5;
  scene.add(album);

  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1a,
    metalness: 0.8,
    roughness: 0.7,
  });
  const baseGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.15, 64);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -0.8;
  scene.add(base);

  // 3. 增强灯光强度：环境光和直射光均调高[cite: 4]
  scene.add(new THREE.AmbientLight(0xffffff, 1.2)); 
  const topLight = new THREE.DirectionalLight(0xffffff, 5); 
  topLight.position.set(5, 10, 5);
  scene.add(topLight);

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    const time = Date.now() * 0.0015;
    album.position.y = 0.5 + Math.sin(time) * 0.08;
    album.rotation.y += 0.002;
    controls!.update();
    renderer!.render(scene!, camera!);
  };
  animate();
};

const startAudio = () => {
  if (!audioEl.value) return;
  audioEl.value.volume = 0.5;
  audioEl.value.play().catch(() => {
    const resume = () => {
      audioEl.value?.play().catch(() => {});
      document.removeEventListener('click', resume);
    };
    document.addEventListener('click', resume, { once: true });
  });
};

const stopAudio = () => {
  if (audioEl.value) {
    audioEl.value.pause();
    audioEl.value.currentTime = 0;
  }
};

const destroyThree = () => {
  if (animationId != null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = null;
  }
  scene = null;
  camera = null;
  controls = null;
};

const handleResize = () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

watch(() => props.visible, (v) => {
  if (v) {
    setTimeout(() => {
      initThree();
      startAudio();
    }, 0);
    window.addEventListener('resize', handleResize);
    if (props.mode === 'store') {
      autoCloseTimer = setTimeout(() => {
        stopAudio();
        destroyThree();
        window.removeEventListener('resize', handleResize);
        emit('timeout');
        emit('close');
      }, 5000);
    }
  } else {
    if (autoCloseTimer != null) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    stopAudio();
    destroyThree();
    window.removeEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  if (autoCloseTimer != null) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  stopAudio();
  destroyThree();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* 样式部分保持不变 */
.album-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.scene-container {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.scene-container:active {
  cursor: grabbing;
}

.scene-container :deep(canvas) {
  display: block;
}

.back-btn {
  position: fixed;
  top: calc(25px + env(safe-area-inset-top));
  left: calc(25px + env(safe-area-inset-left));
  z-index: 10;
  padding: 10px 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.store-bar {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 28px;
   border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.price-tag {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
  white-space: nowrap;
}

.store-btns {
  display: flex;
  gap: 12px;
  
}

.btn {
  padding: 10px 28px;
  border-radius: 20px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.cancel {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn.buy {
  background: var(--primary-color);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
</style>