import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    // 1. 刚进网站直接跳转到登录注册页
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../page/auth.vue'),
        meta: { title: '身份认证', freeAuth: true } // 标记不需要登录
    },
    {
        path: '/ImmersiveLab',
        name: 'ImmersiveLab',
        component: () => import('../page/ImmersiveLab.vue'),
        meta: {
            title: '沉浸式AI实验室',
            freeAuth: true
        }
    },
    {
        path: '/TeacherConsole',
        name: 'TeacherConsole',
        component: () => import('../page/TeacherConsole.vue'),
        meta: {
            title: '教师控制台',
            freeAuth: false,
            role: 'teacher' // 只有教师可访问
        }
    },
    {
        path: '/HomeworkAssistant',
        name: 'HomeworkAssistant',
        component: () => import('../page/HomeworkAssistant.vue'),
        meta: {
            title: '作业助手',
            freeAuth: false
        }
    },
    {
        path: '/LearningDashboard',
        name: 'LearningDashboard',
        component: () => import('../page/LearningDashboard.vue'),
        meta: {
            title: '学习仪表盘',
            freeAuth: false
        }
    },
    {
    path: '/Profile',
    name: 'Profile',
    component: () => import('../page/Profile.vue'),
    meta: { 
        title: '个人设置', 
        freeAuth: false 
    } // 必须登录
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// --- 路由守卫：实现登录拦截和角色过滤 ---
router.beforeEach((to, from, next) => {
    // 1. 分别获取 token 和用户信息
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // 1. 首页重定向处理
    if (to.path === '/') {
        return next({ path: '/login' });
    }

    // 2. 免登录页面直接放行
    if (to.meta.freeAuth) {
        return next();
    }

    // 3. 检查是否有 token (改为直接判断 token 变量)
    if (!token) {
        return next({ name: 'Login' });
    }

    // 4. 角色权限拦截
    if (to.meta.role === 'teacher') {
        if (user && user.role === 'teacher') {
            next();
        } else {
            alert('权限不足，仅限教师访问');
            next('/ImmersiveLab'); // 学生跳到实验室
        }
    } else {
        next();
    }
});

export default router;