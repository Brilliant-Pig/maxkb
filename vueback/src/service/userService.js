const userDao = require('../dao/userDao');

// ==========================================
// 1. 学生提问模块 (student_questions)
// ==========================================

exports.getQuestions = async () => {
    return await userDao.getQuestions();
};

// --- 新增：根据核心词查询 ---
exports.getQuestionsByContent = async (core) => {
    // 直接调用 dao 层执行模糊查询
    return await userDao.getQuestionsByContent(core);
};

// --- 新增：增加问题热度 ---
exports.updateQuestionHot = async (id) => {
    return await userDao.updateQuestionHot(id);
};

// --- 修改：适配 controller 的调用参数 ---
exports.addQuestion = async (studentId, content) => {
    // 构造 dao 层需要的对象格式
    const questionData = {
        studentId: studentId,
        content: content
    };
    return await userDao.addQuestion(questionData);
};

exports.deleteQuestion = async (id, type) => {
    // 根据类型（提问或热点）执行物理删除，确保数据彻底消失
    if (type === 'question') {
        return await userDao.deleteStudentQuestion(id);
    } else {
        return await userDao.deleteTopicClick(id); // 此处的 id 即 topic_name
    }
};

exports.updateQuestion = async (id, content) => {
    // 修改现有问题的文本内容
    return await userDao.updateQuestion(id, content);
};

// ==========================================
// 2. 考点热点点击模块 (os_topic_clicks)
// ==========================================

exports.recordClick = async (topicName) => {
    // 逻辑：先检查是否存在，存在则 click_count + 1，不存在则插入
    const exists = await userDao.getTopicClick(topicName);
    if (exists && exists.length > 0) {
        return await userDao.incrementTopicClick(topicName);
    } else {
        return await userDao.insertTopicClick(topicName);
    }
};

// ==========================================
// 3. 效能感测评模块 (student_self_efficacy)
// ==========================================

exports.submitEfficacy = async (data) => {
    // 计算平均掌握度百分比：(sum(q1~q9) / (9 * 5)) * 100
    const scores = [data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q8, data.q9];
    const sum = scores.reduce((a, b) => a + Number(b), 0);
    const avgProgress = Math.round((sum / 45) * 100);

    const finalData = { ...data, avgProgress };
    return await userDao.insertEfficacy(finalData);
};

// ==========================================
// 4. 系统可用性评价模块 (system_usability)
// ==========================================

exports.submitSus = async (data) => {
    // 这里的 data.susScore 建议由前端计算好传入，或者在此根据 rawAnswers 重新计算
    // 按照提供的模板，我们直接保存处理后的结果
    return await userDao.insertSus(data);
};

// ==========================================
// 5. 教师端科研数据统计
// ==========================================

exports.getClassStats = async () => {
    // 汇总计算全班平均值
    const efficacyAvg = await userDao.getClassEfficacyAvg();
    const susAvg = await userDao.getClassSusAvg();

    return {
        classEfficacy: efficacyAvg[0]?.avgScore?.toFixed(2) || 0,
        classSus: susAvg[0]?.avgSus?.toFixed(2) || 0
    };
};

exports.getStudentStatus = async () => {
    // 获取所有学生状态画像
    return await userDao.getStudentStatus();
};
