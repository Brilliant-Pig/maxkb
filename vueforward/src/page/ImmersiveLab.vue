<template>
  <div class="lab-container">
    <header class="lab-header animate__animated animate__fadeIn">
      <div class="logo-area">
        <span class="logo-icon">🔬</span>
        <div class="logo-text">
          <div class="main-title">OS-AI 智学实验室</div>
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
          <span class="value green">● 数据不出校</span>
        </div>
      </div>
    </header>

    <main class="lab-main">
      <aside class="knowledge-sidebar animate__animated animate__fadeInLeft">
        <div class="sidebar-header">
          <h3>核心考点快捷键</h3>
          <p>点击自动生成针对性提问指令</p>
        </div>

        <ul class="topic-list">
          <li
            v-for="(topic, index) in topics"
            :key="topic"
            class="topic-item"
            @click="quickAsk(topic)"
          >
            <div class="topic-num">{{ index + 1 }}</div>
            <div class="topic-content">
              <span class="topic-name">{{ topic }}</span>
              <span class="topic-desc">点击复制精准指令</span>
            </div>
          </li>
        </ul>

        <div class="survey-entrance">
          <div class="entrance-info">
            <h4>学业自我效能评估</h4>
            <p>本次已累计使用 <span class="time-highlight">{{ totalMinutes }}</span> 分钟</p>
          </div>
          <button @click="openSurvey" class="survey-btn">
            去填写量表
          </button>
        </div>
      </aside>

      <section class="ai-interaction-area">
        <div class="iframe-wrapper">
          <div v-if="iframeLoading" class="loading-spinner">
            <div class="orbit-spinner"></div>
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
      <div v-if="showTip" class="instruction-tip">
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
/* 样式保留之前设计的科技感方案 */
.lab-container { display: flex; flex-direction: column; height: 100%; background: #0f172a; color: #f8fafc; }
.lab-header { height: 70px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
.logo-area { display: flex; align-items: center; gap: 12px; }
.logo-icon { font-size: 2rem; }
.main-title { font-size: 1.2rem; font-weight: bold; }
.sub-title { font-size: 0.7rem; color: #94a3b8; }
.system-status { display: flex; gap: 20px; }
.status-item { text-align: right; }
.status-item .label { display: block; font-size: 0.6rem; color: #64748b; }
.status-item .value { font-size: 0.85rem; font-weight: 500; }
.value.green { color: #22c55e; }
.lab-main { flex: 1; display: flex; overflow: hidden; }
.knowledge-sidebar { width: 320px; background: #1e293b; padding: 24px; display: flex; flex-direction: column; border-right: 1px solid rgba(255, 255, 255, 0.05); }
.sidebar-header h3 { font-size: 1.1rem; margin-bottom: 4px; color: #3b82f6; }
.sidebar-header p { font-size: 0.75rem; color: #64748b; margin-bottom: 24px; }
.topic-list { list-style: none; padding: 0; flex: 1; overflow-y: auto; }
.topic-item { display: flex; gap: 12px; padding: 14px; margin-bottom: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.topic-item:hover { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); transform: translateX(4px); }
.topic-num { width: 24px; height: 24px; background: #334155; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #3b82f6; }
.topic-name { display: block; font-size: 0.9rem; font-weight: 500; }
.topic-desc { font-size: 0.7rem; color: #64748b; }

.survey-entrance { margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 12px; }
.time-highlight { color: #fbbf24; font-weight: bold; font-size: 1.1rem; }
.entrance-info h4 { font-size: 0.9rem; margin-bottom: 4px; }
.entrance-info p { font-size: 0.8rem; opacity: 0.9; margin-bottom: 12px; }
.survey-btn { width: 100%; padding: 10px; border-radius: 8px; border: none; background: white; color: #1e40af; font-weight: bold; cursor: pointer; }

.ai-interaction-area { flex: 1; background: #f8fafc; }
.iframe-wrapper { width: 100%; height: 100%; position: relative; }
.loading-spinner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f1f5f9; color: #475569; }
.orbit-spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.instruction-tip { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #22c55e; color: white; padding: 12px 24px; border-radius: 50px; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.4); z-index: 1000; font-size: 0.9rem; }
.bounce-enter-active { animation: bounce-in 0.5s; }
.bounce-leave-active { animation: bounce-in 0.5s reverse; }
@keyframes bounce-in { 0% { transform: translateX(-50%) scale(0); } 50% { transform: translateX(-50%) scale(1.1); } 100% { transform: translateX(-50%) scale(1); } }
</style>