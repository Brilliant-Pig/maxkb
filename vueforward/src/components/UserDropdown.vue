<template>
  <div class="user-profile-container" ref="dropdownRef">
    <div class="avatar-trigger" @click="toggleDropdown">
      <div class="avatar-circle">
        {{ username.charAt(0).toUpperCase() }}
      </div>
      <span class="user-name-display">{{ username }}</span>
      <span class="material-icons"></span>
    </div>

    <transition name="github-fade">
      <div v-if="isOpen" class="profile-dropdown">
        <div class="user-header">
          <p class="signed-in-as">当前登录邮箱</p>
          <p class="user-email">{{ email }}</p>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <div class="user-status">
          <span class="status-dot" :class="role"></span>
          {{ role === 'teacher' ? '教师权限' : '学生用户' }}
        </div>

        <div class="dropdown-divider"></div>

        <div class="menu-links">
          <a @click="handleProfile">个人设置</a>
          <a @click="handleHelp">获取帮助</a>
          <div class="dropdown-divider"></div>
          <a @click="handleLogout" class="logout-btn">退出登录</a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isOpen = ref(false);
const dropdownRef = ref(null);

// ✨ 核心逻辑：从 localStorage 获取完整的用户信息
const userData = ref(JSON.parse(localStorage.getItem('user') || '{}'));

// 使用 computed 保证响应式
const username = computed(() => userData.value.username || '未登录');
// ✨ 新增：获取邮箱
const email = ref(userData.value.email || '未绑定邮箱');
const role = computed(() => userData.value.role || 'user');

// 封装一个获取数据的函数
const updateLocalInfo = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  username.value = user.username || 'User';
  role.value = user.role || 'student';
  email.value = user.email || '未绑定';
};
// 监听下拉框打开动作，每次打开时都重新读一下缓存
const toggleDropdown = () => {
  if (!isOpen.value) {
    updateLocalInfo(); // 打开瞬间同步最新数据
  }
  isOpen.value = !isOpen.value;
};

onMounted(() => {
  updateLocalInfo();
});

// 处理退出登录
const handleLogout = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // 1. 通知后端作废 Token
      await axios.post('http://127.0.0.1:33001/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.error('登出接口调用失败:', error);
  } finally {
    // 2. 无论后端是否成功，前端必须清空
    localStorage.clear();
    isOpen.value = false;
    // 3. 强制跳转到登录页
    window.location.href = '/login'; 
  }
};

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 模拟跳转
const handleProfile = () => {
  isOpen.value = false;
  router.push('/profile');
};
const handleHelp = () => { alert('请联系系统管理员'); isOpen.value = false; };
</script>

<style scoped>
.avatar-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.avatar-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-name-display {
  color: #c9d1d9;
  font-size: 14px;
  font-weight: 500;
}

.user-email {
  font-size: 14px;
  color: #c9d1d9;
  font-weight: 600;
  margin: 4px 0 0 0;
  /* 防止邮箱过长撑破布局 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-profile-container { position: relative; display: inline-block; }

.avatar-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: 0.2s;
}
.avatar-trigger:hover { background: rgba(255,255,255,0.1); }

.avatar-circle {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.2);
}

.profile-dropdown {
  position: absolute;
  top: 45px;
  right: 0;
  width: 200px;
  background: #161b22; /* GitHub 深色背景 */
  border: 1px solid #30363d;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 1000;
  padding: 8px 0;
}

.user-header { padding: 8px 16px; }
.signed-in-as { font-size: 12px; color: #8b949e; margin: 0; }
.user-name { font-size: 14px; color: #c9d1d9; font-weight: 600; margin: 4px 0 0 0; }

.user-status {
  padding: 8px 16px;
  font-size: 13px;
  color: #c9d1d9;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.teacher { background: #238636; box-shadow: 0 0 8px #238636; }
.status-dot.student { background: #388bfd; }

.dropdown-divider { height: 1px; background: #30363d; margin: 8px 0; }

.menu-links a {
  display: block;
  padding: 6px 16px;
  font-size: 14px;
  color: #c9d1d9;
  cursor: pointer;
  text-decoration: none;
}
.menu-links a:hover { background: #1f6feb; color: white; }
.logout-btn:hover { background: #da3633 !important; }

/* 动画 */
.github-fade-enter-active, .github-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.github-fade-enter-from, .github-fade-leave-to { opacity: 0; transform: translateY(-10px); }

.status-dot.teacher { background: #8b5cf6; } /* 老师用紫色点 */
.status-dot.student { background: #2ea44f; } /* 学生用绿色点 */
</style>