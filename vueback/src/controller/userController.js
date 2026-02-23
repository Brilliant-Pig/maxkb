const router = require('express').Router();
const userService = require('../service/userService');

// ==========================================
// 1. 学生提问模块 (student_questions)
// ==========================================

// 获取所有提问列表（教师端查看或学生端 FAQ 加载）
router.get('/getQuestions', async (req, res, next) => {
    const result = await userService.getQuestions();
    res.ResultVO(0, '获取提问列表成功', result);
});

// 学生提交新提问（实现提交后本地不存，直接入库）
// A. 定义废词列表，你可以根据实际教学情况随时增加
const stopWords = ['什么是', '请问', '老师', '想知道', '如何理解', '怎么', '解释下', '的', '了', '呢', '？', '?', '！', '!'];

function getCoreKeywords(text) {
    let core = text;
    stopWords.forEach((word) => {
        // 关键修复：使用 split 和 join 替代 RegExp，这样可以安全处理 ? ! 等特殊符号
        // 这种方式不需要担心正则表达式的语法冲突
        core = core.split(word).join('');
    });
    // 额外处理：去掉剩余的标点符号
    core = core.replace(/[?？!！.。，,]/g, '');
    return core.trim();
}

router.post('/addQuestion', async (req, res) => {
    const { content, studentId } = req.body;
    if (!content) return res.json({ code: -1, msg: '内容不能为空' });

    // 1. 提取核心词（使用修复后的 getCoreKeywords 函数）
    const core = getCoreKeywords(content);

    try {
        // --- 核心修复：改为调用 userService 提供的方法 ---
        // 假设你的 userService 中已经有了 getQuestionsByContent 方法
        const existing = await userService.getQuestionsByContent(core);

        if (existing && existing.length > 0) {
            // 2. 匹配成功，调用 userService 增加热度
            const targetId = existing[0].id;
            await userService.updateQuestionHot(targetId);

            // 使用你项目规范的 ResultVO 返回
            res.ResultVO(0, '检测到相似问题，热度已累加', { id: targetId });
        } else {
            // 3. 匹配失败，调用 userService 新增记录
            await userService.addQuestion(studentId, content);
            res.ResultVO(0, '新问题已入库');
        }
    } catch (err) {
        console.error('【后端报错详情】:', err); // 在控制台打印具体的错误原因
        res.json({ code: -1, msg: '服务器错误' });
    }
});

// 物理删除提问（实现你要求的彻底消失）
router.delete('/deleteQuestion', async (req, res, next) => {
    const { id, type } = req.query; // id 为主键，type 用于区分是提问还是热点点击
    const result = await userService.deleteQuestion(id, type);
    res.ResultVO(0, '数据已从数据库物理删除', result);
});

// 修改提问内容
router.put('/updateQuestion', async (req, res, next) => {
    const { id, content } = req.body;
    const result = await userService.updateQuestion(id, content);
    res.ResultVO(0, '问题修改成功', result);
});

// ==========================================
// 2. 考点热点点击模块 (os_topic_clicks)
// ==========================================

// 记录一次考点点击（热度 +1）
router.post('/recordClick', async (req, res, next) => {
    const { topicName } = req.body;
    const result = await userService.recordClick(topicName);
    res.ResultVO(0, '热度统计更新成功', result);
});

// ==========================================
// 3. 效能感测评模块 (student_self_efficacy)
// ==========================================

// 提交自我效能感评分
router.post('/submitEfficacy', async (req, res, next) => {
    const efficacyData = req.body; // 包含 9 个评分和学生 ID
    const result = await userService.submitEfficacy(efficacyData);
    res.ResultVO(0, '掌握度数据已同步存档', result);
});

// ==========================================
// 4. 系统可用性评价模块 (system_usability)
// ==========================================

// 提交 SUS 量表结果
router.post('/submitSus', async (req, res, next) => {
    const susData = req.body; // 包含分数和原始答案
    const result = await userService.submitSus(susData);
    res.ResultVO(0, '系统评价提交成功', result);
});

// ==========================================
// 5. 教师端科研数据统计 (综合查询)
// ==========================================

// 获取班级整体统计数据（用于教师端看板）
router.get('/getClassStats', async (req, res, next) => {
    const result = await userService.getClassStats();
    res.ResultVO(0, '科研报表数据获取成功', result);
});

// 获取所有学生状态列表
router.get('/getStudentStatus', async (req, res, next) => {
    const result = await userService.getStudentStatus();
    res.ResultVO(0, '学生画像同步成功', result);
});

module.exports = router;
