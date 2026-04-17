<template>
    <div class="auth-wrapper">
        <div class="background-layers">
            <PixelBlast text="LEISURELY FUN&#10;SMART BRAIN" />
            
            <div class="bg-layer-item">
    <div class="bg-layer-item">
    <ColorBends 
        variant="circle" 
        color="#C4B5FD"
        :pixelSize="3.5"
        :liquid="false"
        :enableRipples="true"
        :patternDensity="0.30"    
        :patternScale="3.4"
        :pixelSizeJitter="0.08"   
        :speed="0.55"
        :noiseAmount="0"
    />
</div>
</div>
        </div>
        <div class="bg-blobs">
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="blob"></div>
        </div>

        <div class="auth-container">
        <transition name="scale-fade" mode="out-in">
            <div class="auth-card" :key="isLogin">
            <div class="auth-header">
                <div class="icon-box">
                <span>{{ isLogin ? '🔐' : '🚀' }}</span>
                </div>
                <h2>{{ isLogin ? '登录 OS-AI' : '创建账号，开启AI之旅！' }}</h2>
            </div>

            <div class="auth-body">
                <form @submit.prevent="isLogin ? handleLogin() : handleRegister()">
                
                <div v-if="!isLogin" class="input-field">
                    <input v-model="registerForm.username" type="text" placeholder=" " required />
                    <label>用户名</label>
                    <div class="bar"></div>
                </div>

                <div class="input-field">
                    <input v-if="isLogin" v-model="loginForm.email" type="email" placeholder=" " required />
                    <input v-else v-model="registerForm.email" type="email" placeholder=" " required />
                    <label>电子邮箱</label>
                    <div class="bar"></div>
                </div>

                <div v-if="!isLogin" class="custom-row role-row-box animate-in">
                <span class="row-title">✨ 你是谁</span>
                <div class="role-capsule">
                    <div 
                    class="role-item" 
                    :class="{ active: registerForm.role === 'student' }"
                    @click="registerForm.role = 'student'"
                    >
                    <span class="emoji">👨‍🎓</span>
                    <span class="text">学生</span>
                    </div>
                    <div 
                    class="role-item" 
                    :class="{ active: registerForm.role === 'teacher' }"
                    @click="registerForm.role = 'teacher'"
                    >
                    <span class="emoji">👩‍🏫</span>
                    <span class="text">教师</span>
                    </div>
                    <div class="role-slider" :class="registerForm.role"></div>
                </div>
                </div>

                <div v-if="!isLogin" class="custom-row verify-row-box animate-in">
                <div class="glass-input-group">
                    <input v-model="registerForm.code" type="text" placeholder="6位验证码" required />
                    <button 
                        type="button" 
                        @click="sendCode" 
                        :disabled="loading || codeSent" 
                        class="inner-send-btn"
                    >
                        {{ loading ? '发送中...' : (codeSent ? `${countdown}s` : '获取验证码') }}
                    </button>
                </div>
                </div>

                <div class="input-field">
                    <input v-if="isLogin" v-model="loginForm.password" type="password" placeholder=" " required />
                    <input v-else v-model="registerForm.password" type="password" placeholder=" " required />
                    <label>密码</label>
                    <div class="bar"></div>
                </div>

                <button type="submit" class="submit-btn" :disabled="isSubmitting">
                    {{ isLogin ? '立即登录' : '完成注册' }}
                </button>
                </form>

                <div class="auth-footer">
                <span>{{ isLogin ? '没有账号?' : '已有账号?' }}</span>
                <button @click="toggleMode" class="switch-btn">
                    {{ isLogin ? '去注册' : '去登录' }}
                </button>
                </div>
            </div>
            </div>
        </transition>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
const loading = ref(false);      // 这里的 loading 必须声明
const codeSent = ref(false);     // 控制按钮是否进入倒计时状态
import { useRouter } from 'vue-router';
import axios from 'axios';
import PixelBlast from '../components/PixelBlast.vue';
import ColorBends from '../components/ColorBends.vue';

const router = useRouter();
const isLogin = ref(true);
const isLoading = ref(false);
const countdown = ref(0);

const loginForm = ref({ email: '', password: '' });
const registerForm = ref({ username: '', email: '', password: '', code: '', role: 'student' });

const toggleMode = () => { isLogin.value = !isLogin.value; };

// 发送验证码
const sendCode = async () => {
    if (!registerForm.value.email) {
        alert('请先输入邮箱');
        return;
    }
    
    loading.value = true; // 开启加载状态
    try {
        // 这里的路径加上 /api，匹配 vite.config.js 的代理
        const res = await axios.post('/api/auth/send-code', { 
            email: registerForm.value.email 
        });

        if (res.data.code === 0) {
            alert('验证码已发送！');
            // 开启倒计时
            codeSent.value = true;
            countdown.value = 60;
            const timer = setInterval(() => {
                countdown.value--;
                if (countdown.value <= 0) {
                    clearInterval(timer);
                    codeSent.value = false;
                }
            }, 1000);
        } else {
            alert(res.data.msg || '发送失败');
        }
    } catch (err) {
        console.error('发送验证码错误:', err);
        alert('网络连接失败，请检查后端服务是否启动');
    } finally {
        loading.value = false; // 关闭加载状态
    }
};

// 登录逻辑
const handleLogin = async () => {
    isLoading.value = true;
    try {
        const res = await axios.post('http://127.0.0.1:33001/api/auth/login', loginForm.value);
        if (res.data.code === 0) {
            // ✨ 关键存储
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user)); 
            
            alert('欢迎回来！');
            if (res.data.data.user.role === 'teacher') {
                router.push('/TeacherConsole');
            } else {
                router.push('/HomeworkAssistant');
            }
        } else { alert(res.data.msg); }
    } catch (e) { alert('登录异常'); }
    finally { isLoading.value = false; }
};

// 注册逻辑
const handleRegister = async () => {
    isLoading.value = true;
    try {
        const res = await axios.post('http://127.0.0.1:33001/api/auth/register', registerForm.value);
        if (res.data.code === 0) {
            // ✨ 注册成功通常也会返回 token 和用户信息
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            
            alert('注册成功并已登录！');
            const user = res.data.data.user;
            if (user.role === 'teacher') {
                router.push('/TeacherConsole'); // 这里的路径一定要在 router.js 中定义过
            } else {
                router.push('/ImmersiveLab');
            }
        } else { alert(res.data.msg); }
    } catch (e) { alert('注册失败'); }
    finally { isLoading.value = false; }
};
</script>

<style scoped>
/* --- 全局容器 --- */
.auth-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #020617; /* 极深背景色 */
    position: relative;
    overflow: hidden;
    z-index: 10;

}
/* --- 核心卡片：增强阴影与突出感 --- */
.auth-card {
    width: 100%;
    max-width: 380px;
    max-height: 70vh;
    min-width: 30vh;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.06); 
    backdrop-filter: blur(20px);
    /* 双重边框提升精致感 */
    border: 1px solid rgba(255, 255, 255, 0.15); 
    border-radius: 24px;
    padding: 35px;
    /* 三重投影：深色底影 + 氛围光 + 顶部内高光 */
    box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.8), 
        0 0 20px rgba(59, 130, 246, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease;
    margin-top: 200px;
}

/* 隐藏滚动条但保留功能 */
.auth-card::-webkit-scrollbar { width: 0px; }

.auth-header { text-align: center; margin-bottom: 25px; }
.auth-header h2 { color: white; margin-top: 10px; font-size: 1.5rem; }

/* --- 输入框样式：同步“你是谁”文字颜色 --- */
.input-field { position: relative; margin-bottom: 25px; }

.input-field input {
    width: 100%;
    padding: 10px 0;
    background: transparent;
    border: none;
    border-bottom: 2px solid rgba(255, 255, 255, 0.15);
    color: #ffffff; /* 纯白输入文字，清晰易读 */
    font-size: 15px;
    outline: none;
    transition: 0.3s;
}

.input-field label {
    position: absolute;
    left: 0; 
    top: 10px;
    /* 同步“你是谁”的颜色，增强识别度 */
    color: rgba(255, 255, 255, 0.7); 
    font-weight: 500;
    transition: 0.3s;
    pointer-events: none;
}

/* 输入框聚焦效果 */
.input-field input:focus ~ label,
.input-field input:not(:placeholder-shown) ~ label {
    top: -18px; 
    font-size: 12px; 
    color: #60a5fa; /* 聚焦时变为亮蓝色 */
    text-shadow: 0 0 8px rgba(96, 165, 250, 0.4);
}

.bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: 0.4s;
}
.background-layers {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;           /* 背景整体不拦截鼠标 */
}

.bg-layer-item {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

/* 重要：让 PixelBlast 的文字区域可以接收鼠标事件 */
.art-text-container,
.text-aligner,
.hover-char {
    pointer-events: auto !important;   /* 恢复文字的 hover 效果 */
}
.input-field input:focus ~ .bar { width: 100%; }

/* --- 身份选择行 --- */
.custom-row {
    margin-bottom: 22px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.row-title {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.7); /* 基础参照颜色 */
    margin-bottom: 10px;
    font-weight: 500;
}

.role-capsule {
    position: relative;
    display: flex;
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.role-item {
    flex: 1;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 0;
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.role-item.active { color: #fff; }

.role-slider {
    position: absolute;
    top: 4px; left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 11px;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 1;
}

.role-slider.teacher {
    transform: translateX(100%);
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

/* --- 验证码组件 --- */
.glass-input-group {
    width: 100%;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2px 12px;
    transition: 0.3s;
}

.glass-input-group:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
}

.glass-input-group input {
    flex: 1;
    background: transparent !important;
    border: none !important;
    color: white !important;
    padding: 12px 0 !important;
    outline: none;
}

/* --- 按钮样式 --- */
.submit-btn, .inner-send-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    border: none;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.submit-btn {
    width: 100%; 
    padding: 12px; 
    border-radius: 12px;
    margin-top: 10px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.inner-send-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
}

.submit-btn:hover:not(:disabled), .inner-send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.1);
    box-shadow: 0 6px 18px rgba(139, 92, 246, 0.4);
}

.submit-btn:disabled, .inner-send-btn:disabled {
    background: #334155;
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
}

/* --- 页脚与切换 --- */
.auth-footer { text-align: center; margin-top: 25px; font-size: 14px; color: rgba(255,255,255,0.5); }
.switch-btn { 
    background: transparent; 
    border: none; 
    color: #60a5fa; 
    cursor: pointer; 
    margin-left: 5px; 
    font-weight: bold; 
}

/* --- 动画 --- */
.scale-fade-enter-active, .scale-fade-leave-active { transition: all 0.4s ease; }
.scale-fade-enter-from { opacity: 0; transform: scale(0.95); }
.scale-fade-leave-to { opacity: 0; transform: scale(1.05); }

.animate-in { animation: fadeInUp 0.5s ease backwards; }
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>