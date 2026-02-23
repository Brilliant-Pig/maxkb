const router = require('express').Router();
const authService = require('../service/authService');

module.exports = router;

/**
 * @name sendCode 发送邮箱验证码
 * @description POST /auth/send-code
 * @body {string} email 用户邮箱
 */
router.post('/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.ResultVO(1, '邮箱不能为空');

    try {
        const result = await authService.sendEmailCode(email);
        if (result.success) {
            res.ResultVO(0, '验证码已发送至邮箱');
        } else {
            res.ResultVO(1, result.msg || '发送失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器错误');
    }
});

/**
 * @name register 用户注册
 * @description POST /auth/register
 * @body {string} username 用户名
 * @body {string} email 邮箱
 * @body {string} password 密码
 * @body {string} code 验证码
 */
router.post('/register', async (req, res) => {
    // 1. 明确解构 role
    const { username, email, password, code, role } = req.body;

    // 2. 校验 role 是否存在
    if (!username || !email || !password || !code || !role) {
        return res.ResultVO(1, '所有字段均为必填项，包括身份选择');
    }

    try {
        // 3. 将 role 传递给 Service
        const result = await authService.register({ username, email, password, code, role });
        if (result.success) {
            res.ResultVO(0, '注册成功', result.data);
        } else {
            res.ResultVO(1, result.msg || '注册失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器注册异常');
    }
});

/**
 * @name login 用户登录（支持邮箱登录）
 * @description POST /auth/login
 * @body {string} email 用户邮箱
 * @body {string} password 用户密码
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // 改为 email 登录

    try {
        const result = await authService.login(email, password);
        if (result.success) {
            res.ResultVO(0, '登录成功', result.data); // result.data 包含 token 和 userInfo
        } else {
            res.ResultVO(1, result.msg || '登录失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器登录异常');
    }
});

/**
 * @name tokenVerify 凭证校验
 */
router.post('/tokenVerify', async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) return res.ResultVO(1, '未找到凭证');

    const token = authorization.split(' ')[1];
    const payload = await authService.tokenVerify(token);

    if (payload) {
        res.ResultVO(0, '凭证有效', payload);
    } else {
        res.ResultVO(1, '凭证无效');
    }
});
// src/controller/authController.js

router.post('/logout', async (req, res) => {
    // 1. 从请求头获取 token (Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.ResultVO(1, '未提供凭证');
    }

    const result = await authService.logout(token);
    if (result.success) {
        res.ResultVO(0, '退出登录成功');
    } else {
        res.ResultVO(1, result.msg);
    }
});

/**
 * @name updatePassword 修改密码
 * @description POST /auth/update-password
 */
router.post('/update-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // 1. 从请求头提取 token 并解析出 userId
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.ResultVO(1, '未登录或凭证失效');

    const token = authHeader.split(' ')[1];
    const payload = await authService.tokenVerify(token);

    if (!payload || !payload.userId) return res.ResultVO(1, '身份验证失败');

    try {
        // 2. 调用 service 执行逻辑
        const result = await authService.updatePassword(payload.userId, oldPassword, newPassword);
        if (result.success) {
            res.ResultVO(0, '密码修改成功，请重新登录');
        } else {
            res.ResultVO(1, result.msg || '修改失败');
        }
    } catch (err) {
        console.error(err);
        res.ResultVO(1, '服务器异常');
    }
});

/**
 * @name updateEmail 修改邮箱
 * @description POST /auth/update-email
 */
router.post('/update-email', async (req, res) => {
    const { newEmail, password } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.ResultVO(1, '未登录');

    const token = authHeader.split(' ')[1];
    const payload = await authService.tokenVerify(token);

    if (!payload) return res.ResultVO(1, '凭证无效');

    try {
        const result = await authService.updateEmail(payload.userId, newEmail, password);
        if (result.success) {
            res.ResultVO(0, '邮箱修改成功', { newEmail: result.newEmail });
        } else {
            res.ResultVO(1, result.msg || '修改失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器异常');
    }
});
