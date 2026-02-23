<template>
  <div class="profile-scroll-page">
    <div class="profile-glass-card animate__animated animate__fadeIn">
      
      <div class="profile-header">
        <div class="neon-avatar-frame">
          <div class="avatar-content">{{ username.charAt(0).toUpperCase() }}</div>
        </div>
        <div class="user-meta">
          <h2 class="user-name">{{ username }}</h2>
          <div class="tag-row">
            <span class="cyber-tag tag-purple">UID: {{ userId }}</span>
            <span class="cyber-tag tag-blue">{{ userData.role === 'teacher' ? '认证教师' : '学籍成员' }}</span>
          </div>
        </div>
      </div>

      <div class="email-display-hero">
        <div class="hero-label">CURRENT BINDING</div>
        <div class="hero-value">{{ email }}</div>
      </div>

      <div class="settings-container">
        
        <section class="config-section">
          <h3 class="section-title"><i class="icon">📧</i> 账号邮箱安全</h3>
          <div class="input-group">
            <input v-model="emailForm.newEmail" type="email" placeholder="输入新邮箱地址" class="neon-input" />
            <input v-model="emailForm.password" type="password" placeholder="验证当前密码" class="neon-input" />
            
            <button @click="handleUpdateEmail" :disabled="loading" class="btn-gradient btn-blue-gradient">
              <span class="btn-text">确认更新邮箱</span>
              <div class="btn-reflection"></div>
            </button>
          </div>
        </section>

        <section class="config-section">
          <h3 class="section-title"><i class="icon">🔒</i> 安全密钥保护</h3>
          <div class="input-group">
            <input v-model="passwordForm.oldPassword" type="password" placeholder="原始密码" class="neon-input" />
            <div class="split-inputs">
              <input v-model="passwordForm.newPassword" type="password" placeholder="设置新密码" class="neon-input" />
              <input v-model="passwordForm.confirmPassword" type="password" placeholder="重复新密码" class="neon-input" />
            </div>
            
            <button @click="handleUpdatePassword" :disabled="loading" class="btn-gradient btn-purple-gradient">
              <span class="btn-text">确认修改密码</span>
              <div class="btn-reflection"></div>
            </button>
          </div>
        </section>

      </div>
      <div class="safe-area"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import axios from 'axios';

// 从 localStorage 加载初始数据
const userData = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const userId = computed(() => userData.value.id);
const username = computed(() => userData.value.username || 'User');
const email = computed(() => userData.value.email || '未绑定');

const loading = ref(false);

const emailForm = reactive({
    newEmail: '',
    password: ''
});

const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

// 配置 Axios 拦截器或直接带 Token
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// 修改邮箱逻辑
const handleUpdateEmail = async () => {
    if (!emailForm.newEmail || !emailForm.password) return alert('请填写完整信息');
    
    loading.value = true;
    try {
        const res = await axios.post('/api/auth/update-email', emailForm, getAuthHeader());
        if (res.data.code === 0) {
        alert('邮箱修改成功！');
        // 1. 获取旧的 user 对象
        let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // 2. 更新邮箱字段
        currentUser.email = emailForm.newEmail;
        
        // 3. 写回 localStorage
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // 4. 同步更新当前页面的响应式数据 (重要)
        userData.value = currentUser; 

        // 5. 清空表单
        emailForm.newEmail = '';
        } else {
        alert(res.data.msg);
        }
    } catch (err) {
        alert('请求失败，请检查网络');
    } finally {
        loading.value = false;
    }
};

// 修改密码逻辑
const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        return alert('两次输入的新密码不一致');
    }
    
    loading.value = true;
    try {
        const res = await axios.post('/api/auth/update-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
        }, getAuthHeader());

        if (res.data.code === 0) {
        alert('密码修改成功，请重新登录！');
        // 密码修改后通常需要强制重新登录
        localStorage.clear();
        window.location.href = '/login';
        } else {
        alert(res.data.msg);
        }
    } catch (err) {
        alert('服务器异常');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* 滑动与基础布局 */
.profile-scroll-page {
  width: 100%;
  height: 100vh;
  overflow-y: auto; /* 确保可滑动 */
  background: #080a0f;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  box-sizing: border-box;
}

.profile-glass-card {
  width: 100%;
  max-width: 620px;
  height: fit-content;
  background: rgba(17, 25, 40, 0.8);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  padding: 45px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
}

/* 头部样式 */
.neon-avatar-frame {
  padding: 3px;
  background: linear-gradient(135deg, #00d2ff, #92fe9d);
  border-radius: 22px;
  display: inline-block;
}
.avatar-content {
  width: 64px; height: 64px; background: #080a0f;
  border-radius: 20px; display: flex; align-items: center;
  justify-content: center; font-size: 30px; font-weight: 900; color: #fff;
}
.profile-header { display: flex; align-items: center; gap: 24px; margin-bottom: 40px; }
.user-name { font-size: 28px; color: #fff; margin: 0; letter-spacing: -0.5px; }
.tag-row { display: flex; gap: 10px; margin-top: 8px; }
.cyber-tag { padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.tag-blue { background: rgba(0, 210, 255, 0.1); color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.2); }
.tag-purple { background: rgba(146, 100, 255, 0.1); color: #9d70ff; border: 1px solid rgba(146, 100, 255, 0.2); }

/* 邮箱英雄区 */
.email-display-hero {
  background: linear-gradient(to right, rgba(255,255,255,0.03), transparent);
  padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 40px; text-align: center;
}
.hero-label { font-size: 11px; color: #64748b; letter-spacing: 2px; }
.hero-value { font-size: 26px; font-weight: 800; color: #fff; margin-top: 8px; word-break: break-all; }

/* 输入框样式 */
.section-title { color: #94a3b8; font-size: 16px; margin-bottom: 20px; }
.input-group { display: flex; flex-direction: column; gap: 16px; }
.neon-input {
  background: #0f172a; border: 1px solid #1e293b; padding: 16px;
  border-radius: 14px; color: #fff; font-size: 15px; transition: 0.3s;
}
.neon-input:focus { border-color: #3b82f6; outline: none; background: rgba(59, 130, 246, 0.05); box-shadow: 0 0 20px rgba(59,130,246,0.15); }
.split-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* --- 渐变按钮核心样式 --- */
.btn-gradient {
  position: relative;
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  border: none;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: white;
}

/* 蓝渐变 (更新邮箱) */
.btn-blue-gradient {
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  box-shadow: 0 10px 25px rgba(0, 210, 255, 0.3);
}

/* 紫渐变 (修改密码) */
.btn-purple-gradient {
  background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%);
  box-shadow: 0 10px 25px rgba(142, 45, 226, 0.3);
}

.btn-gradient:hover {
  transform: translateY(-4px);
  filter: brightness(1.15);
}

.btn-blue-gradient:hover { box-shadow: 0 15px 35px rgba(0, 210, 255, 0.5); }
.btn-purple-gradient:hover { box-shadow: 0 15px 35px rgba(142, 45, 226, 0.5); }

.btn-reflection {
  position: absolute;
  top: -50%; left: -100%; width: 50%; height: 200%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
  transform: rotate(45deg);
  transition: 0.6s;
}

.btn-gradient:hover .btn-reflection { left: 150%; }

.safe-area { height: 30px; }
</style>