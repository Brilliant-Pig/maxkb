<template>
  <div class="profile-scroll-page">
    <div class="profile-glass-card">
      
      <div class="profile-header">
        <div 
          class="neon-avatar-frame" 
          @click="triggerFileUpload"
          title="点击上传新头像"
        >
          <div class="avatar-content">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="uploaded-avatar" />
            <span v-else>{{ username.charAt(0).toUpperCase() }}</span>
            
            <div class="avatar-edit-overlay">
              <i class="icon-upload">📷</i>
            </div>
          </div>
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            accept="image/*"
            @change="handleFileChange"
          />
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
            
            <button @click="handleUpdateEmail" :disabled="loading" class="btn-gradient">
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
            
            <button @click="handleUpdatePassword" :disabled="loading" class="btn-gradient">
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
import { ElMessage } from 'element-plus';
import 'element-plus/es/components/message/style/css';

const userData = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const userId = computed(() => userData.value.id || 'N/A');
const username = computed(() => userData.value.username || 'User');
const email = computed(() => userData.value.email || '未绑定');
const avatarUrl = ref(userData.value.avatar || '');

const loading = ref(false);
const fileInput = ref(null);

const emailForm = reactive({ newEmail: '', password: '' });
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

const toast = {
  success: (msg) => ElMessage({ message: msg, type: 'success', plain: true, customClass: 'cyber-message' }),
  error: (msg) => ElMessage({ message: msg, type: 'error', plain: true, customClass: 'cyber-message' }),
  warning: (msg) => ElMessage({ message: msg, type: 'warning', plain: true, customClass: 'cyber-message' })
};

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const triggerFileUpload = () => fileInput.value.click();
const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size / 1024 / 1024 > 2) return toast.warning('图片不能超过2MB');
  const reader = new FileReader();
  reader.onload = (event) => { avatarUrl.value = event.target.result; };
  reader.readAsDataURL(file);
  await uploadAvatar(file);
};

const uploadAvatar = async (file) => {
  loading.value = true;
  const formData = new FormData();
  formData.append('avatar', file);
  try {
    const res = await axios.post('/api/user/upload-avatar', formData, {
      headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.code === 0) {
      toast.success('头像已同步至云端');
      updateLocalStorage('avatar', res.data.data.url);
    }
  } catch { toast.error('上传失败'); }
  finally { loading.value = false; }
};

const handleUpdateEmail = async () => {
  if (!emailForm.newEmail || !emailForm.password) return toast.warning('请补全邮箱信息');
  loading.value = true;
  try {
    const res = await axios.post('/api/auth/update-email', emailForm, getAuthHeader());
    if (res.data.code === 0) {
      toast.success('邮箱绑定已更新');
      updateLocalStorage('email', emailForm.newEmail);
      emailForm.newEmail = ''; emailForm.password = '';
    } else { toast.error(res.data.msg); }
  } catch { toast.error('网络请求失败'); }
  finally { loading.value = false; }
};

const handleUpdatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.warning('两次密码不一致');
  loading.value = true;
  try {
    const res = await axios.post('/api/auth/update-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    }, getAuthHeader());
    if (res.data.code === 0) {
      toast.success('密码已修改，请重新登录');
      setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 1500);
    } else { toast.error(res.data.msg); }
  } catch { toast.error('服务器异常'); }
  finally { loading.value = false; }
};

const updateLocalStorage = (key, value) => {
  let user = JSON.parse(localStorage.getItem('user') || '{}');
  user[key] = value;
  localStorage.setItem('user', JSON.stringify(user));
  userData.value = user;
};
</script>

<style scoped>
/* 1. 基础布局 */
.profile-scroll-page {
  width: 100%; height: 100vh; overflow-y: auto; background: #080a0f;
  display: flex; justify-content: center; padding: 40px 20px; box-sizing: border-box;
}
.profile-glass-card {
  width: 100%; max-width: 620px; height: fit-content;
  background: rgba(17, 25, 40, 0.8); backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px;
  padding: 45px; box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
}

/* 2. 头像区域 */
.neon-avatar-frame {
  padding: 3px; 
  background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%);
  border-radius: 22px; cursor: pointer; transition: 0.3s;
}
.neon-avatar-frame:hover { transform: scale(1.05); }
.avatar-content {
  width: 64px; height: 64px; background: #080a0f; border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; font-weight: 900; color: #fff; position: relative; overflow: hidden;
}
.uploaded-avatar { width: 100%; height: 100%; object-fit: cover; }
.avatar-edit-overlay {
  position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s;
}
.neon-avatar-frame:hover .avatar-edit-overlay { opacity: 1; }

/* 3. 文本展示区 */
.profile-header { display: flex; align-items: center; gap: 24px; margin-bottom: 40px; }
.user-name { font-size: 28px; color: #fff; margin: 0; }
.tag-row { display: flex; gap: 10px; margin-top: 8px; }
.cyber-tag { padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.tag-blue { background: rgba(0,210,255,0.1); color: #00d2ff; border: 1px solid rgba(0,210,255,0.2); }
.tag-purple { background: rgba(146,100,255,0.1); color: #9d70ff; border: 1px solid rgba(146,100,255,0.2); }

.email-display-hero {
  background: linear-gradient(to right, rgba(255,255,255,0.03), transparent);
  padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 40px; text-align: center;
}
.hero-label { font-size: 11px; color: #64748b; letter-spacing: 2px; }
.hero-value { 
  font-size: 26px; font-weight: 800; color: #ffffff !important; 
  margin-top: 8px; word-break: break-all;
}

/* 4. 输入框修正：确保文字清晰可见 */
.section-title { color: #94a3b8; font-size: 16px; margin-bottom: 20px; }
.input-group { display: flex; flex-direction: column; gap: 16px; }
.neon-input {
  background: #0f172a; border: 1px solid #1e293b; padding: 16px;
  border-radius: 14px; font-size: 15px; transition: 0.3s;
  
  /* 基础状态使用纯白文字，解决看不清的问题 */
  color: #ffffff !important; 
  caret-color: #ffffff;
  font-weight: 500;
}

.neon-input:focus {
  border-color: #8e2de2; outline: none; background-color: rgba(142, 45, 226, 0.05);
  box-shadow: 0 0 20px rgba(142, 45, 226, 0.15);
  
  /* 获焦时启用流光特效 */
  background-image: linear-gradient(90deg, #ffffff, #f093fb, #ffffff);
  background-size: 200% auto; 
  -webkit-background-clip: text; 
  background-clip: text;
  color: transparent !important; 
  animation: textShine 3s linear infinite;
}

@keyframes textShine { to { background-position: 200% center; } }

.neon-input::placeholder { color: #475569; }
.split-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* 5. 按钮 */
.btn-gradient {
  position: relative; width: 100%; padding: 18px; border-radius: 16px; border: none;
  font-weight: 800; font-size: 16px; cursor: pointer; overflow: hidden;
  transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: white;
  background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%);
  box-shadow: 0 10px 25px rgba(142, 45, 226, 0.3);
}
.btn-gradient:hover { transform: translateY(-4px); filter: brightness(1.15); box-shadow: 0 15px 35px rgba(142, 45, 226, 0.5); }
.btn-reflection {
  position: absolute; top: -50%; left: -100%; width: 50%; height: 200%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
  transform: rotate(45deg); transition: 0.6s;
}
.btn-gradient:hover .btn-reflection { left: 150%; }
.safe-area { height: 30px; }
</style>

<style>
/* 6. 全局弹窗 */
.el-message.cyber-message {
  background: rgba(17, 25, 40, 0.9) !important; backdrop-filter: blur(10px);
  border: 1px solid rgba(142, 45, 226, 0.3) !important; border-radius: 12px;
}
.el-message--success.cyber-message .el-message__content { color: #00d2ff !important; font-weight: bold; }
.el-message--error.cyber-message .el-message__content { color: #ff2d55 !important; font-weight: bold; }
</style>