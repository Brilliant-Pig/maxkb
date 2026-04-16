<template>
  <div class="art-text-container">
    <div class="text-aligner">
      <div v-for="(line, index) in processedLines" :key="index" class="text-line">
        <span 
          v-for="(char, charIndex) in line" 
          :key="charIndex" 
          class="hover-char"
          :style="{ animationDelay: `${(index * 5 + charIndex) * 50}ms` }"
        >
          {{ char === ' ' ? '&nbsp;' : char }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: { 
    type: String, 
    default: "LEISURELY FUN\nSMART BRAIN" 
  },
  // speed 属性在这里不再使用，保留它以防止外部调用报错，或者你可以将其移除
  speed: { type: Number, default: 0.6 },
});

// 处理文字，按换行符拆分成数组
const processedLines = computed(() => {
  return props.text.split('\n');
});
</script>

<style scoped>
/* 谷歌字体引入 - Inter 900 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');

.art-text-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  /* 居中布局 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 暗色背景，衬托霓虹渐变 */
  background: #010409; 
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  /* 稍微放大字距增强艺术感 */
  letter-spacing: -0.02em; 
}

.text-aligner {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 稍微向上偏移，防止视觉上看起来偏下 */
  transform: translateY(-5%); 
}

.text-line {
  display: flex;
  white-space: nowrap;
  /* 紧凑的行高 */
  line-height: 0.95; 
  /* 强制大写增加力量感 */
  text-transform: uppercase; 
}

.hover-char {
  display: inline-block;
  /* --- 关键：超大字号但不占满全屏 --- */
  font-size: clamp(4rem, 10vw, 8rem); 
  font-weight: 900;
  cursor: default;
  position: relative;
  
  /* --- 霓虹蓝粉紫渐变笔画 --- */
  background: linear-gradient(135deg, #00c6ff 0%, #f259a6 50%, #8c59f2 100%);
  /* 这里的 size 需要设大，配合动画产生流动感 */
  background-size: 200% auto; 
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* 默认状态过渡 */
  transition: transform 0.3s ease, filter 0.3s ease, background-position 0.5s ease;
  
  /* 可选：初始入场呼吸动画 */
  animation: colorFlow 8s linear infinite, initialBreathing 2s ease-out backwards;
}

/* --- 鼠标悬浮跳动动画 --- */
.hover-char:hover {
  /* 向上跳动并轻微放大 */
  transform: translateY(-25%) scale(1.1);
  /* 增强亮度和霓虹发光感 */
  filter: brightness(1.3) drop-shadow(0 0 15px rgba(140, 89, 242, 0.7));
  /* 悬浮时让渐变色流动 */
  background-position: right center; 
}

/* --- Keyframes --- */

/* 1. 初始入场呼吸（可选） */
@keyframes initialBreathing {
  from { opacity: 0; transform: translateY(10px) scale(0.98); filter: blur(5px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

/* 2. 背景颜色缓慢流动 */
@keyframes colorFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>