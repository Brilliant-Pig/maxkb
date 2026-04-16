<template>
  <div class="lab-container">
    <header class="lab-header animate__animated animate__fadeInDown">
      <div class="logo-area">
        <span class="logo-icon">🔬</span>
        <div class="logo-text">
          <div class="main-title gradient-text-flow">SMART BRAIN 智学实验室</div>
          <div class="sub-title">沉浸式 RAG 知识检索空间</div>
        </div>
      </div>
      <div class="system-status">
        <div class="status-item">
          <span class="label">推理引擎</span>
          <span class="value">Ollama / Qwen2-32B</span>
        </div>
        <div class="status-item">
          <span class="label">安全模式</span>
          <span class="value purple-glow">● 数据不出校</span>
        </div>
      </div>
    </header>

    <main class="lab-main">
      <aside class="knowledge-sidebar glass-panel">
        <div class="sidebar-header animate__animated animate__fadeInLeft">
          <h3>核心考点快捷键</h3>
          <p>点击自动生成针对性提问指令</p>
        </div>

        <ul class="topic-listStaggered">
          <li
            v-for="(topic, index) in topics"
            :key="topic"
            class="topic-item staggered-animate"
            :style="{ animationDelay: `${index * 100}ms` }"
            @click="quickAsk(topic)"
          >
            <div class="topic-num gradient-bg-blue">{{ index + 1 }}</div>
            <div class="topic-content">
              <span class="topic-name">{{ topic }}</span>
              <span class="topic-desc">点击复制精准指令</span>
            </div>
          </li>
        </ul>

        <div class="survey-entrance neon-box animate__animated animate__fadeInUp">
          <div class="entrance-info">
            <h4>学业自我效能评估</h4>
            <p>本次已累计使用 <span class="time-highlight amber-glow">{{ totalMinutes }}</span> 分钟</p>
          </div>
          <button @click="openSurvey" class="survey-btn gradient-btn-purple">
            去填写量表
          </button>
        </div>
      </aside>

      <section class="ai-interaction-area">
        <div class="iframe-wrapper purple-breathing-border">
          <div v-if="iframeLoading" class="loading-spinner">
            <div class="orbit-spinner gradient-border"></div>
            <p>正在初始化本地向量数据库...</p>
          </div>
          
          <iframe
            v-show="!iframeLoading"
            :src="maxkbUrl"
            @load="onIframeLoad"
            style="width: 100%; height: 100%;"
            frameborder="0"
            allow="microphone"
          ></iframe>
        </div>
      </section>
    </main>

    <Transition name="bounce">
      <div v-if="showTip" class="instruction-tip gradient-bg-green">
        指令已复制！请在右侧 AI 框中<strong>粘贴(Ctrl+V)</strong>并回车
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const maxkbUrl = ref("http://localhost:8090/chat/74b3dfb549785c69");
const iframeLoading = ref(true);
const showTip = ref(false);

// 真实计时器相关
const totalMinutes = ref(0);
let timer = null;

const topics = ref([
  "虚拟内存置换算法 (LRU vs FIFO)",
  "银行家算法中的安全序列检测",
  "PV 操作解决生产者-消费者问题",
  "磁盘调度策略 (SCAN 与 LOOK)",
  "进程状态转换与 PCB 结构",
  "文件系统的 I-node 索引机制"
]);

// 初始化计时器逻辑
const initTimer = () => {
  // 从本地存储读取历史累计时长
  const savedTime = localStorage.getItem('os_total_study_minutes');
  totalMinutes.value = savedTime ? parseInt(savedTime) : 0;

  // 每分钟增加一次时长
  timer = setInterval(() => {
    totalMinutes.value++;
    localStorage.setItem('os_total_study_minutes', totalMinutes.value.toString());
  }, 60000); // 60秒
};

// 记录点击频率与生成日志
const quickAsk = async (topic) => {
  // 1. 更新真实点击频率（供教师后台和高频集使用）
  const clickCounts = JSON.parse(localStorage.getItem('os_topic_clicks') || '{}');
  clickCounts[topic] = (clickCounts[topic] || 0) + 1;
  localStorage.setItem('os_topic_clicks', JSON.stringify(clickCounts));

  // 2. 写入详细交互日志
  const logs = JSON.parse(localStorage.getItem('os_chat_logs') || '[]');
  logs.push({
    id: Date.now(),
    topic: topic,
    timestamp: new Date().toLocaleString(),
    type: 'click_shortcut'
  });
  localStorage.setItem('os_chat_logs', JSON.stringify(logs));

  // 3. 复制指令
  const prompt = `请详细解释操作系统中的：${topic}。请结合原理与实例说明。`;
  try {
    await navigator.clipboard.writeText(prompt);
    showTip.value = true;
    setTimeout(() => { showTip.value = false; }, 3000);
  } catch (err) {
    console.error("复制失败");
  }
};

const onIframeLoad = () => {
  iframeLoading.value = false;
};

const openSurvey = () => {
  router.push('/LearningDashboard');
};

onMounted(() => {
  initTimer();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* -----------------------------------------------------------
   1. 全局底色与动态氛围：引入微弱的背景光晕打破沉闷
----------------------------------------------------------- */
.lab-container { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  background: #020617; /* 更深邃的极夜蓝 */
  color: #f8fafc; 
  position: relative;
  overflow: hidden;
}

/* 增加左上角和右下角的氛围光影，不影响布局 */
.lab-container::before {
  content: '';
  position: absolute;
  top: -10%; left: -10%;
  width: 40%; height: 40%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}

/* -----------------------------------------------------------
   2. Header 样式：Logo 纯白化 + 科技青点缀
----------------------------------------------------------- */
.lab-header { 
  height: 70px; 
  background: rgba(15, 23, 42, 0.4); 
  backdrop-filter: blur(20px); 
  border-bottom: 1px solid rgba(255, 255, 255, 0.08); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 24px;
  z-index: 10;
}

.logo-area { display: flex; align-items: center; gap: 12px; }
.logo-icon { font-size: 1.8rem; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)); }

/* ✨ Logo 变为纯白色，并增加精致的外发光 */
.main-title {
  font-size: 1.25rem; 
  font-weight: 800;
  color: #ffffff; 
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

.sub-title { 
  font-size: 0.7rem; 
  color: #60a5fa; /* 换成更有科技感的青蓝色 */
  opacity: 0.8;
  margin-top: -2px; 
}

.system-status { display: flex; gap: 20px; }
.status-item .label { display: block; font-size: 0.6rem; color: #94a3b8; }
.status-item .value { font-size: 0.85rem; color: #ffffff; }
.purple-glow { 
  color: #c084fc; 
  text-shadow: 0 0 10px rgba(168, 85, 247, 0.5); 
}

/* -----------------------------------------------------------
   3. 侧边栏：多色调和，增强 Hover 交互感
----------------------------------------------------------- */
.lab-main { flex: 1; display: flex; overflow: hidden; }

.knowledge-sidebar { 
  width: 320px; 
  padding: 24px; 
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex; 
  flex-direction: column; 
}

.sidebar-header h3 { color: #f8fafc; font-weight: 600; margin-bottom: 4px; }
.sidebar-header p { font-size: 0.75rem; color: #64748b; margin-bottom: 24px; }

.topic-listStaggered { list-style: none; padding: 0; flex: 1; overflow-y: auto; }
.topic-listStaggered::-webkit-scrollbar { width: 0px; }

.topic-item { 
  display: flex; 
  gap: 12px; 
  padding: 14px; 
  margin-bottom: 12px; 
  background: rgba(255, 255, 255, 0.03); 
  border-radius: 12px; 
  cursor: pointer; 
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); 
  border: 1px solid rgba(255, 255, 255, 0.05); 
}

/* ✨ Hover 效果：青蓝色渐变边框 + 轻微位移 */
.topic-item:hover { 
  background: rgba(59, 130, 246, 0.1); 
  border-color: rgba(96, 165, 250, 0.4); 
  transform: translateX(8px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

/* ✨ 数字改为电光青渐变 */
.gradient-bg-blue {
  width: 26px; height: 26px; 
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  border-radius: 8px; 
  display: flex; align-items: center; justify-content: center; 
  font-size: 0.75rem; font-weight: 700; color: white; 
}

.topic-name { font-size: 0.9rem; color: #cbd5e1; transition: color 0.3s;}
.topic-item:hover .topic-name { color: #ffffff; }

/* -----------------------------------------------------------
   4. 学业效能评估：增强对比度与霓虹感
----------------------------------------------------------- */
.neon-box { 
  margin-top: 20px; 
  padding: 18px; 
  background: rgba(255, 255, 255, 0.02); 
  border-radius: 16px; 
  border: 1px solid rgba(139, 92, 246, 0.2);
  position: relative;
  overflow: hidden;
}

/* 装饰性紫色光斑 */
.neon-box::after {
  content: '';
  position: absolute;
  top: -15px; right: -15px;
  width: 40px; height: 40px;
  background: #8b5cf6;
  filter: blur(30px);
  opacity: 0.3;
}

.entrance-info h4 { font-size: 0.9rem; color: #f1f5f9; margin-bottom: 4px;}
.time-highlight { color: #fbbf24; font-weight: 800; text-shadow: 0 0 10px rgba(251, 191, 36, 0.3); }

/* ✨ 按钮：高饱和蓝紫渐变 */
.gradient-btn-purple { 
  width: 100%; 
  padding: 11px; 
  border-radius: 10px; 
  border: none; 
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white; 
  font-weight: 700; 
  cursor: pointer; 
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.gradient-btn-purple:hover { 
  filter: brightness(1.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.5);
}

/* -----------------------------------------------------------
   5. AI 区域：引入青色呼吸灯边缘
----------------------------------------------------------- */
.ai-interaction-area { flex: 1; background: #0f172a; overflow: hidden; }
.iframe-wrapper { width: 100%; height: 100%; position: relative; }

.purple-breathing-border {
  border-left: 1px solid rgba(6, 182, 212, 0.2); /* 初始为青色边 */
  animation: cyan-purple-breathe 5s ease-in-out infinite;
}

@keyframes cyan-purple-breathe {
  0%, 100% { box-shadow: inset 10px 0 30px -10px rgba(6, 182, 212, 0.1); }
  50% { box-shadow: inset 10px 0 50px -10px rgba(139, 92, 246, 0.15); }
}

.loading-spinner { 
  position: absolute; inset: 0; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  background: #020617; color: #94a3b8; 
}

.gradient-border { 
  width: 45px; height: 45px; 
  border: 3px solid rgba(255, 255, 255, 0.05); 
  border-top: 3px solid #3b82f6; 
  border-radius: 50%; 
  animation: spin 1s linear infinite; 
  margin-bottom: 16px; 
}

/* -----------------------------------------------------------
   6. 其他动画与提示
----------------------------------------------------------- */
.gradient-bg-green { 
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); 
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white; padding: 12px 24px; border-radius: 12px; 
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); z-index: 1000;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.staggered-animate {
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease-out forwards;
}

@keyframes slideIn {
  to { opacity: 1; transform: translateX(0); }
}
</style>