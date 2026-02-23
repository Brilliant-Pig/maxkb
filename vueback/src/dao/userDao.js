const db = require(`../utils/dbConnPool/db`);

// ==========================================
// 1. 学生提问表 (student_questions)
// ==========================================

// 获取所有提问
exports.getQuestions = async () => {
    const sql = `
        SELECT 
            id, 
            student_id AS studentId, 
            content AS question, 
            answer, 
            hot_score AS hot, 
            status,
            created_at AS createdAt,
            1 AS isStudent -- 标识为学生提问
        FROM student_questions
        ORDER BY created_at DESC
    `;
    return await db.query(sql);
};

// 插入新问题
exports.addQuestion = async (data) => {
    const sql = `
        INSERT INTO student_questions (student_id, content, hot_score, status)
        VALUES (?, ?, 1, 0)
    `;
    const params = [data.studentId || 'anonymous', data.content];
    return await db.query(sql, params);
};

// 物理删除学生提问
exports.deleteStudentQuestion = async (id) => {
    const sql = `DELETE FROM student_questions WHERE id = ?`;
    return await db.query(sql, [id]);
};

// 修改问题内容
exports.updateQuestion = async (id, content) => {
    const sql = `UPDATE student_questions SET content = ? WHERE id = ?`;
    return await db.query(sql, [content, id]);
};

// ==========================================
// 2. 考点热点点击表 (os_topic_clicks)
// ==========================================

// 获取所有热点点击（合并到 FAQ 列表）
exports.getAllTopicClicks = async () => {
    const sql = `
        SELECT 
            topic_name AS id, 
            topic_name AS question, 
            click_count AS hot,
            '点击实验室快捷键可获取此考点的详细 AI 回答。' AS answer,
            0 AS isStudent -- 标识为系统热点
        FROM os_topic_clicks
    `;
    return await db.query(sql);
};

// 检查热点是否存在
exports.getTopicClick = async (topicName) => {
    const sql = `SELECT * FROM os_topic_clicks WHERE topic_name = ?`;
    return await db.query(sql, [topicName]);
};

// 更新热度
exports.incrementTopicClick = async (topicName) => {
    const sql = `UPDATE os_topic_clicks SET click_count = click_count + 1, last_click = CURRENT_TIMESTAMP WHERE topic_name = ?`;
    return await db.query(sql, [topicName]);
};

// 插入新热点
exports.insertTopicClick = async (topicName) => {
    const sql = `INSERT INTO os_topic_clicks (topic_name, click_count) VALUES (?, 1)`;
    return await db.query(sql, [topicName]);
};

// 物理删除热点记录 (解决你要求的“问题1”彻底消失)
exports.deleteTopicClick = async (topicName) => {
    const sql = `DELETE FROM os_topic_clicks WHERE topic_name = ?`;
    return await db.query(sql, [topicName]);
};

// ==========================================
// 3. 效能感测评 (student_self_efficacy)
// ==========================================

exports.insertEfficacy = async (d) => {
    const sql = `
        INSERT INTO student_self_efficacy (student_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, avg_progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [d.studentId, d.q1, d.q2, d.q3, d.q4, d.q5, d.q6, d.q7, d.q8, d.q9, d.avgProgress];
    return await db.query(sql, params);
};

// ==========================================
// 4. 系统评价 (system_usability)
// ==========================================

exports.insertSus = async (d) => {
    const sql = `
        INSERT INTO system_usability (student_id, sus_score, raw_answers)
        VALUES (?, ?, ?)
    `;
    const params = [d.studentId, d.susScore, JSON.stringify(d.rawAnswers)];
    return await db.query(sql, params);
};

// ==========================================
// 5. 教师端统计数据 (Aggregation)
// ==========================================

exports.getClassEfficacyAvg = async () => {
    const sql = `SELECT AVG(avg_progress / 20) AS avgScore FROM student_self_efficacy`; // 转换回 5 分制
    return await db.query(sql);
};

exports.getClassSusAvg = async () => {
    const sql = `SELECT AVG(sus_score) AS avgSus FROM system_usability`;
    return await db.query(sql);
};

exports.getStudentStatus = async () => {
    const sql = `SELECT * FROM student_status ORDER BY last_active DESC`;
    return await db.query(sql);
};

// userDao.js 中增加以下两个导出函数

// 根据核心词进行模糊匹配
exports.getQuestionsByContent = async (core) => {
    const sql = `SELECT id, hot_score FROM student_questions WHERE content LIKE ? LIMIT 1`;
    return await db.query(sql, [`%${core}%`]);
};

// 增加热度值
exports.updateQuestionHot = async (id) => {
    const sql = `UPDATE student_questions SET hot_score = hot_score + 1 WHERE id = ?`;
    return await db.query(sql, [id]);
};
