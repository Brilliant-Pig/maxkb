// API 鉴权中间件

// 获取配置中的 baseUrl
const baseUrl = require('config').get('serverConfig').baseUrl;

const authService = require('../service/authService');

const authDao = require('../dao/authDao'); // ✨ 1. 引入 Dao 层

// 接口前缀白名单
const apiPrefixWhiteList = [
    '/auth', // 认证相关接口
    '/user' // 用户相关接口
];

// 鉴权函数
const apiProtected = async (req, res, next) => {
    const pathWithoutBaseUrl = req.path.startsWith(baseUrl) ? req.path.slice(baseUrl.length) : req.path;
    const isWhitelisted = apiPrefixWhiteList.some((prefix) => pathWithoutBaseUrl.startsWith(prefix));

    if (isWhitelisted) {
        next();
    } else {
        const authorization = req.headers['authorization'] || req.headers['Authorization'];
        if (!authorization) {
            res.ResultVO(401, '未提供 Authorization');
            return;
        }

        const token = authorization.split(' ')[1];
        if (!token) {
            res.ResultVO(401, 'Authorization 格式错误');
            return;
        }

        // --- 开始校验逻辑 ---

        // ✨ 2. 检查黑名单：如果 Token 在黑名单里，直接拦截
        try {
            const isBlacklisted = await authDao.isTokenBlacklisted(token);
            if (isBlacklisted) {
                res.ResultVO(401, '凭证已失效，请重新登录');
                return;
            }
        } catch (err) {
            console.error('黑名单查询失败:', err);
            // 数据库出错时建议保守处理，或者 next()，这里我们选择拦截
            res.ResultVO(500, '认证系统异常');
            return;
        }

        // 3. 验证 token 签名和有效期
        const payload = await authService.tokenVerify(token);
        if (!payload) {
            res.ResultVO(401, 'token 无效或已过期');
            return;
        }

        // 验证通过，挂载用户信息
        req.user = payload;
        next();
    }
};

module.exports = apiProtected;
