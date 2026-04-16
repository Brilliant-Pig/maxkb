<template>
  <div id="app">
    <div class="particles-bg"></div>

    <nav v-if="showNav" class="main-nav animate__animated animate__fadeInDown">
      <div class="nav-logo">SMART BRAIN-AI 闲趣智脑</div>
      
      <div class="nav-links">
        <router-link to="/ImmersiveLab" class="nav-link" data-text="AI实验室"></router-link>
        <router-link to="/HomeworkAssistant" class="nav-link" data-text="作业助手"></router-link>
        <router-link to="/LearningDashboard" class="nav-link" data-text="学业评价"></router-link>
        <router-link 
          v-if="isLoggedIn && userRole === 'teacher'" 
          to="/TeacherConsole" 
          class="nav-link" 
          data-text="教师后台"
        ></router-link>
        
        <UserAvatar v-if="isLoggedIn" />
      </div>
    </nav>
    
    <div class="view-container">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <footer v-if="showNav" class="app-footer">
      <div class="footer-content">
        <span>当前环境: 实验室私有云 (RTX 4060)</span>
        <span class="divider">|</span>
        <span>推理引擎: Ollama / Qwen2</span>
        <span class="divider">|</span>
        <span class="security-tag">🛡️ 数据不出校 · 安全加密中</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
// ✨ 1. 补全所有缺失的 Vue API 引入
import { ref, onMounted, watch } from 'vue'; 
import { useRoute } from 'vue-router';
// ✨ 2. 引入头像组件
import UserAvatar from './components/UserDropdown.vue';

const route = useRoute();
const showNav = ref(true);
const isLoggedIn = ref(false); // 是否已登录
const userRole = ref('');      // 用户角色

/**
 * ✨ 核心逻辑：从本地存储更新权限状态
 */
const updateAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    // 确保 token 和 user 字符串都存在，且不是错误的 "undefined" 字符串
    if (token && userStr && userStr !== 'undefined') {
      const user = JSON.parse(userStr);
      isLoggedIn.value = true;
      userRole.value = user.role || '';
    } else {
      isLoggedIn.value = false;
      userRole.value = '';
    }
  } catch (e) {
    console.error("解析用户信息失败", e);
    isLoggedIn.value = false;
  }
};

// 页面加载时初始化一次
onMounted(() => {
  updateAuthState();
});

/**
 * ✨ 监听路由变化
 * 1. 控制导航栏在登录页隐藏
 * 2. 每次切换页面时重新校验登录状态，确保右上角实时同步
 */
watch(() => route.path, (newPath) => {
  // 判断是否处于登录/注册页面
  showNav.value = !['/login', '/Auth'].includes(newPath);
  
  // 刷新登录状态
  updateAuthState();
});
</script>

<style>
/* --- 1. 基础重置与背景 --- */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  background: #0a0e14; 
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  color: #e0e0e0;
}

/* --- 2. 导航栏容器 --- */
.main-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 64px;
  background: rgba(10, 14, 20, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 100;
}

/* ✨ Logo：流光渐变效果 --- 会自动变换颜色 */
.nav-logo {
  font-size: 1.4rem;
  font-weight: 800;
  /* 增加渐变尺寸以实现移动效果 */
  background: linear-gradient(
    135deg, 
    #409eff, 
    #ff69b4, 
    #8b5cf6, 
    #409eff
  );
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 8px rgba(255, 105, 180, 0.3));
  animation: flowGradient 6s ease infinite; /* 颜色变换动画 */
}

@keyframes flowGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.nav-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

/* --- 3. 导航链接：彻底干掉默认蓝色 --- */
/* 使用 a.nav-link 提高优先级，确保覆盖所有浏览器的默认 link 颜色 */
a.nav-link {
  text-decoration: none !important;
  position: relative;
  display: block;
  height: 24px;
  line-height: 24px;
  overflow: hidden;
  /* 初始颜色强制设为淡灰色 */
  color: rgba(255, 255, 255, 0.6) !important; 
  font-size: 1rem;
  font-weight: 500;
  transition: color 0.3s;
}

/* 移除所有伪元素内容，通过 data-text 渲染 */
a.nav-link::before,
a.nav-link::after {
  content: attr(data-text); 
  display: block;
  width: 100%;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.6, 0, 0.2, 1);
}

/* 候场文字颜色：统一改为白色或主题色 */
a.nav-link::after {
  position: absolute;
  left: 0;
  top: 100%; 
  color: #ffffff !important; /* 滚动出来的字默认先给白色 */
}

/* 悬浮 & 激活状态：隐藏原文字，露出滚动后的伪元素 */
a.nav-link:hover,
a.nav-link.router-link-active {
  color: transparent !important; 
}

a.nav-link:hover::before,
a.nav-link.router-link-active::before {
  transform: translateY(-100%);
}

a.nav-link:hover::after,
a.nav-link.router-link-active::after {
  transform: translateY(-100%);
}

/* --- 4. 统一按钮特定高亮色 (优先级加满) --- */

/* AI实验室 - 蓝色 */
a.nav-link[to="/ImmersiveLab"]:hover::after,
a.nav-link[to="/ImmersiveLab"].router-link-active::after {
  color: #409eff !important;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.6);
}

/* 作业助手 - 粉色 */
a.nav-link[to="/HomeworkAssistant"]:hover::after,
a.nav-link[to="/HomeworkAssistant"].router-link-active::after {
  color: #ff69b4 !important;
  text-shadow: 0 0 10px rgba(255, 105, 180, 0.6);
}

/* 学业评价 - 紫色 */
a.nav-link[to="/LearningDashboard"]:hover::after,
a.nav-link[to="/LearningDashboard"].router-link-active::after {
  color: #8b5cf6 !important;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
}

/* 教师后台 - 金色 */
a.nav-link[to="/TeacherConsole"]:hover::after,
a.nav-link[to="/TeacherConsole"].router-link-active::after {
  color: #ffda6a !important;
  text-shadow: 0 0 10px rgba(255, 218, 106, 0.5);
}

/* --- 5. 其他组件样式 --- */
.view-container { flex: 1; overflow: hidden; position: relative; }
.app-footer { height: 32px; background: rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: #606266; }
.divider { margin: 0 15px; opacity: 0.3; }
.security-tag { color: #67c23a; }

/* 页面过渡动画 */
.fade-transform-enter-active, .fade-transform-leave-active { transition: all 0.4s ease; }
.fade-transform-enter-from { opacity: 0; transform: translateX(-30px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(30px); }
</style>