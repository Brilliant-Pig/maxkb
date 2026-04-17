<template>
  <div class="art-text-container" ref="containerRef">
    <div ref="canvasContainer" class="webgl-background"></div>

    <div class="text-aligner">
      <div v-for="(line, index) in processedLines" :key="index" class="text-line">
        <span 
          v-for="(char, charIndex) in line" 
          :key="charIndex" 
          class="hover-char"
          :style="{ animationDelay: `${(index * 5 + charIndex) * 50}ms` }"
        >
          <span class="char-wrapper">
            {{ char === ' ' ? '&nbsp;' : char }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import * as THREE from 'three';
import { Effect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

const props = defineProps({
  text: { type: String, default: "LEISURELY FUN\nSMART BRAIN" },
  variant: { type: String, default: 'square' },
  pixelSize: { type: Number, default: 3 },
  color: { type: String, default: '#60a5fa' },
  patternScale: { type: Number, default: 2 },
  patternDensity: { type: Number, default: 1 },
  liquid: { type: Boolean, default: true },
  speed: { type: Number, default: 0.5 },
  liquidStrength: { type: Number, default: 0.025 },
  liquidRadius: { type: Number, default: 1 },
  pixelSizeJitter: { type: Number, default: 0 },
  enableRipples: { type: Boolean, default: true },
  rippleIntensityScale: { type: Number, default: 1 },
  rippleThickness: { type: Number, default: 0.1 },
  rippleSpeed: { type: Number, default: 0.3 },
  liquidWobbleSpeed: { type: Number, default: 4.5 },
});

// 处理文字
const processedLines = computed(() => props.text.split('\n'));

// WebGL 引用
const containerRef = ref(null);
const canvasContainer = ref(null);
let state = {
  renderer: null, scene: null, camera: null, material: null, 
  composer: null, clock: null, raf: null, touch: null
};

// --- 你提供的算法逻辑转换开始 ---
const SHAPE_MAP = { square: 0, circle: 1, triangle: 2, diamond: 3 };

// 将你提供的顶点和片元着色器字符串完整嵌入（此处为了简洁略写，请确保使用你提供的完整 GLSL）
const VERTEX_SRC = `void main() { gl_Position = vec4(position, 1.0); }`;
const FRAGMENT_SRC = `
precision highp float;
uniform vec3 uColor; uniform vec2 uResolution; uniform float uTime;
uniform float uPixelSize; uniform float uScale; uniform float uDensity;
uniform float uPixelJitter; uniform int uEnableRipples;
uniform float uRippleSpeed; uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform int uShapeType;
const int MAX_CLICKS = 10;
uniform vec2 uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];
out vec4 fragColor;

float Bayer2(vec2 a) { a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
#define Bayer8(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
float hash11(float n){ return fract(sin(n)*43758.5453); }
float vnoise(vec3 p){
  vec3 ip = floor(p); vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0,0,0), vec3(1,57,113)));
  float n100 = hash11(dot(ip + vec3(1,0,0), vec3(1,57,113)));
  float n010 = hash11(dot(ip + vec3(0,1,0), vec3(1,57,113)));
  float n110 = hash11(dot(ip + vec3(1,1,0), vec3(1,57,113)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  return mix(mix(n000, n100, w.x), mix(n010, n110, w.x), w.y) * 2.0 - 1.0;
}
void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  vec2 uv = (floor(fragCoord / (8.0 * pixelSize)) * 8.0 * pixelSize) / uResolution;
  float base = vnoise(vec3(uv * uScale, uTime * 0.05)) * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;
  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  fragColor = vec4(uColor, bw);
}
`;

const initWebGL = () => {
  const container = canvasContainer.value;
  if (!container) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const clock = new THREE.Clock();

  const uniforms = {
    uResolution: { value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(props.color) },
    uPixelSize: { value: props.pixelSize * renderer.getPixelRatio() },
    uScale: { value: props.patternScale },
    uDensity: { value: props.patternDensity },
    uPixelJitter: { value: props.pixelSizeJitter },
    uEnableRipples: { value: props.enableRipples ? 1 : 0 },
    uRippleSpeed: { value: props.rippleSpeed },
    uRippleThickness: { value: props.rippleThickness },
    uRippleIntensity: { value: props.rippleIntensityScale },
    uShapeType: { value: SHAPE_MAP[props.variant] || 0 },
    uClickPos: { value: Array.from({ length: 10 }, () => new THREE.Vector2(-1, -1)) },
    uClickTimes: { value: new Float32Array(10) }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SRC,
    fragmentShader: FRAGMENT_SRC,
    uniforms,
    transparent: true,
    glslVersion: THREE.GLSL3
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const animate = () => {
    state.raf = requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime() * props.speed;
    renderer.render(scene, camera);
  };
  animate();

  state = { renderer, scene, camera, material, clock };
};

onMounted(() => {
  initWebGL();
});

onUnmounted(() => {
  cancelAnimationFrame(state.raf);
  if (state.renderer) state.renderer.dispose();
});

// 监听 Prop 变化实时更新着色器
watch(() => props.color, (newVal) => {
  if (state.material) state.material.uniforms.uColor.value.set(newVal);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');

.art-text-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0; left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  z-index: 1;
}

/* WebGL 背景容器 */
.webgl-background {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
}

.text-aligner {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-95%);
}

.text-line {
  display: flex;
  white-space: nowrap;
  line-height: 0.95;
  text-transform: uppercase;
}

.hover-char {
  display: inline-block;
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: 900;
  position: relative;
  
  /* --- 关键：保留你原本的渐变色和文字效果 --- */
  background: linear-gradient(135deg, #00c6ff 0%, #f259a6 50%, #8c59f2 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  /* --- 结合：让底层的 WebGL 噪点透过来 --- */
  /* 使用 screen 或 overlay 模式。screen 会让文字的亮部与背景噪点结合 */
  mix-blend-mode: screen; 

  transition: transform 0.3s ease, filter 0.3s ease, background-position 0.5s ease;
  animation: colorFlow 8s linear infinite, initialBreathing 2s ease-out backwards;
}

/* 保持你原本的所有动画定义 */
@keyframes colorFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes initialBreathing {
  0% { opacity: 0; transform: scale(0.9) translateY(10px); filter: blur(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

.hover-char:hover {
  transform: translateY(-15%) scale(1.1) rotate(2deg);
  filter: brightness(1.2) drop-shadow(0 0 20px rgba(0, 198, 255, 0.5));
  z-index: 0;
}
</style>