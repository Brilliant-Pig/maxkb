<template>
  <div class="dashboard-container">
    <aside class="stats-sidebar animate__animated animate__fadeInLeft">
      <div class="sidebar-header">
        <span class="icon">📈</span>
        <h2>成长评价中心</h2>
      </div>

      <div class="progress-card">
        <div class="label-row">
          <span>知识点掌握度</span>
          <span class="percent">{{ progress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="status-text">数据基于您的最新测评得分实时同步</p>
      </div>

      <nav class="nav-menu">
        <button @click="activeTab = 'efficacy'" :class="{ active: activeTab === 'efficacy' }">
          <span class="m-icon">🎯</span> 学业自我效能自评
        </button>
        <button @click="activeTab = 'sus'" :class="{ active: activeTab === 'sus' }">
          <span class="m-icon">⚙️</span> 系统可用性评价 (SUS)
        </button>
        <button @click="activeTab = 'faq'" :class="{ active: activeTab === 'faq' }">
          <span class="m-icon">❓</span> 考前高频问题集
        </button>
      </nav>
    </aside>

    <main class="content-area">
      <Transition name="fade-transform" mode="out-in">
        
        <section v-if="activeTab === 'efficacy'" class="scale-section" key="efficacy">
          <div class="section-title">
            <h3>学业自我效能感测评 (Post-test)</h3>
            <p class="subtitle">请根据您完成 AI 实验室学习后的真实感受进行打分</p>
          </div>
          
          <div class="likert-table">
            <div class="likert-header">
              <span class="q-label">测评项</span>
              <div class="options-legend">
                <span>完全不符合</span>
                <span>完全符合</span>
              </div>
            </div>
            
            <div v-for="(item, index) in efficacyItems" :key="index" class="likert-row">
              <div class="likert-q">{{ index + 1 }}. {{ item }}</div>
              <div class="likert-options">
                <label v-for="n in 5" :key="n" class="likert-item">
                  <input type="radio" :name="'eff'+index" v-model="effAnswers[index]" :value="n" @change="calculateProgress">
                  <span class="likert-circle">{{ n }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="action-footer">
            <button class="save-btn" @click="saveEfficacy">保存并更新掌握度数据</button>
          </div>
        </section>

        <section v-else-if="activeTab === 'sus'" class="scale-section" key="sus">
          <div class="section-title">
            <h3>系统可用性量表 (SUS)</h3>
            <p class="subtitle">针对本套本地部署 AI 助学系统的交互体验评价</p>
          </div>

          <div class="sus-list">
            <div v-for="(item, index) in susItems" :key="index" class="sus-card">
              <div class="sus-q-text">{{ index + 1 }}. {{ item }}</div>
              <div class="sus-options">
                <label v-for="n in 5" :key="n" class="sus-opt-label">
                  <input type="radio" :name="'sus'+index" v-model="susAnswers[index]" :value="n">
                  <span class="sus-dot">{{ n }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="action-footer">
            <button class="save-btn sus" @click="calculateSUS">提交系统评价结果</button>
          </div>
        </section>

        <section v-else class="faq-section" key="faq">
          <div class="section-title">
            <h3>考前高频问题集</h3>
            <p class="subtitle">提问 7 天内支持修改或撤回，数据同步至教师端</p>
          </div>

          <div class="ask-input-group">
            <input v-model="newQuestion" placeholder="在此输入你的 OS 相关疑问..." @keyup.enter="submitNewQuestion">
            <button @click="submitNewQuestion" class="ask-btn">发起提问</button>
          </div>

          <div class="faq-grid">
            <div v-for="faq in dynamicFaqList" :key="faq.id" class="faq-card" :class="{ 'is-student': faq.isStudent }">
              <div class="faq-header">
                <span class="faq-tag">{{ faq.isStudent ? '我的提问' : '热点点击' }}</span>
                <div v-if="faq.isStudent" class="faq-actions">
                  <button @click="editQuestion(faq)" class="act-btn edit">🖊️</button>
                  <button @click="deleteQuestion(faq.id)" class="act-btn del">🗑️</button>
                </div>
              </div>
              <h4>{{ faq.question }}</h4>
              <p class="faq-ans">{{ faq.answer }}</p>
              <div class="faq-footer">
                <span class="hot-val">🔥 热度: {{ faq.hot }}</span>
                <span v-if="faq.isStudent" class="time-limit">记录时间: {{ new Date().toLocaleDateString('zh-CN') }}</span>
              </div>
            </div>
          </div>
        </section>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios'; // 导入 axios

// 配置后端基础地址
const API_BASE = 'http://127.0.0.1:33001/api/user';

const activeTab = ref('efficacy');
const progress = ref(0);
const newQuestion = ref('');
const studentQuestions = ref([]);
const systemHotTopics = ref([]);

// 模拟当前登录的学生ID (实际开发中应从登录系统获取)
const currentStudentId = 'STUD001'; 

// 初始化：从后端数据库读取所有数据
onMounted(async () => {
  try {
    // 1. 获取所有问题列表 (包含学生提问和热点)
    const res = await axios.get(`${API_BASE}/getQuestions`);
    if (res.data.code === 0) {
      // 后端返回的数据已带 isStudent 标识
      const allData = res.data.data;
      studentQuestions.value = allData.filter(item => item.isStudent === 1);
      systemHotTopics.value = allData.filter(item => item.isStudent === 0);
    }
  } catch (error) {
    console.error("初始化失败，请检查后端是否开启:", error);
  }
});

// 提交新提问：彻底废弃 localStorage，直接入库
const submitNewQuestion = async () => {
  if (!newQuestion.value.trim()) return;
  
  try {
    const res = await axios.post(`${API_BASE}/addQuestion`, {
      studentId: currentStudentId,
      content: newQuestion.value
    });
    
    if (res.data.code === 0) {
      // 关键：无论后端是新增还是加热度，都重新拉取数据刷新界面
      const refreshRes = await axios.get(`${API_BASE}/getQuestions`);
      if (refreshRes.data.code === 0) {
        const allData = refreshRes.data.data;
        studentQuestions.value = allData.filter(item => item.isStudent === 1);
        systemHotTopics.value = allData.filter(item => item.isStudent === 0);
      }
      newQuestion.value = ''; // 清空输入框
    }
  } catch (error) {
    alert("同步失败");
  }
};

// 物理删除：调用后端 DELETE 接口，实现“彻底消失”
const deleteQuestion = async (id) => {
  if (!confirm("确定要永久删除这个问题吗？数据将从服务器同步抹除。")) return;
  
  try {
    // 根据是学生提问还是系统热点传递 type (对应你 userController 的逻辑)
    const res = await axios.delete(`${API_BASE}/deleteQuestion`, {
      params: { id: id, type: 'question' }
    });
    
    if (res.data.code === 0) {
      // 过滤掉本地显示的这一行
      studentQuestions.value = studentQuestions.value.filter(q => q.id !== id);
    }
  } catch (error) {
    alert("删除操作失败");
  }
};

// 保存效能感测评：计算后同步至后端
const saveEfficacy = async () => {
  try {
    const res = await axios.post(`${API_BASE}/submitEfficacy`, {
      studentId: currentStudentId,
      q1: effAnswers.value[0], q2: effAnswers.value[1], q3: effAnswers.value[2],
      q4: effAnswers.value[3], q5: effAnswers.value[4], q6: effAnswers.value[5],
      q7: effAnswers.value[6], q8: effAnswers.value[7], q9: effAnswers.value[8]
    });
    if (res.data.code === 0) {
      // 新增计算逻辑：
      const sum = effAnswers.value.reduce((a, b) => a + Number(b), 0);
      progress.value = Math.round((sum / 45) * 100); 

      alert("掌握度数据已同步至服务器存档。");
    }
  } catch (error) {
    alert("保存失败");
  }
};

// 提交 SUS 评价
const calculateSUS = async () => {
  let total = 0;
  susAnswers.value.forEach((v, i) => {
    total += ((i + 1) % 2 !== 0) ? (v - 1) : (5 - v);
  });
  const score = total * 2.5;

  try {
    await axios.post(`${API_BASE}/submitSus`, {
      studentId: currentStudentId,
      susScore: score,
      rawAnswers: susAnswers.value
    });
    alert(`系统评价已提交，得分: ${score}，感谢反馈！`);
  } catch (error) {
    alert("评价提交失败");
  }
};

// 计算属性：自动合并并过滤脏数据
const dynamicFaqList = computed(() => {
  // 增加强力过滤，防止顽固的“问题1”再次出现
  return [...studentQuestions.value, ...systemHotTopics.value]
    .filter(item => item.question !== ' ' && item.question.trim() !== '')
    .sort((a, b) => (b.hot || 0) - (a.hot || 0));
});

const canModify = (timestamp) => {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return (Date.now() - timestamp) < sevenDaysInMs;
};

const getExpiryDate = (timestamp) => {
  return new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
};

const editQuestion = async (faq) => {
  const updated = prompt("修改你的问题：", faq.question);
  if (updated && updated.trim()) {
    try {
      // 这里的 API 路径必须对应你后端 controller 定义的更新接口
      const res = await axios.put(`${API_BASE}/updateQuestion`, {
        id: faq.id,      // 数据库中的自增 ID
        content: updated // 修改后的内容
      });

      if (res.data.code === 0) {
        // 成功后重新拉取数据，确保界面和数据库完全一致
        const refreshRes = await axios.get(`${API_BASE}/getQuestions`);
        const allData = refreshRes.data.data;
        studentQuestions.value = allData.filter(item => item.isStudent === 1);
        alert("问题已成功同步至数据库");
      }
    } catch (error) {
      console.error("修改失败:", error);
      alert("同步修改到服务器失败，请检查网络");
    }
  }
};

// 初始化 effAnswers 和 susAnswers
const effAnswers = ref([0, 0, 0, 0, 0, 0, 0, 0, 0]);
const susAnswers = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

const efficacyItems = [
  "我认为学完这套系统的内容后，能够自主完成 OS 作业。",
  "遇到操作系统问题时，我有信心通过系统提供的学习资料自行解决。",
  "我认为自己的 OS 理论基础已达到可上手项目的水平。",
  "使用本系统学习让我对 OS 核心概念的理解更深入。",
  "我相信通过继续学习本系统内容，能够提升我的编程实战能力。",
  "本系统的 AI 反馈帮助我找到了学习中的薄弱环节。",
  "我对自己在考试中的表现有信心。",
  "我认为本系统的教学方式适合我的学习风格。",
  "学完后我会主动应用所学知识到实际项目中。"
];

const susItems = [
  "我觉得经常会使用这个系统。",
  "我觉得这个系统不必要地复杂。",
  "我觉得这个系统很容易使用。",
  "我觉得需要技术支持人员的帮助才能使用这个系统。",
  "我觉得这个系统中各种功能配合得很好。",
  "我觉得这个系统中有很多不一致的地方。",
  "我想大多数人会很快学会使用这个系统。",
  "我觉得这个系统用起来很笨重。",
  "使用这个系统时我感到很自信。",
  "我需要学习很多东西才能开始使用这个系统。"
];
</script>

<style scoped>
/* -----------------------------------------------------------
   1. 基础重置 & 全局氛围
----------------------------------------------------------- */
.dashboard-container { 
  display: flex; 
  height: 100vh; 
  background: #020617; 
  color: #e2e8f0; 
  font-family: 'Inter', system-ui, sans-serif; 
}

/* -----------------------------------------------------------
   2. 侧边栏
----------------------------------------------------------- */
.stats-sidebar { 
  width: 320px; 
  background: rgba(15, 23, 42, 0.4); 
  backdrop-filter: blur(20px); 
  padding: 40px 24px; 
  border-right: 1px solid rgba(255, 255, 255, 0.05); 
}

.sidebar-header { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
.sidebar-header h2 { 
  font-size: 1.4rem; 
  font-weight: 800; 
  background: white;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 8px rgba(255, 105, 180, 0.3));
}

.progress-card { 
  background: rgba(0, 0, 0, 0.3); 
  border-radius: 16px; 
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 24px; 
  margin-bottom: 30px; 
}

.percent { 
  font-size: 1.8rem; 
  font-weight: 900; 
  color: #3b82f6; 
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.progress-bar { 
  height: 8px; 
  background: rgba(255, 255, 255, 0.05); 
  border-radius: 4px; 
  margin: 12px 0; 
  overflow: hidden; 
}
.fill { 
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
  background-size: 200% auto;
  height: 100%; 
  animation: bar-glow 2s linear infinite;
}
@keyframes bar-glow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.nav-menu { display: flex; flex-direction: column; gap: 12px; }
.nav-menu button { 
  display: flex; align-items: center; gap: 12px; padding: 16px; 
  background: rgba(255, 255, 255, 0.02); border: 1px solid transparent; 
  border-radius: 12px; color: #94a3b8; font-weight: 600; cursor: pointer; 
  transition: all 0.3s ease; 
}
.nav-menu button.active { 
  background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; color: white; 
}

/* -----------------------------------------------------------
   3. 内容区域
----------------------------------------------------------- */
.content-area { flex: 1; padding: 50px; padding-bottom: 120px; overflow-y: auto; }

/* -----------------------------------------------------------
   4. 学业自我效能评价 (对齐数字 + 去圈 + 蓝粉紫行交替)
----------------------------------------------------------- */
.likert-table { background: rgba(15, 23, 42, 0.3); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }

.likert-header { 
  display: flex; 
  justify-content: space-between; 
  padding: 20px 30px; 
  background: rgba(255, 255, 255, 0.02); 
  color: #3b82f6;
}

/* 文字对齐数字的核心设置 */
.options-legend { 
  display: flex; 
  justify-content: space-between; 
  width: 210px; /* 精确匹配选项区域宽度 */
  margin-right: 5px; 
}
.options-legend span { color: #8b949e; font-size: 0.85rem; }

.likert-row { display: flex; justify-content: space-between; align-items: center; padding: 24px 30px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.likert-q { flex: 1; font-size: 1rem; color: #f1f5f9; }
.likert-options { display: flex; gap: 5px; width: 210px; justify-content: space-between; }

.likert-item input { display: none; }

/* 去掉圆圈，仅保留数字本身 */
.likert-circle { 
  width: 38px; height: 38px; 
  display: flex; align-items: center; justify-content: center; 
  cursor: pointer; 
  font-size: 1.2rem;
  font-weight: 500;
  color: #4b5563; /* 默认未选中的颜色 */
  transition: all 0.3s ease;
}

/* --- 蓝粉紫行交替逻辑 (学业效能) --- */
/* 1, 4, 7...行：蓝色 */
.likert-row:nth-of-type(3n+1) input:checked + .likert-circle { color: #3b82f6; text-shadow: 0 0 12px rgba(59, 130, 246, 0.8); font-weight: 800; transform: scale(1.2); }
/* 2, 5, 8...行：粉色 */
.likert-row:nth-of-type(3n+2) input:checked + .likert-circle { color: #f472b6; text-shadow: 0 0 12px rgba(244, 114, 182, 0.8); font-weight: 800; transform: scale(1.2); }
/* 3, 6, 9...行：紫色 */
.likert-row:nth-of-type(3n) input:checked + .likert-circle { color: #a78bfa; text-shadow: 0 0 12px rgba(167, 139, 250, 0.8); font-weight: 800; transform: scale(1.2); }

/* -----------------------------------------------------------
   5. 系统可用性评价 (SUS) (文字白色 + 去圈 + 蓝粉紫行交替)
----------------------------------------------------------- */
.sus-card { 
  background: rgba(15, 23, 42, 0.3); padding: 24px; border-radius: 16px; 
  display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 15px;
}

/* 文字白色 */
.sus-q-text { flex: 1; font-size: 1rem; color: #ffffff; font-weight: 500; }
.sus-options { display: flex; gap: 10px; }
.sus-opt-label input { display: none; }

/* 去掉圆圈 */
.sus-dot { 
  width: 35px; height: 35px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; 
  font-size: 1.1rem;
  color: #4b5563;
  transition: all 0.3s ease;
}

/* --- 蓝粉紫行交替逻辑 (SUS) --- */
/* 1, 4, 7...行：蓝色 */
.sus-card:nth-of-type(3n+1) input:checked + .sus-dot { color: #3b82f6; text-shadow: 0 0 12px rgba(59, 130, 246, 0.8); font-weight: 800; transform: scale(1.2); }
/* 2, 5, 8...行：粉色 */
.sus-card:nth-of-type(3n+2) input:checked + .sus-dot { color: #f472b6; text-shadow: 0 0 12px rgba(244, 114, 182, 0.8); font-weight: 800; transform: scale(1.2); }
/* 3, 6, 9...行：紫色 */
.sus-card:nth-of-type(3n) input:checked + .sus-dot { color: #a78bfa; text-shadow: 0 0 12px rgba(167, 139, 250, 0.8); font-weight: 800; transform: scale(1.2); }

/* -----------------------------------------------------------
   6. 提问按钮动画效果
----------------------------------------------------------- */
.ask-input-group { display: flex; gap: 15px; margin-bottom: 30px; }
.ask-input-group input { 
  flex: 1; background: rgba(15, 23, 42, 0.3); border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px; padding: 18px; color: white; 
}

.ask-btn { 
  background: linear-gradient(135deg, #3b82f6 0%, #f472b6 50%, #a78bfa 100%);
  background-size: 200% auto;
  color: white; border: none; padding: 0 30px; 
  border-radius: 12px; font-weight: bold; cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

/* 按钮持续流光动画 */
.ask-btn { animation: gradientSweep 3s infinite linear; }
@keyframes gradientSweep {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* 按钮点击时的微震动或缩放效果 */
.ask-btn:active {
  transform: scale(0.95);
  filter: brightness(1.2);
}

/* 鼠标悬浮时的发光增强 */
.ask-btn:hover {
  box-shadow: 0 0 20px rgba(244, 114, 182, 0.4);
  transform: translateY(-2px);
}

/* -----------------------------------------------------------
   7. FAQ 卡片 (保持原样)
----------------------------------------------------------- */
.faq-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 25px; }
.faq-card { 
  background: rgba(0, 0, 0, 0.3); padding: 24px; border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease; position: relative;
}
.faq-card.is-student { border-left: 5px solid #3b82f6; background: rgba(59, 130, 246, 0.1); }
.faq-ans { color: #94a3b8; font-size: 0.9rem; margin-top: 10px; }

/* -----------------------------------------------------------
   8. 底部保存按钮
----------------------------------------------------------- */
.action-footer { margin-top: 40px; margin-bottom: 60px; display: flex; justify-content: flex-end; }
.save-btn { 
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white; border: none; padding: 18px 40px; border-radius: 12px; 
  font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: 0.3s;
}
.save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(124, 58, 237, 0.5); }
</style>