<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { Effect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

const props = defineProps({
  variant: { type: String, default: 'square' },
  pixelSize: { type: Number, default: 3 },
  color: { type: String, default: '#B497CF' },
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
  antialias: { type: Boolean, default: true },
  patternScale: { type: Number, default: 2 },
  patternDensity: { type: Number, default: 1 },
  liquid: { type: Boolean, default: false },
  liquidStrength: { type: Number, default: 0.1 },
  liquidRadius: { type: Number, default: 1 },
  pixelSizeJitter: { type: Number, default: 0 },
  enableRipples: { type: Boolean, default: true },
  rippleIntensityScale: { type: Number, default: 1 },
  rippleThickness: { type: Number, default: 0.1 },
  rippleSpeed: { type: Number, default: 0.3 },
  liquidWobbleSpeed: { type: Number, default: 4.5 },
  autoPauseOffscreen: { type: Boolean, default: true },
  speed: { type: Number, default: 0.5 },
  transparent: { type: Boolean, default: true },
  edgeFade: { type: Number, default: 0.5 },
  noiseAmount: { type: Number, default: 0 }
});

const SHAPE_MAP = { square: 0, circle: 1, triangle: 2, diamond: 3 };
const MAX_CLICKS = 10;

// --- Helper Functions ---
const createTouchTexture = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.Texture(canvas);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  let trail = [];
  let last = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const speed = 1 / maxAge;

  const drawPoint = p => {
    const pos = { x: p.x * size, y: (1 - p.y) * size };
    let intensity = 1;
    if (p.age < maxAge * 0.3) intensity = Math.sin((p.age / (maxAge * 0.3)) * Math.PI / 2);
    else intensity = Math.max(0, -(p.age - maxAge * 0.3) / (maxAge * 0.7) * ((p.age - maxAge * 0.3) / (maxAge * 0.7) - 2));
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;
    ctx.shadowOffsetX = ctx.shadowOffsetY = offset;
    ctx.shadowBlur = radius;
    ctx.shadowColor = `rgba(${color},${0.22 * intensity})`;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,0,0,1)';
    ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  return {
    texture,
    addTouch: (norm) => {
      let force = 0, vx = 0, vy = 0;
      if (last) {
        const dx = norm.x - last.x, dy = norm.y - last.y;
        if (dx === 0 && dy === 0) return;
        const dd = dx * dx + dy * dy;
        const d = Math.sqrt(dd);
        vx = dx / (d || 1); vy = dy / (d || 1);
        force = Math.min(dd * 10000, 1);
      }
      last = { x: norm.x, y: norm.y };
      trail.push({ x: norm.x, y: norm.y, age: 0, force, vx, vy });
    },
    update: () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, size, size);
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        const f = p.force * speed * (1 - p.age / maxAge);
        p.x += p.vx * f; p.y += p.vy * f; p.age++;
        if (p.age > maxAge) trail.splice(i, 1);
      }
      trail.forEach(drawPoint);
      texture.needsUpdate = true;
    },
    set radiusScale(v) { radius = 0.1 * size * v; }
  };
};

const createLiquidEffect = (texture, opts) => {
  const fragment = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;
    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float wave = 0.5 + 0.5 * sin(uTime * uFreq + tex.b * 6.2831853);
      uv += (tex.rg * 2.0 - 1.0) * uStrength * tex.b * wave;
    }
  `;
  return new Effect('LiquidEffect', fragment, {
    uniforms: new Map([
      ['uTexture', new THREE.Uniform(texture)],
      ['uStrength', new THREE.Uniform(opts?.strength ?? 0.025)],
      ['uTime', new THREE.Uniform(0)],
      ['uFreq', new THREE.Uniform(opts?.freq ?? 4.5)]
    ])
  });
};

// --- Shaders ---
const VERTEX_SRC = `void main() { gl_Position = vec4(position, 1.0); }`;
const FRAGMENT_SRC = `
precision highp float;
uniform vec3 uColor; 
uniform vec2 uResolution; 
uniform float uTime;
uniform float uPixelSize; 
uniform float uScale; 
uniform float uDensity;
uniform float uPixelJitter; 
uniform int uEnableRipples;
uniform float uRippleSpeed; 
uniform float uRippleThickness;
uniform float uRippleIntensity; 
uniform int uShapeType;
uniform vec2 uClickPos[10]; 
uniform float uClickTimes[10];
out vec4 fragColor;

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p); vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0,0,0), vec3(1,57,113)));
  float n100 = hash11(dot(ip + vec3(1,0,0), vec3(1,57,113)));
  float n010 = hash11(dot(ip + vec3(0,1,0), vec3(1,57,113)));
  float n110 = hash11(dot(ip + vec3(1,1,0), vec3(1,57,113)));
  float n001 = hash11(dot(ip + vec3(0,0,1), vec3(1,57,113)));
  float n101 = hash11(dot(ip + vec3(1,0,1), vec3(1,57,113)));
  float n011 = hash11(dot(ip + vec3(0,1,1), vec3(1,57,113)));
  float n111 = hash11(dot(ip + vec3(1,1,1), vec3(1,57,113)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  return mix(mix(mix(n000,n100,w.x),mix(n010,n110,w.x),w.y),mix(mix(n001,n101,w.x),mix(n011,n111,w.x),w.y),w.z)*2.-1.;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t); 
  float amp = 1.0, freq = 1.0, sum = 0.0;
  for (int i = 0; i < 5; ++i){
    sum += amp * vnoise(p * freq); 
    amp *= 0.5; 
    freq *= 1.8;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float d = length(p - 0.5) - sqrt(cov) * .25;
  return cov * (1.0 - smoothstep(-0.5*fwidth(d), 0.5*fwidth(d), d * 2.0));
}

void main(){
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 uv = floor(fragCoord / (8.0 * uPixelSize)) * (8.0 * uPixelSize) / uResolution * vec2(aspectRatio, 1.0);

  float feed = (fbm2(uv, uTime * 0.05) * 0.5 - 0.65) + (uDensity - 0.5) * 0.3;

  if (uEnableRipples == 1) {
    for (int i = 0; i < 10; ++i){
      if (uClickPos[i].x < 0.0) continue;
      vec2 cuv = ((uClickPos[i] - uResolution*.5 - 4.*uPixelSize)/uResolution) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      feed = max(feed, exp(-pow((r - uRippleSpeed*t)/uRippleThickness, 2.0)) * exp(-t) * exp(-10.0*r) * uRippleIntensity);
    }
  }

  // 加强噪点 + 减少条纹
  float jitter = fract(sin(dot(floor(gl_FragCoord.xy / uPixelSize), vec2(12.9898, 78.233))) * 43758.5453);
  float noiseJitter = (jitter - 0.5) * 1.6;

  float coverage = step(0.40, feed + noiseJitter) 
                   * (0.8 + jitter * uPixelJitter * 1.3);

  float M = (uShapeType == 1) ? maskCircle(fract(fragCoord/uPixelSize), coverage) : coverage;

  vec3 srgb = mix(uColor * 12.92, 1.055 * pow(uColor, vec3(1.0/2.4)) - 0.055, step(0.0031308, uColor));
  fragColor = vec4(srgb, M);
}
`;

// --- Component Logic ---
const containerRef = ref(null);
const isVisible = ref(true);
let state = null; // Stores all Three.js objects

const initThree = () => {
// 先获取 ref 的 value（注意是 .value，不是 .current！）
  const container = containerRef.value;   

  if (!container) {
    console.warn('ColorBends: containerRef.value 仍然是 null，延迟初始化');
    // 延迟 50ms 再尝试（最常用解决办法）
    setTimeout(initThree, 50);
    return;
  }

  console.log('ColorBends 初始化成功，容器尺寸:', 
    container.clientWidth, 'x', container.clientHeight);

  if (container.clientWidth === 0 || container.clientHeight === 0) {
    console.warn('ColorBends: 容器尺寸为 0，请检查父元素是否设置了 height: 100%');
  }
  const renderer = new THREE.WebGLRenderer({
    antialias: props.antialias,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uResolution: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(props.color) },
    uClickPos: { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
    uClickTimes: { value: new Float32Array(MAX_CLICKS) },
    uShapeType: { value: SHAPE_MAP[props.variant] || 0 },
    uPixelSize: { value: props.pixelSize },
    uScale: { value: props.patternScale },
    uDensity: { value: props.patternDensity },
    uPixelJitter: { value: props.pixelSizeJitter },
    uEnableRipples: { value: props.enableRipples ? 1 : 0 },
    uRippleSpeed: { value: props.rippleSpeed },
    uRippleThickness: { value: props.rippleThickness },
    uRippleIntensity: { value: props.rippleIntensityScale },
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

  // Post-processing
  let composer, touch, liquidEffect;
  if (props.liquid) {
    touch = createTouchTexture();
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    liquidEffect = createLiquidEffect(touch.texture, { strength: props.liquidStrength, freq: props.liquidWobbleSpeed });
    const ep = new EffectPass(camera, liquidEffect);
    ep.renderToScreen = true;
    composer.addPass(ep);
  }

  if (props.noiseAmount > 0) {
    if (!composer) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
    }
    const noiseEffect = new Effect('NoiseEffect', 
      `uniform float uTime; uniform float uAmount; 
       float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);}
       void mainImage(const in vec4 c, const in vec2 uv, out vec4 o){ 
         o = c + vec4(vec3((hash(floor(uv*vec2(1920,1080))+floor(uTime*60.0))-0.5)*uAmount), 0.0); 
       }`, 
      { uniforms: new Map([['uTime', new THREE.Uniform(0)], ['uAmount', new THREE.Uniform(props.noiseAmount)]]) }
    );
    const np = new EffectPass(camera, noiseEffect);
    np.renderToScreen = true;
    composer.passes.forEach(p => p.renderToScreen = false);
    composer.addPass(np);
  }

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    uniforms.uPixelSize.value = props.pixelSize * renderer.getPixelRatio();
    composer?.setSize(renderer.domElement.width, renderer.domElement.height);
  };

  const mapToPixels = e => {
    const rect = renderer.domElement.getBoundingClientRect();
    return {
      fx: (e.clientX - rect.left) * (renderer.domElement.width / rect.width),
      fy: (rect.height - (e.clientY - rect.top)) * (renderer.domElement.height / rect.height)
    };
  };

  let clickIx = 0;
  const onPointerDown = e => {
    const { fx, fy } = mapToPixels(e);
    uniforms.uClickPos.value[clickIx].set(fx, fy);
    uniforms.uClickTimes.value[clickIx] = uniforms.uTime.value;
    clickIx = (clickIx + 1) % MAX_CLICKS;
  };

  const onPointerMove = e => {
    if (!touch) return;
    const { fx, fy } = mapToPixels(e);
    touch.addTouch({ x: fx / renderer.domElement.width, y: fy / renderer.domElement.height });
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);

  const clock = new THREE.Clock();
  const timeOffset = Math.random() * 1000;
  let raf;

  const loop = () => {
    if (props.autoPauseOffscreen && !isVisible.value) {
      raf = requestAnimationFrame(loop); return;
    }
    const t = timeOffset + clock.getElapsedTime() * props.speed;
    uniforms.uTime.value = t;
    if (touch) touch.update();
    if (composer) {
      composer.passes.forEach(p => p.effects?.forEach(e => { if(e.uniforms.has('uTime')) e.uniforms.get('uTime').value = t; }));
      composer.render();
    } else renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  loop();

  state = { renderer, scene, camera, material, quad, composer, touch, ro, raf, uniforms, liquidEffect };
};

const cleanup = () => {
  if (!state) return;
  state.ro.disconnect();
  cancelAnimationFrame(state.raf);
  state.renderer.domElement.removeEventListener('pointerdown', () => {});
  state.renderer.domElement.removeEventListener('pointermove', () => {});
  state.quad.geometry.dispose();
  state.material.dispose();
  state.composer?.dispose();
  state.renderer.dispose();
  state.renderer.forceContextLoss();
  state.renderer.domElement.remove();
  state = null;
};

onMounted(async () => {
  await nextTick();        // 等待 DOM 更新完成
  initThree();

  const observer = new IntersectionObserver(([entry]) => {
    isVisible.value = entry.isIntersecting;
  });
  if (containerRef.value) observer.observe(containerRef.value);
});

onUnmounted(cleanup);

// Watchers for props that don't require full re-init
watch(() => [props.variant, props.color, props.pixelSize, props.patternScale, props.patternDensity, props.enableRipples, props.edgeFade], () => {
  if (!state) return;
  const { uniforms, renderer } = state;
  uniforms.uShapeType.value = SHAPE_MAP[props.variant] || 0;
  uniforms.uColor.value.set(props.color);
  uniforms.uPixelSize.value = props.pixelSize * renderer.getPixelRatio();
  uniforms.uScale.value = props.patternScale;
  uniforms.uDensity.value = props.patternDensity;
  uniforms.uEnableRipples.value = props.enableRipples ? 1 : 0;
}, { deep: true });

// Watchers for props that REQUIRE full re-init
watch(() => [props.antialias, props.liquid, props.noiseAmount], () => {
  cleanup();
  nextTick(initThree);
});
</script>

<template>
  <div
    ref="containerRef"
    :class="['pixel-blast-container', className]"
    :style="style"
    role="img"
    aria-label="PixelBlast interactive background"
  />
</template>

<style scoped>
/* ColorBends.vue */
.pixel-blast-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 0;                    /* 保持在最底层 */
  pointer-events: none;          /* ← 关键修改：让鼠标穿透，不挡上面的元素 */
}
</style>