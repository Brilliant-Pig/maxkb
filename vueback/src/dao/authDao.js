const db = require(`../utils/dbConnPool/db`);

// ==========================================
// 1. 用户核心操作
// ==========================================

/**
 * 根据邮箱查找用户 (用于登录和注册前校验)
 */
exports.findUserByEmail = async (email) => {
    const sql = `
        SELECT 
            user_id AS id, 
            user_name AS username, 
            email, 
            password_hash, 
            role 
        FROM user_info 
        WHERE email = ?
    `;
    return await db.query(sql, [email]);
};

/**
 * 根据用户名查找用户 (用于注册前校验唯一性)
 */
exports.findUserByUsername = async (username) => {
    const sql = `SELECT user_id FROM user_info WHERE user_name = ?`;
    return await db.query(sql, [username]);
};

/**
 * 创建新用户 (注册)
 */
exports.createUser = async (user) => {
    const sql = `
        INSERT INTO user_info (user_name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    `;
    const params = [user.username, user.email, user.passwordHash, user.role];
    const result = await db.query(sql, params);

    // 返回新创建的用户对象，包含 ID
    return {
        id: result.lastInsertRowid,
        username: user.username,
        role: user.role
    };
};

// ==========================================
// 2. 邮箱验证码操作 (建议在数据库创建 email_codes 表)
// ==========================================

/**
 * 保存或更新验证码
 * 使用 REPLACE INTO：如果该邮箱已有记录则更新，没有则插入
 */
exports.saveEmailCode = async (email, code) => {
    const sql = `
        REPLACE INTO email_codes (email, code, expires_at)
        VALUES (?, ?, datetime('now', '+5 minutes'))
    `;
    return await db.query(sql, [email, code]);
};

/**
 * 校验验证码是否匹配且未过期
 */
exports.verifyEmailCode = async (email, code) => {
    const sql = `
        SELECT * FROM email_codes 
        WHERE email = ? AND code = ? AND expires_at > datetime('now')
    `;
    const result = await db.query(sql, [email, code]);
    return result.length > 0;
};

// ==========================================
// 3. 兼容旧代码 (保留你原始的登录方法)
// ==========================================
exports.login = async (userId) => {
    const sql = `
        SELECT
            user_id AS userId,
            user_name AS userName,
            password_hash AS passwordHash,
            role
        FROM
            user_info
        WHERE
            user_id = ? OR email = ?
    `;
    return await db.query(sql, [userId, userId]);
};
// src/dao/authDao.js

/**
 * 将 Token 加入黑名单
 */
exports.addTokenToBlacklist = async (token, expiresAt) => {
    const sql = `INSERT INTO token_blacklist (token, expires_at) VALUES (?, ?)`;
    // expiresAt 应该是从 JWT 中解析出来的失效时间
    return await db.query(sql, [token, expiresAt]);
};

/**
 * 检查 Token 是否在黑名单中
 */
exports.isTokenBlacklisted = async (token) => {
    const sql = `SELECT id FROM token_blacklist WHERE token = ? LIMIT 1`;
    const result = await db.query(sql, [token]);
    return result.length > 0;
};

// ==========================================
// 4. 用户信息维护 (个人设置功能)
// ==========================================

/**
 * 根据用户 ID 查找完整用户信息
 * @param {number} userId
 */
exports.findUserById = async (userId) => {
    const sql = `
        SELECT 
            user_id AS id, 
            user_name AS username, 
            email, 
            password_hash, 
            role 
        FROM user_info 
        WHERE user_id = ?
    `;
    return await db.query(sql, [userId]);
};

/**
 * 更新用户密码
 * @param {number} userId
 * @param {string} newPasswordHash 加密后的新密码哈希
 */
exports.updatePassword = async (userId, newPasswordHash) => {
    const sql = `
        UPDATE user_info 
        SET password_hash = ? 
        WHERE user_id = ?
    `;
    return await db.query(sql, [newPasswordHash, userId]);
};

/**
 * 更新用户邮箱
 * @param {number} userId
 * @param {string} newEmail
 */
exports.updateEmail = async (userId, newEmail) => {
    const sql = `
        UPDATE user_info 
        SET email = ? 
        WHERE user_id = ?
    `;
    return await db.query(sql, [newEmail, userId]);
};
