<template>
  <div class="admin-container">
    <aside class="admin-sidebar animate__animated animate__fadeInLeft">
      <div class="admin-logo">
        <span class="logo-icon">📊</span>
        <span>SMART BRAIN<br>教学后台</span>
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
/* -----------------------------------------------------------
   1. 基础布局保持
----------------------------------------------------------- */
.admin-container { display: flex; height: 100vh; background: #020617; color: #f8fafc; overflow: hidden; }
.admin-sidebar { width: 280px; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(25px); padding: 40px 24px; border-right: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; }
.admin-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 40px; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.admin-section { background: rgba(15, 23, 42, 0.3); border-radius: 24px; padding: 30px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px; }

/* -----------------------------------------------------------
   2. 导出 & 上传按钮：显著化 + 悬浮粉紫蓝颜色循环
----------------------------------------------------------- */
.btn-export, .btn-upload {
  position: relative;
  background: #1e293b;
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

/* 上传按钮更醒目一些 */
.btn-upload {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

/* 颜色循环动画 */
@keyframes neonRainbow {
  0% { background-color: #f472b6; box-shadow: 0 0 20px rgba(244, 114, 182, 0.6); } /* 粉 */
  33% { background-color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.6); } /* 紫 */
  66% { background-color: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }   /* 蓝 */
  100% { background-color: #f472b6; box-shadow: 0 0 20px rgba(244, 114, 182, 0.6); }
}

.btn-export:hover, .btn-upload:hover {
  animation: neonRainbow 3s linear infinite;
  transform: translateY(-3px);
  border-color: transparent;
  color: #fff;
}

/* -----------------------------------------------------------
   3. 核心内容排版：效能指标卡片（与监控面板完全对齐）
----------------------------------------------------------- */
/* 注意：请确保 Template 中这三个指标的容器 class 也是 "perf-grid" */
.perf-grid, .metrics-column { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 20px; 
  margin-top: 15px; 
}

/* 统一样式：perf-item 和 metric-card 表现一致 */
.perf-item, .metric-card {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
  position: relative;
  overflow: hidden;
  transition: 0.3s;
}

.perf-item:hover, .metric-card:hover {
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.15);
}

/* 标签样式 */
.perf-item label, .metric-card .m-label {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 12px;
  display: block;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 数值盒子样式 */
.v-box, .m-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: 'Inter', system-ui, sans-serif;
}

/* 数值中的单位/斜杠 */
.v-box small, .m-value small {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

/* -----------------------------------------------------------
   4. 分隔装饰线：左侧彩色发光条 (粉-紫-蓝)
----------------------------------------------------------- */
.perf-item::before, .metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

/* 依次分配粉、紫、蓝 */
.perf-item:nth-child(1)::before, .metric-card:nth-child(1)::before { 
  background: #f472b6; box-shadow: 2px 0 10px rgba(244, 114, 182, 0.4); 
} 
.perf-item:nth-child(2)::before, .metric-card:nth-child(2)::before { 
  background: #a855f7; box-shadow: 2px 0 10px rgba(168, 85, 247, 0.4); 
} 
.perf-item:nth-child(3)::before, .metric-card:nth-child(3)::before { 
  background: #3b82f6; box-shadow: 2px 0 10px rgba(59, 130, 246, 0.4); 
}

/* -----------------------------------------------------------
   5. 其他基础样式保持
----------------------------------------------------------- */
.admin-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 50px; font-weight: 800; color: #fff; font-size: 1.2rem; }
.nav-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.nav-item { padding: 16px 20px; border-radius: 12px; cursor: pointer; color: #94a3b8; transition: 0.3s; }
.nav-item.active { background: rgba(59, 130, 246, 0.1); color: #fff; border: 1px solid rgba(59, 130, 246, 0.5); }
.data-table {
  width: 100%;
  border-collapse: collapse;
  /* 强制固定布局，确保列宽按比例分配 */
  table-layout: fixed; 
}

/* 定义列宽比例：资源名称占 40%，其他三列平分 */
.data-table th:nth-child(1), .data-table td:nth-child(1) { width: 40%; }
.data-table th:nth-child(2), .data-table td:nth-child(2) { width: 20%; }
.data-table th:nth-child(3), .data-table td:nth-child(3) { width: 20%; }
.data-table th:nth-child(4), .data-table td:nth-child(4) { width: 20%; }

.data-table th {
  text-align: left;
  padding: 18px 16px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02); /* 给表头一点背景色，更易对齐 */
}

.data-table td {
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: #f8fafc;
  vertical-align: middle;
  /* 防止内容过长撑破布局 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 进度条容器对齐微调 */
.mini-progress {
  width: 80%; /* 限制进度条宽度，不要太贴边 */
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.mini-progress .fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #a855f7);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

/* 标签样式微调 */
.tag.blue {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  font-size: 12px;
}.status-on { color: #10b981; font-weight: bold; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
</style>