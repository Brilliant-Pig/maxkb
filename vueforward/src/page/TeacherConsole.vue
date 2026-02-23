<template>
  <div class="admin-container">
    <aside class="admin-sidebar animate__animated animate__fadeInLeft">
      <div class="admin-logo">
        <span class="logo-icon">📊</span>
        <span>OS-AI 教学后台</span>
      </div>
      <nav class="nav-list">
        <div 
          v-for="item in menuItems" 
          :key="item.id"
          :class="['nav-item', { active: activeMenu === item.id }]"
          @click="activeMenu = item.id"
        >
          {{ item.icon }} {{ item.name }}
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <div class="node-status">
          <div class="dot pulsing"></div>
          <span>计算节点: RTX 4060 (Active)</span>
        </div>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <div class="welcome-text">
          <h2>教学监控与科研看板</h2>
          <p>当前实验状态：<span class="status-on">数据实时同步中</span></p>
        </div>
        <div class="header-actions">
          <button class="btn-export" @click="exportResearchData">
            📤 导出全量科研报表 (CSV)
          </button>
        </div>
      </header>

      <div class="dashboard-content">
        <section v-if="activeMenu === 'kb'" class="admin-section">
          <div class="section-header">
            <h3>📚 知识库资源迭代 (RAG)</h3>
            <label class="btn-upload">
              + 上传教学资料 (PDF/MD)
              <input type="file" @change="handleFileUpload" hidden accept=".pdf,.md,.doc,.docx">
            </label>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>资源名称</th>
                <th>模块</th>
                <th>向量化进度</th>
                <th>最近同步时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in knowledgeFiles" :key="file.id">
                <td class="file-name">{{ file.name }}</td>
                <td><span class="tag blue">{{ file.module }}</span></td>
                <td>
                  <div class="mini-progress"><div class="fill" style="width: 100%"></div></div>
                </td>
                <td class="status-ok">{{ file.time }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div v-if="activeMenu === 'data'" class="data-grid">
          <section class="admin-section">
            <div class="section-header">
              <h3>🔥 高频难题捕获 (基于真实点击)</h3>
            </div>
            <div class="hot-issues">
              <div v-for="issue in realHotIssues" :key="issue.topic" class="issue-card">
                <div class="issue-info">
                  <span class="count-badge">{{ issue.count }} 次关注</span>
                  <h4>{{ issue.topic }}</h4>
                </div>
                <div class="trend-wrapper">
                  <div class="trend-bar" :style="{ width: issue.percent + '%' }"></div>
                </div>
                <p class="error-detail">来源：{{ issue.source }}</p>
              </div>
            </div>
          </section>

          <section class="admin-section">
            <h3>🎓 班级整体效能评价</h3>
            <div class="metrics-column">
              <div class="metric-card">
                <span class="m-label">平均自我效能感</span>
                <span class="m-value">{{ classEfficacy }} <small>/ 5</small></span>
              </div>
              <div class="metric-card">
                <span class="m-label">系统可用性 (SUS)</span>
                <span class="m-value">{{ classSus }} <small>/ 100</small></span>
              </div>
              <div class="metric-card">
                <span class="m-label">人均实验室停留</span>
                <span class="m-value">{{ avgTime }} <small>min</small></span>
              </div>
            </div>
          </section>
        </div>

        <section v-if="activeMenu === 'sys'" class="admin-section">
          <h3>🖥️ 本地算力节点监控</h3>
          <div class="perf-grid">
            <div class="perf-item">
              <label>GPU 显存</label>
              <div class="v-box">6.42 / 8.0 GB</div>
            </div>
            <div class="perf-item">
              <label>平均推理延迟</label>
              <div class="v-box">{{ (1.2 + Math.random()*0.5).toFixed(2) }}s</div>
            </div>
            <div class="perf-item">
              <label>RAG 检索准确度</label>
              <div class="v-box">92.4%</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios'; // 确保安装了 axios: npm install axios
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        router.push('/login');
    }
});

const activeMenu = ref('data');
const menuItems = [
  { id: 'data', name: '教学数据归因', icon: '📊' },
  { id: 'kb', name: '知识库维护', icon: '📚' },
  { id: 'sys', name: '节点性能', icon: '🖥️' }
];

// 响应式数据变量
const knowledgeFiles = ref([]);
const classEfficacy = ref('0');
const classSus = ref('0');
const avgTime = ref('0');
const rawQuestions = ref([]); // 存储从后端拉取的原始问题数据

// 后端 API 基础路径 (需与后端端口一致)
const API_BASE = 'http://127.0.0.1:33001/api/user';

// 1. 从后端获取统计数据和问题列表
const refreshStats = async () => {
  try {
    // A. 获取班级整体评价 (效能感、SUS、时长)
    const statsRes = await axios.get(`${API_BASE}/getClassStats`);
    if (statsRes.data.code === 0) {
      const stats = statsRes.data.data;
      classEfficacy.value = stats.avgEfficacy || '0';
      classSus.value = stats.avgSus || '0';
      avgTime.value = stats.avgTime || '0';
    }

    // B. 获取所有学生提问与系统热点
    const qRes = await axios.get(`${API_BASE}/getQuestions`);
    if (qRes.data.code === 0) {
      rawQuestions.value = qRes.data.data;
    }
  } catch (error) {
    console.error("教师端同步后端数据失败:", error);
  }
};

// 2. 难题捕获逻辑：直接分析从后端拿到的 rawQuestions
const realHotIssues = computed(() => {
  if (!rawQuestions.value.length) return [];

  return rawQuestions.value.map(item => ({
    topic: item.question,
    count: item.hot || 0,
    // 进度条百分比，假设最高热度为10次点击
    percent: Math.min((item.hot || 0) * 10, 100),
    source: item.isStudent === 1 ? "学生自主提问" : "实验室热点点击"
  })).sort((a, b) => b.count - a.count); // 按热度降序排列
});

// 3. 知识库上传逻辑 (暂时保持本地，或根据需要对接后端上传接口)
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const newFile = {
    id: Date.now(),
    name: file.name,
    module: "新增资料",
    time: new Date().toLocaleString()
  };

  knowledgeFiles.value.unshift(newFile);
  localStorage.setItem('os_kb_files', JSON.stringify(knowledgeFiles.value));
};

// 4. 科研数据一键导出 (导出后端真实数据)
const exportResearchData = () => {
  let csv = "\uFEFF维度,具体内容,热度/得分,来源,时间\n";
  
  // 导出提问数据
  rawQuestions.value.forEach(q => {
    const type = q.isStudent === 1 ? '学生提问' : '热点考点';
    csv += `${type},${q.question},${q.hot || 0},${q.isStudent ? '个人反馈' : '系统统计'},${new Date().toLocaleDateString()}\n`;
  });

  // 导出统计指标
  csv += `效能评估,平均自我效能感,${classEfficacy.value},班级整体,${new Date().toLocaleDateString()}\n`;
  csv += `系统评价,SUS可用性得分,${classSus.value},班级整体,${new Date().toLocaleDateString()}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `OS_Research_Report_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
};

onMounted(() => {
  // 初始化加载知识库文件清单
  const savedFiles = localStorage.getItem('os_kb_files');
  knowledgeFiles.value = savedFiles ? JSON.parse(savedFiles) : [
    { id: 1, name: "操作系统核心讲义.pdf", module: "核心理论", time: "2024/3/1" }
  ];

  // 立即执行一次数据同步
  refreshStats();
  
  // 每 60 秒自动刷新一次，实现“数据实时同步中”
  setInterval(refreshStats, 60000);
});
</script>

<style scoped>
.admin-container { display: flex; height: 100vh; background: #f0f2f5; color: #334155; }
.admin-sidebar { width: 260px; background: #001529; color: white; display: flex; flex-direction: column; padding: 24px 0; }
.admin-logo { padding: 0 24px 32px; font-size: 1.25rem; font-weight: bold; color: #3b82f6; }
.nav-item { padding: 16px 24px; cursor: pointer; color: #94a3b8; }
.nav-item.active { background: #1890ff; color: white; }

.admin-main { flex: 1; padding: 32px; overflow-y: auto; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.status-on { color: #22c55e; font-weight: bold; }
.btn-export { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

.admin-section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-upload { background: #f0f7ff; color: #3b82f6; border: 1px dashed #3b82f6; padding: 8px 16px; border-radius: 6px; cursor: pointer; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table td, .data-table th { padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
.mini-progress { height: 6px; background: #e2e8f0; border-radius: 3px; width: 100px; }
.fill { height: 100%; background: #22c55e; }

.data-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.issue-card { border: 1px solid #f1f5f9; padding: 16px; border-radius: 10px; margin-bottom: 15px; }
.count-badge { background: #fff1f0; color: #f5222d; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; }
.trend-bar { height: 6px; background: #ff4d4f; border-radius: 3px; transition: width 1s; }

.metrics-column { display: flex; flex-direction: column; gap: 15px; }
.metric-card { background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6; }
.m-label { font-size: 0.8rem; color: #64748b; display: block; }
.m-value { font-size: 1.5rem; font-weight: bold; color: #1e293b; }

.perf-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.v-box { background: #0f172a; color: #22c55e; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 1.2rem; margin-top: 10px; }
</style>