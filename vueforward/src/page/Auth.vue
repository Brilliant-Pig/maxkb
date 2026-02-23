<template>
    <div class="auth-wrapper">
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
                    <input v-model="registerForm.code" type="text" placeholder="输入验证码" required />
                    <button type="button" @click="sendVerifyCode" :disabled="isCounting" class="magic-verify-btn">
                    {{ isCounting ? `${countdown}s` : '获取验证码' }}
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
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isLogin = ref(true);
const isLoading = ref(false);
const countdown = ref(0);

const loginForm = ref({ email: '', password: '' });
const registerForm = ref({ username: '', email: '', password: '', code: '', role: 'student' });

const toggleMode = () => { isLogin.value = !isLogin.value; };

// 发送验证码
const sendEmailCode = async () => {
    if (!registerForm.value.email) return alert('请先填写邮箱');
    try {
        const res = await axios.post('http://127.0.0.1:33001/api/auth/send-code', { email: registerForm.value.email });
        if (res.data.code === 0) {
            alert('验证码已发送');
            countdown.value = 60;
            const timer = setInterval(() => {
                countdown.value--;
                if (countdown.value <= 0) clearInterval(timer);
            }, 1000);
        } else { alert(res.data.msg); }
    } catch (e) { alert('发送失败'); }
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
    .auth-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    padding: 20px;
    }

    .bg-blobs {
    position: absolute;
    width: 100%;
    height: 100%;
    }

    .blob {
    position: absolute;
    width: 400px;
    height: 400px;
    background: linear-gradient(180deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
    filter: blur(80px);
    border-radius: 50%;
    animation: move 20s infinite alternate;
    }

    .blob:nth-child(2) { background: rgba(139, 92, 246, 0.15); left: 50%; animation-delay: -5s; }
    .blob:nth-child(3) { background: rgba(236, 72, 153, 0.15); right: 0; bottom: 0; animation-delay: -10s; }

    /* 缩放淡入动画 */
    .scale-fade-enter-active, .scale-fade-leave-active { transition: all 0.3s ease; }
    .scale-fade-enter-from { opacity: 0; transform: scale(0.95); }
    .scale-fade-leave-to { opacity: 0; transform: scale(1.05); }

    @keyframes move {
    from { transform: translate(-10%, -10%) scale(1); }
    to { transform: translate(20%, 20%) scale(1.2); }
    }

    /* --- 毛玻璃卡片 --- */
    .auth-card {
    width: 100%;
    max-width: 380px; /* 缩小宽度 */
    max-height: 90vh; /* 防止超出屏幕 */
    overflow-y: auto; /* 必要时滚动 */
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px; /* 缩小内边距 */
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    /* 隐藏滚动条但保留功能 */
    .auth-card::-webkit-scrollbar { width: 0px; }

    .auth-header { text-align: center; margin-bottom: 25px; }
    .auth-header h2 { color: white; margin-top: 10px; font-size: 1.5rem; }

    /* 输入框紧凑样式 */
    .input-field { position: relative; margin-bottom: 25px; }
    .input-field input {
    width: 100%;
    padding: 8px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    color: white;
    outline: none;
    }
    .input-field label {
    position: absolute;
    left: 0; top: 8px;
    color: rgba(255,255,255,0.4);
    transition: 0.3s;
    pointer-events: none;
    }
    .input-field input:focus ~ label,
    .input-field input:not(:placeholder-shown) ~ label {
    top: -15px; font-size: 12px; color: #3b82f6;
    }

    .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #3b82f6;
    transition: 0.4s;
    }

    .input-field input:focus ~ .bar {
    width: 100%;
    }

    /* --- 身份选择器 --- */
    .role-options {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    }

    .role-options label {
    flex: 1;
    padding: 10px;
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #94a3b8;
    cursor: pointer;
    transition: 0.3s;
    }

    .role-options label.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
    color: #fff;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
    }

    .role-options input { display: none; }

    /* --- 按钮系列 --- */
    .submit-btn {
    width: 100%; padding: 12px; border-radius: 10px; border: none;
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    color: white; font-weight: bold; cursor: pointer; transition: 0.3s;
    }
    .submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }

    .ghost-btn {
    background: transparent;
    border: none;
    color: #3b82f6;
    font-weight: 600;
    cursor: pointer;
    padding: 5px 10px;
    transition: 0.3s;
    }

    .ghost-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    border-radius: 8px;
    }

    .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #94a3b8; }

    /* --- 切换动画 --- */
    .fade-slide-enter-active, .fade-slide-leave-active {
    transition: all 0.4s ease;
    }
    .fade-slide-enter-from { opacity: 0; transform: translateY(-20px); }
    .fade-slide-leave-to { opacity: 0; transform: translateY(20px); }

    .animate-in {
    animation: fadeInUp 0.5s ease backwards;
    }
    .role-group {
    margin-bottom: 25px; /* 增加间距，防止文字重叠 */
    }

    .section-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    margin-bottom: 10px;
    }
    /* 验证码专用布局 */
    .input-row {
    display: flex;
    align-items: center;
    position: relative;
    }

    .input-field.verify-field input {
    padding-right: 80px; /* 为右侧按钮留出空间 */
    }

    .inner-verify-btn {
    position: absolute;
    right: 0;
    bottom: 8px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #60a5fa;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: 0.3s;
    z-index: 5; /* 确保在输入框上层 */
    }

    .inner-verify-btn:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.3);
    color: white;
    }

    .inner-verify-btn:disabled {
    color: #64748b;
    border-color: rgba(255,255,255,0.1);
    cursor: not-allowed;
    }

    /* 紧凑布局：身份和验证码放一行 */
    .compact-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 15px;
    margin-bottom: 25px;
    }
    .role-mini-group { flex: 1; }
    .mini-label { display: block; color: rgba(255,255,255,0.4); font-size: 12px; margin-bottom: 5px; }
    .mini-options {
    display: flex;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 2px;
    }
    .mini-options button {
    flex: 1; padding: 4px; border: none; background: transparent; 
    color: #94a3b8; font-size: 12px; cursor: pointer; border-radius: 6px;
    }
    .mini-options button.active { background: #3b82f6; color: white; }

    .verify-mini-field {
    flex: 1;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    }
    .verify-mini-field input {
    width: 60%; padding: 8px 0; background: transparent; border: none; color: white; font-size: 14px; outline: none;
    }
    .text-link-btn {
    background: transparent; border: none; color: #3b82f6; font-size: 12px; cursor: pointer;
    }
    .switch-btn { background: transparent; border: none; color: #3b82f6; cursor: pointer; margin-left: 5px; font-weight: bold; }
    /* 身份选择行样式 */
    .role-field {
    margin-bottom: 20px;
    }

    .static-label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
    text-align: left;
    }

    /* 自定义行容器，彻底解决重叠 */
    .custom-row {
    margin-bottom: 22px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    }

    .row-title {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 10px;
    font-weight: 500;
    }

    /* --- 灵动胶囊身份选择器 --- */
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

    .role-item.active {
    color: #fff;
    }

    .role-item .emoji { font-size: 18px; }
    .role-item .text { font-weight: 600; font-size: 14px; }

    /* 胶囊滑块 */
    .role-slider {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 11px;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 1;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .role-slider.teacher {
    transform: translateX(100%);
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    }

    /* --- 玻璃感验证码输入 --- */
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
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
    }

    .glass-input-group input {
    flex: 1;
    background: transparent !important;
    border: none !important;
    color: white !important;
    padding: 12px 0 !important;
    font-size: 14px;
    outline: none;
    }

    .magic-verify-btn {
    background: transparent;
    border: none;
    color: #60a5fa;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    padding-left: 15px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transition: 0.3s;
    }

    .magic-verify-btn:hover:not(:disabled) {
    color: #93c5fd;
    transform: scale(1.05);
    }

    .magic-verify-btn:disabled {
    color: #64748b;
    }
    @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
    }
</style>