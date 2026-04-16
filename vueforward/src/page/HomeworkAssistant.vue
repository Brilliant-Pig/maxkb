<template>
  <div class="practice-container">
    <!-- 顶部导航 -->
    <nav class="practice-nav animate__animated animate__fadeIn">
      <div class="nav-brand">
        <span class="brand-icon">📝</span>
        <div class="brand-text">
          <div class="main-title">练习模式</div>
          <div class="sub-title">基于知识库的智能出题与评分</div>
        </div>
      </div>
      <div class="actions">
        <select v-model="selectedKnowledge" class="knowledge-select" @change="onKnowledgeChange">
          <option value="">随机知识库</option>
          <option v-for="kb in knowledgeList" :key="kb.id" :value="kb.id">
            {{ kb.name }}
          </option>
        </select>
        <button
          class="btn-generate"
          @click="generateQuestions"
          :disabled="isGenerating"
          :class="{ 'is-loading': isGenerating }"
        >
          <span v-if="isGenerating" class="loading-icon"></span>
          <span>{{ isGenerating ? '正在生成题目...' : '生成题目' }}</span>
        </button>
      </div>
    </nav>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧：题目列表 -->
      <section class="questions-section">
        <div class="section-header">
          <span class="section-title">题目列表</span>
          <span class="question-count" v-if="questions.length > 0">
            共 {{ questions.length }} 道题目
          </span>
        </div>

        <div class="questions-list" v-if="questions.length > 0">
          <div
            v-for="(q, index) in questions"
            :key="index"
            class="question-card"
            :class="{ 'active': currentQuestionIndex === index }"
            @click="currentQuestionIndex = index"
          >
            <div class="question-header">
              <span class="question-number">第 {{ index + 1 }} 题</span>
              <span class="question-type" :class="q.type">
                {{ q.type === 'choice' ? '选择题' : q.type === 'multi' ? '多选题' : q.type === 'judge' ? '判断题' : q.type === 'code' ? '代码题' : q.type === 'short' ? '简答题' : '填空题' }}
              </span>
              <!-- 用空心圆/实心圆表示作答状态 -->
              <span class="answer-status" :class="{ 'answered': q.userAnswer }">
                {{ q.userAnswer ? '●' : '○' }}
              </span>
            </div>
            <div class="question-preview">{{ q.content.substring(0, 50) }}...</div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-icon">📚</div>
          <p>点击上方"生成题目"开始练习</p>
        </div>
      </section>

      <!-- 右侧：答题区 -->
      <aside class="answer-section">
        <Transition name="fade-slide" mode="out-in">
          <!-- 有题目时显示答题区 -->
          <div v-if="currentQuestion && !showResult" class="answer-panel" key="answer">
            <div class="answer-header">
              <span class="current-label">
                第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题
              </span>
              <span class="question-type-badge" :class="currentQuestion.type">
                {{ currentQuestion.type === 'choice' ? '选择题' : currentQuestion.type === 'multi' ? '多选题' : currentQuestion.type === 'judge' ? '判断题' : currentQuestion.type === 'code' ? '代码题' : currentQuestion.type === 'short' ? '简答题' : '填空题' }}
              </span>
            </div>

            <div class="question-content">
              <p>{{ currentQuestion.content }}</p>
            </div>

            <!-- 选择题选项 -->
            <div class="options-list" v-if="currentQuestion.type === 'choice'">
              <label
                v-for="(option, idx) in currentQuestion.options"
                :key="idx"
                class="option-item"
                :class="{ 'selected': currentQuestion.userAnswer === getOptionLetter(option, idx) }"
                @click="selectOption(option, idx)"
              >
                <span class="option-letter">{{ getOptionLetter(option, idx) }}</span>
                <span class="option-text">{{ getOptionContent(option) }}</span>
              </label>
            </div>

            <!-- 多选题选项 -->
            <div class="options-list multi" v-else-if="currentQuestion.type === 'multi'">
              <p class="multi-hint">（多选题，可选择多个答案）</p>
              <label
                v-for="(option, idx) in currentQuestion.options"
                :key="idx"
                class="option-item"
                :class="{ 'selected': isMultiSelected(option, idx) }"
                @click="toggleMultiOption(option, idx)"
              >
                <span class="option-checkbox">{{ isMultiSelected(option, idx) ? '☑' : '☐' }}</span>
                <span class="option-letter">{{ getOptionLetter(option, idx) }}</span>
                <span class="option-text">{{ getOptionContent(option) }}</span>
              </label>
            </div>

            <!-- 判断题选项 -->
            <div class="judge-options" v-else-if="currentQuestion.type === 'judge'">
              <label
                class="judge-item"
                :class="{ 'selected': currentQuestion.userAnswer === '对' }"
                @click="currentQuestion.userAnswer = '对'"
              >
                <span class="judge-icon">✓</span>
                <span class="judge-text">正确</span>
              </label>
              <label
                class="judge-item"
                :class="{ 'selected': currentQuestion.userAnswer === '错' }"
                @click="currentQuestion.userAnswer = '错'"
              >
                <span class="judge-icon">✗</span>
                <span class="judge-text">错误</span>
              </label>
            </div>

            <!-- 代码题输入 -->
            <div class="code-input" v-else-if="currentQuestion.type === 'code'">
              <textarea
                v-model="currentQuestion.userAnswer"
                placeholder="请在此输入你的代码..."
                rows="12"
                class="code-textarea"
              ></textarea>
            </div>

            <!-- 简答题输入 -->
            <div class="short-answer" v-else-if="currentQuestion.type === 'short'">
              <p class="short-hint">（简答题，需要老师人工评分）</p>
              <textarea
                v-model="currentQuestion.userAnswer"
                placeholder="请输入你的答案..."
                rows="6"
              ></textarea>
            </div>

            <!-- 填空题输入 -->
            <div class="fill-blank" v-else>
              <textarea
                v-model="currentQuestion.userAnswer"
                placeholder="请输入你的答案..."
                rows="4"
              ></textarea>
            </div>

            <!-- 导航按钮 -->
            <div class="nav-buttons">
              <button
                class="btn-nav"
                @click="prevQuestion"
                :disabled="currentQuestionIndex === 0"
              >
                上一题
              </button>
              <button
                class="btn-nav"
                @click="nextQuestion"
                :disabled="currentQuestionIndex === questions.length - 1"
              >
                下一题
              </button>
            </div>

            <!-- 提交按钮 -->
            <button
              class="btn-submit-all"
              @click="submitAllAnswers"
              :disabled="!canSubmit || isSubmitting"
              :class="{ 'is-loading': isSubmitting }"
            >
              <span v-if="isSubmitting" class="loading-icon"></span>
              <span>{{ isSubmitting ? gradingProgress || 'AI 正在评分中...' : '提交全部答案' }}</span>
            </button>
            
            <!-- 评分进度提示 -->
            <div v-if="isSubmitting && gradingProgress" class="grading-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (questions.filter(q => q.isCorrect !== null).length / questions.length * 100) + '%' }"></div>
              </div>
              <p class="progress-text">{{ gradingProgress }}，请稍候...</p>
            </div>
          </div>

          <!-- 结果展示 -->
          <div v-else-if="showResult" class="result-panel" key="result">
            <div class="result-header">
              <span class="ai-badge">评分报告</span>
              <button class="close-btn" @click="resetQuiz">重新开始</button>
            </div>

            <div class="score-summary">
              <div class="score-circle" :style="{ borderColor: getScoreColor(totalScore) }">
                <span class="score">{{ totalScore }}</span>
                <span class="unit">分</span>
              </div>
              <div class="score-info">
                <p>正确: {{ correctCount }} / {{ questions.length }}</p>
                <p>正确率: {{ Math.round(correctCount / questions.length * 100) }}%</p>
              </div>
            </div>

            <!-- 详细结果 -->
            <div class="detailed-results">
              <div
                v-for="(q, index) in questions"
                :key="index"
                class="result-item"
                :class="{ 'correct': q.isCorrect, 'wrong': !q.isCorrect }"
              >
                <div class="result-question">
                  <span class="result-number">第 {{ index + 1 }} 题</span>
                  <span class="result-status" v-if="q.type === 'code' && q.score !== undefined">
                    <span :class="getScoreClass(q.score)">{{ getScoreLevel(q.score) }}</span>
                    <span class="code-score">({{ q.score }}分)</span>
                  </span>
                  <span class="result-status" v-else>{{ q.isCorrect ? '✓ 正确' : '✗ 错误' }}</span>
                </div>
                <div class="result-content">
                  <p class="result-q">{{ q.content }}</p>
                  <p class="result-answer">
                    <span class="label">你的答案:</span>
                    <span :class="{ 'wrong-text': !q.isCorrect }">{{ formatAnswer(q.userAnswer) || '未作答' }}</span>
                  </p>
                  <p class="result-correct" v-if="!q.isCorrect && q.type !== 'code' && q.type !== 'short'">
                    <span class="label">正确答案:</span>
                    <span class="correct-text">{{ formatAnswer(q.correctAnswer) }}</span>
                  </p>
                  <p class="result-correct" v-if="q.type === 'short'">
                    <span class="label">参考答案:</span>
                    <span class="correct-text">{{ formatAnswer(q.correctAnswer) }}</span>
                    <span class="manual-hint">（需老师人工评分）</span>
                  </p>
                  <p class="result-correct" v-if="q.type === 'code' && q.correctAnswer">
                    <span class="label">参考答案:</span>
                    <span class="correct-text">{{ q.correctAnswer }}</span>
                  </p>
                  <div class="result-explanation" v-if="q.explanation">
                    <span class="label">解析:</span>
                    <p>{{ q.explanation }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 无题目时的引导 -->
          <div v-else class="guide-section" key="guide">
            <h3>📚 练习模式说明</h3>
            <div class="guide-card">
              <h4>如何开始？</h4>
              <ul class="guide-list">
                <li>1. 选择知识库（默认随机抽取）</li>
                <li>2. 点击"生成题目"获取10-15道练习题</li>
                <li>3. 完成答题后提交获取评分</li>
                <li>4. 查看解析，巩固知识</li>
              </ul>
            </div>
            <div class="tip-box">
              <i class="icon-info">💡</i>
              <p>题目类型包括选择题和填空题，内容来自所选知识库的文档。</p>
            </div>
          </div>
        </Transition>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 状态
const knowledgeList = ref([]);
const selectedKnowledge = ref('');
const questions = ref([]);
const currentQuestionIndex = ref(0);
const isGenerating = ref(false);
const isSubmitting = ref(false);
const showResult = ref(false);
const totalScore = ref(0);
const correctCount = ref(0);
const gradingProgress = ref(''); // 评分进度提示

// MaxKB API 配置
const MAXKB_BASE_URL = 'http://localhost:8090';
const MAXKB_TOKEN = 'Bearer application-bb3982ea3ad34a8264a5ac2f7ce2b78b';

// 获取选项字母 (支持 A-Z)
const getOptionLetter = (option, index) => {
  if (!option) return '';
  // 匹配开头的字母
  const match = option.match(/^([A-Za-z])[\.\、\s]/);
  if (match) {
    return match[1].toUpperCase();
  }
  // 如果没有字母前缀，根据索引返回
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[index] || 'A';
};

// 获取选项内容（去掉字母前缀）
const getOptionContent = (option) => {
  if (!option) return '';
  // 去掉开头的字母和分隔符
  return option.replace(/^[A-Za-z][\.\、\s]?\s*/, '');
};

// 格式化答案显示（处理数组格式）
const formatAnswer = (answer) => {
  if (!answer) return '';
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  return String(answer);
};

// 选择选项
const selectOption = (option, index) => {
  const letter = getOptionLetter(option, index);
  // 如果已选择同一选项，取消选择；否则选择新选项
  if (currentQuestion.value.userAnswer === letter) {
    currentQuestion.value.userAnswer = '';
  } else {
    currentQuestion.value.userAnswer = letter;
  }
};

// 多选题：检查是否选中
const isMultiSelected = (option, index) => {
  const letter = getOptionLetter(option, index);
  const userAnswer = currentQuestion.value.userAnswer || [];
  return Array.isArray(userAnswer) && userAnswer.includes(letter);
};

// 多选题：切换选项
const toggleMultiOption = (option, index) => {
  const letter = getOptionLetter(option, index);
  if (!Array.isArray(currentQuestion.value.userAnswer)) {
    currentQuestion.value.userAnswer = [];
  }
  const idx = currentQuestion.value.userAnswer.indexOf(letter);
  if (idx > -1) {
    currentQuestion.value.userAnswer.splice(idx, 1);
  } else {
    currentQuestion.value.userAnswer.push(letter);
  }
  // 排序答案
  currentQuestion.value.userAnswer.sort();
};

// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null;
});

// 是否可以提交
const canSubmit = computed(() => {
  return questions.value.some(q => q.userAnswer);
});

// 知识库切换
const onKnowledgeChange = () => {
  console.log('切换知识库:', selectedKnowledge.value);
};

// 获取知识库列表
const fetchKnowledgeList = async () => {
  try {
    // 尝试不同的 API 路径
    let response = await fetch(`${MAXKB_BASE_URL}/api/knowledge/workspace/default/knowledge`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MAXKB_TOKEN
      }
    });
    
    // 如果失败，尝试另一个路径
    if (!response.ok) {
      response = await fetch(`${MAXKB_BASE_URL}/api/application/workspace/default/application`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MAXKB_TOKEN
        }
      });
    }
    
    if (response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        knowledgeList.value = data.data || [];
      } catch (e) {
        console.log('知识库列表解析失败，使用默认模式');
        knowledgeList.value = [];
      }
    }
  } catch (error) {
    console.log('获取知识库列表失败，将使用随机模式:', error.message);
    knowledgeList.value = [];
  }
};

// 生成题目
const generateQuestions = async () => {
  isGenerating.value = true;
  questions.value = [];
  currentQuestionIndex.value = 0;
  showResult.value = false;

  try {
    // 获取会话 ID
    console.log('正在获取会话ID...');
    const chatIdResponse = await fetch(`${MAXKB_BASE_URL}/chat/api/open`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MAXKB_TOKEN
      }
    });

    if (!chatIdResponse.ok) {
      throw new Error(`获取会话ID失败: ${chatIdResponse.status}`);
    }
    
    const chatIdData = await chatIdResponse.json();
    console.log('会话ID响应:', chatIdData);
    const chatId = chatIdData.data || chatIdData.id || '';
    
    if (!chatId) {
      throw new Error('无法获取有效的会话ID');
    }
    console.log('获取到的会话ID:', chatId);

    // 构造出题 prompt - 随机生成 10-15 道题
    const questionCount = Math.floor(Math.random() * 6) + 10; // 10-15 道随机

    const prompt = `请根据知识库文档内容生成${questionCount}道练习题。

【强制要求】
1. 只返回纯JSON格式，不要任何其他文字、解释或Markdown格式
2. 不要使用\`\`\`json或\`\`\`代码块标记
3. 直接以 {"questions": 开头，以 } 结尾
4. 题目必须来自知识库内容

返回格式示例：
{"questions":[{"type":"choice","content":"题目内容?","options":["A. 选项1","B. 选项2","C. 选项3","D. 选项4"],"correctAnswer":"A","explanation":"解析"},{"type":"fill","content":"填空题____","correctAnswer":"答案","explanation":"解析"},{"type":"judge","content":"判断题内容","correctAnswer":"对","explanation":"解析"},{"type":"code","content":"代码题要求","correctAnswer":"参考答案","explanation":"评分标准"}]}

现在直接返回JSON：`;

    // 发送出题请求
    const response = await fetch(`${MAXKB_BASE_URL}/chat/api/chat_message/${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MAXKB_TOKEN
      },
      body: JSON.stringify({
        message: prompt,
        stream: false,
        re_chat: true
      })
    });

    const data = await response.json();
    console.log('MaxKB 完整响应:', data);
    
    // 检查是否返回错误
    if (data.code !== 200) {
      if (data.message && data.message.includes('访问次数')) {
        throw new Error('MaxKB 访问次数超限，请稍后再试');
      }
      throw new Error(data.message || 'MaxKB 返回错误');
    }
    
    const aiReply = data.data?.content || data.content || data.answer || '';
    console.log('提取的回复内容:', aiReply);
    
    if (!aiReply) {
      throw new Error('MaxKB 返回内容为空');
    }
    
    // 解析题目
    parseQuestions(aiReply);

  } catch (error) {
    console.error('生成题目失败:', error);
    alert('生成题目失败: ' + error.message);
  } finally {
    isGenerating.value = false;
  }
};

// 解析 AI 返回的题目
const parseQuestions = (text) => {
  console.log('MaxKB 返回原始内容:', text);
  
  try {
    // 预处理：清理各种干扰字符
    let cleanedText = text;
    
    // 移除 markdown 代码块标记
    cleanedText = cleanedText.replace(/```json\s*/gi, '');
    cleanedText = cleanedText.replace(/```\s*/g, '');
    
    // 移除 "复制代码" 等文字
    cleanedText = cleanedText.replace(/复制代码/g, '');
    
    // 【关键修复】替换中文标点为英文标点
    cleanedText = cleanedText.replace(/"/g, '"');
    cleanedText = cleanedText.replace(/"/g, '"');
    cleanedText = cleanedText.replace(/'/g, "'");
    cleanedText = cleanedText.replace(/'/g, "'");
    cleanedText = cleanedText.replace(/，/g, ',');
    cleanedText = cleanedText.replace(/：/g, ':');
    cleanedText = cleanedText.replace(/【/g, '[');
    cleanedText = cleanedText.replace(/】/g, ']');
    
    // 【修复】无效转义字符
    cleanedText = cleanedText.replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
    
    // 【修复】移除不可见字符
    cleanedText = cleanedText.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    
    // 【关键修复】处理代码块中的换行符
    // 把 ```代码块``` 里面的换行符替换成 \n 转义序列
    cleanedText = cleanedText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      // 把代码里的换行符转义
      const escapedCode = code.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      return '```' + lang + '\\n' + escapedCode + '```';
    });
    
    console.log('清理后内容长度:', cleanedText.length);
    
    // 【新方法】提取所有 JSON 对象
    const allQuestions = [];
    let searchStart = 0;
    
    while (searchStart < cleanedText.length) {
      // 找下一个 { 
      const braceIdx = cleanedText.indexOf('{', searchStart);
      if (braceIdx === -1) break;
      
      // 使用状态机找到匹配的结束大括号
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let endIdx = -1;
      
      for (let i = braceIdx; i < cleanedText.length; i++) {
        const char = cleanedText[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
      }
      
      if (endIdx === -1) {
        searchStart = braceIdx + 1;
        continue;
      }
      
      // 提取这个 JSON 字符串
      let jsonStr = cleanedText.substring(braceIdx, endIdx);
      
      // 调试：打印原始 JSON 片段
      console.log('原始 JSON (前200字符):', jsonStr.substring(0, 200));
      
      // 【关键修复】修复JSON字符串值里的问题
      // 1. 换行符需要转义
      // 2. 字符串内部的双引号需要转义
      let fixedJson = '';
      let inJsonString = false;
      let jsonEscape = false;
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (jsonEscape) {
          fixedJson += char;
          jsonEscape = false;
          continue;
        }
        
        if (char === '\\' && inJsonString) {
          fixedJson += char;
          jsonEscape = true;
          continue;
        }
        
        // 处理字符串外的反斜杠（可能是错误的转义）
        if (char === '\\' && !inJsonString) {
          // 跳过字符串外的孤立反斜杠
          continue;
        }
        
        if (char === '"') {
          if (!inJsonString) {
            // 开始一个字符串
            inJsonString = true;
            fixedJson += char;
          } else {
            // 检查这个引号是字符串结束还是内部引号
            // 如果后面紧跟的是 : , } ] 或空白+这些字符，说明是字符串结束
            const rest = jsonStr.substring(i + 1).trimStart();
            const nextChar = rest.charAt(0);
            if ([':', ',', '}', ']', '\n', '\r', ''].includes(nextChar) || rest === '') {
              inJsonString = false;
              fixedJson += char;
            } else {
              // 这是字符串内部的引号，需要转义
              fixedJson += '\\"';
            }
          }
          continue;
        }
        
        // 在字符串里面遇到换行符，转义它
        if (inJsonString) {
          if (char === '\n') {
            fixedJson += '\\n';
          } else if (char === '\r') {
            fixedJson += '\\r';
          } else if (char === '\t') {
            fixedJson += '\\t';
          } else {
            fixedJson += char;
          }
        } else {
          fixedJson += char;
        }
      }
      
      // 尝试解析
      try {
        // 【修复1】移除尾随逗号（数组/对象最后一个元素后的逗号）
        let repairJson = fixedJson
          .replace(/,\s*\]/g, ']')   // 数组尾随逗号
          .replace(/,\s*\}/g, '}');  // 对象尾随逗号
        
        // 调试：打印修复后的 JSON 片段
        console.log('修复后 JSON (前300字符):', repairJson.substring(0, 300));
        
        let parsed;
        try {
          parsed = JSON.parse(repairJson);
        } catch (parseError) {
          // 【修复2】尝试添加缺失的逗号（保守方式）
          // 情况：`"correctAnswer": "A"\n"explanation"` 缺少逗号
          repairJson = repairJson.replace(/"\s*\n\s*"/g, '",\n"');
          console.log('添加逗号后 JSON (前300字符):', repairJson.substring(0, 300));
          parsed = JSON.parse(repairJson);
        }
        
        // 如果有 questions 数组，提取里面的题目
        if (parsed.questions && Array.isArray(parsed.questions)) {
          allQuestions.push(...parsed.questions);
        } 
        // 如果是单个题目对象（有 type 字段）
        else if (parsed.type && parsed.content) {
          allQuestions.push(parsed);
        }
        
        console.log('解析到一个 JSON，当前题目总数:', allQuestions.length);
      } catch (e) {
        console.log('JSON 解析失败，跳过:', e.message.substring(0, 50));
      }
      
      searchStart = endIdx;
    }
    
    if (allQuestions.length === 0) {
      // 【备用】尝试从 Markdown 格式解析
      console.log('JSON 解析失败，尝试 Markdown 解析...');
      const markdownQuestions = parseMarkdownQuestions(cleanedText);
      if (markdownQuestions.length > 0) {
        questions.value = markdownQuestions;
        console.log('成功从 Markdown 解析题目:', questions.value.length, '道');
        return;
      }
      
      throw new Error('未找到有效的题目数据');
    }
    
    // 处理所有题目
    questions.value = allQuestions.map(q => {
      // 【修复】标准化题型名称
      let type = q.type || 'fill';
      
      // 映射各种题型名称
      const typeMap = {
        'choose': 'choice',
        'true/false': 'judge',
        'calc': 'fill',       // 计算题 → 填空题
        'sort': 'fill',       // 排序题 → 填空题
        'graph': 'judge',     // 图形题 → 判断题
        'function': 'code',   // 函数题 → 代码题
      };
      
      if (typeMap[type]) {
        type = typeMap[type];
      }
      
      // 【关键修复】智能检测题型
      const hasOptions = Array.isArray(q.options) && q.options.length >= 2;
      const correctAnswer = q.correctAnswer || q.correct || '';
      
      // 检测多选题：correctAnswer 是数组
      if (hasOptions && Array.isArray(correctAnswer) && correctAnswer.length > 0) {
        type = 'multi';
      }
      // 检测选择题：correctAnswer 是单个字母
      else if (hasOptions && typeof correctAnswer === 'string') {
        const answerLetter = correctAnswer.toUpperCase();
        if (/^[A-E]$/.test(answerLetter)) {
          type = 'choice';
        }
      }
      // 检测简答题：答案是很长的文本
      else if (type === 'short' || (typeof correctAnswer === 'string' && correctAnswer.length > 50)) {
        type = 'short';
      }
      
      // 处理选项（选择题和多选题）
      let options = [];
      if ((type === 'choice' || type === 'multi') && hasOptions) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        options = q.options.map((opt, idx) => {
          if (typeof opt === 'string' && !opt.match(/^[A-Za-z][\.\、\s]/)) {
            return `${letters[idx]}. ${opt}`;
          }
          return opt;
        });
      }
      
      // 标准化答案格式
      let normalizedAnswer = correctAnswer;
      if (typeof normalizedAnswer === 'string' && normalizedAnswer.length === 1) {
        normalizedAnswer = normalizedAnswer.toUpperCase();
      }
      // 多选题答案转大写数组
      if (Array.isArray(normalizedAnswer)) {
        normalizedAnswer = normalizedAnswer.map(a => typeof a === 'string' ? a.toUpperCase() : a);
      }
      
      return {
        ...q,
        type,
        options,
        correctAnswer: normalizedAnswer,
        userAnswer: type === 'multi' ? [] : '',
        isCorrect: null
      };
    });
    
    console.log('成功解析题目:', questions.value.length, '道');
    
  } catch (e) {
    console.error('解析题目异常:', e);
    alert('题目生成失败: ' + e.message);
  }
};

// 从 Markdown 格式解析题目（备用方案）
const parseMarkdownQuestions = (text) => {
  const questions = [];
  console.log('尝试 Markdown 解析...');
  
  // 【检测问答题格式】如果是问答题格式（长答案），直接返回空
  const isQAType = text.includes('### 基础题') ||
                   text.includes('### 进阶题') ||
                   text.includes('### 答案参考') ||
                   text.includes('### 总结');
  
  if (isQAType) {
    console.log('检测到问答题格式，不支持解析');
    return [];
  }
  
  // ========== 选择题 ==========
  // 格式1: **选择题**：题目内容 后面跟选项和答案
  // 格式2: 数字. 题目内容 后面跟选项和答案
  
  // 【格式1】- **选择题**：题目内容
  const choiceFormat1 = /[-*]\s*\*\*选择题\*\*[：:]\s*([^\n]+)\n\s*([A-E])\.\s*([^\n]+)\n\s*([A-E])\.\s*([^\n]+)\n\s*([A-E])\.\s*([^\n]+)(?:\n\s*([A-E])\.\s*([^\n]+))?(?:\n\s*([A-E])\.\s*([^\n]+))?(?:\n\s*\*\*正确答案[：:]\s*([A-E])\*\*)?/g;
  let m1;
  while ((m1 = choiceFormat1.exec(text)) !== null) {
    const content = m1[1].trim();
    if (content.length < 5 || content.includes('答案')) continue;
    
    const options = [];
    const letters = [m1[2], m1[4], m1[6]];
    const contents = [m1[3], m1[5], m1[7]];
    if (m1[8] && m1[9]) { letters.push(m1[8]); contents.push(m1[9]); }
    if (m1[10] && m1[11]) { letters.push(m1[10]); contents.push(m1[11]); }
    
    for (let i = 0; i < letters.length; i++) {
      options.push(`${letters[i]}. ${contents[i].trim()}`);
    }
    
    const correctAnswer = m1[12] || 'A';
    questions.push({
      type: 'choice',
      content,
      options,
      correctAnswer,
      explanation: '',
      userAnswer: '',
      isCorrect: null
    });
  }
  
  // 【格式2】数字. 题目内容 后面跟选项和 **正确答案**
  const choiceFormat2 = /(\d+)\.\s*([^\n]+)\n\s*([A-E])\.\s*([^\n]+)\n\s*([A-E])\.\s*([^\n]+)\n\s*([A-E])\.\s*([^\n]+)(?:\n\s*([A-E])\.\s*([^\n]+))?(?:\n\s*([A-E])\.\s*([^\n]+))?\n\s*\*\*正确答案[：:]\s*([A-E])\*\*/g;
  let m2;
  while ((m2 = choiceFormat2.exec(text)) !== null) {
    const content = m2[2].trim();
    if (content.length < 5 || content.includes('答案')) continue;
    
    const options = [
      `${m2[3]}. ${m2[4].trim()}`,
      `${m2[5]}. ${m2[6].trim()}`,
      `${m2[7]}. ${m2[8].trim()}`
    ];
    if (m2[9] && m2[10]) options.push(`${m2[9]}. ${m2[10].trim()}`);
    if (m2[11] && m2[12]) options.push(`${m2[11]}. ${m2[12].trim()}`);
    
    questions.push({
      type: 'choice',
      content,
      options,
      correctAnswer: m2[13],
      explanation: '',
      userAnswer: '',
      isCorrect: null
    });
  }
  
  // ========== 填空题 ==========
  // 格式: **填空题**：题目内容________答案
  const fillPattern = /[-*]\s*\*\*填空题\*\*[：:]\s*([^\n]*)(?:_+|_{2,})([^\n]*)/g;
  let fillMatch;
  while ((fillMatch = fillPattern.exec(text)) !== null) {
    const content = fillMatch[1].trim();
    const answer = fillMatch[2].trim();
    if (content.length > 5 && answer.length > 0 && answer.length < 50) {
      questions.push({
        type: 'fill',
        content: content + ' ____',
        correctAnswer: answer,
        explanation: '',
        userAnswer: '',
        isCorrect: null
      });
    }
  }
  
  // ========== 判断题 ==========
  // 格式1: **判断题**：题目内容。（对/错）或 (√/×)
  // 格式2: 题目内容 **正确答案：对/错**
  
  const judgeFormat1 = /[-*]\s*\*\*判断题\*\*[：:]\s*([^\n]+?)(?:（(对|错|√|×)）|(?:\*\*正确答案[：:]\s*(对|错)\*\*))?/g;
  let jm1;
  while ((jm1 = judgeFormat1.exec(text)) !== null) {
    let content = jm1[1].trim();
    // 清理末尾的符号
    content = content.replace(/[（(][√×对错][）)]$/g, '').trim();
    if (content.length > 5 && !content.includes('答案')) {
      // 如果有明确答案就用，否则默认"对"
      const answer = jm1[2] || jm1[3] || '对';
      const normalizedAnswer = ['√', '对', '是', 'true'].includes(answer) ? '对' : '错';
      questions.push({
        type: 'judge',
        content,
        correctAnswer: normalizedAnswer,
        explanation: '',
        userAnswer: '',
        isCorrect: null
      });
    }
  }
  
  // 格式2: 数字. 题目内容 **正确答案：对/错**
  const judgeFormat2 = /(\d+)\.\s*([^\n]+?)\s*\*\*正确答案[：:]\s*(对|错)\*\*/g;
  let jm2;
  while ((jm2 = judgeFormat2.exec(text)) !== null) {
    const content = jm2[2].trim();
    if (content.length > 5 && !content.includes('答案')) {
      questions.push({
        type: 'judge',
        content,
        correctAnswer: jm2[3],
        explanation: '',
        userAnswer: '',
        isCorrect: null
      });
    }
  }
  
  // ========== 代码题 ==========
  const codePattern = /[-*]\s*\*\*代码题\*\*[：:]\s*([^\n]+)/g;
  let codeMatch;
  while ((codeMatch = codePattern.exec(text)) !== null) {
    const content = codeMatch[1].trim();
    if (content.length > 5) {
      questions.push({
        type: 'code',
        content,
        correctAnswer: '参考代码实现',
        explanation: '',
        userAnswer: '',
        isCorrect: null
      });
    }
  }
  
  console.log('Markdown 解析结果:', questions.length, '道有效题目');
  return questions;
};

// 提交全部答案 - 选择题/填空题/判断题本地评分，代码题调用 MaxKB 评分
const submitAllAnswers = async () => {
  isSubmitting.value = true;
  gradingProgress.value = '正在评分...';

  let score = 0;
  let correct = 0;
  const totalQuestions = questions.value.length;
  const pointsPerQuestion = Math.round(100 / totalQuestions);

  // 先收集代码题，需要调用 MaxKB 评分
  const codeQuestions = questions.value.filter(q => q.type === 'code' && q.userAnswer && q.userAnswer.trim());
  
  // 如果有代码题，获取会话 ID
  let chatId = '';
  if (codeQuestions.length > 0) {
    try {
      const chatIdResponse = await fetch(`${MAXKB_BASE_URL}/chat/api/open`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MAXKB_TOKEN
        }
      });
      const chatIdData = await chatIdResponse.json();
      chatId = chatIdData.data || chatIdData.id || '';
    } catch (e) {
      console.error('获取会话ID失败:', e);
    }
  }

  for (let i = 0; i < questions.value.length; i++) {
    const q = questions.value[i];
    
    // 显示评分进度
    gradingProgress.value = `正在评分: ${i + 1}/${totalQuestions} 题`;
    
    // 模拟短暂延迟，让用户看到进度
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (!q.userAnswer || !String(q.userAnswer).trim()) {
      q.isCorrect = false;
      q.score = 0;
      continue;
    }

    // 检查 correctAnswer 是否存在
    const hasCorrectAnswer = Array.isArray(q.correctAnswer) 
      ? q.correctAnswer.length > 0 
      : q.correctAnswer && String(q.correctAnswer).trim();
    
    if (!hasCorrectAnswer) {
      console.warn('题目缺少正确答案:', q.content);
      q.isCorrect = false;
      q.score = 0;
      continue;
    }

    // 【修复】确保答案是字符串类型
    const correctAnswerStr = Array.isArray(q.correctAnswer) 
      ? q.correctAnswer.join(',') 
      : String(q.correctAnswer || '');
    
    const userAnswerStr = Array.isArray(q.userAnswer)
      ? q.userAnswer.join(',')
      : String(q.userAnswer || '');
    
    const userAnswerUpper = userAnswerStr.toUpperCase().trim();
    const correctAnswerUpper = correctAnswerStr.toUpperCase().trim();
    
    if (q.type === 'choice') {
      // 选择题：只比较选项字母
      q.isCorrect = userAnswerUpper === correctAnswerUpper;
      q.score = q.isCorrect ? 100 : 0;
    } else if (q.type === 'multi') {
      // 多选题：数组完全匹配
      const userArr = userAnswerStr.split(',').map(s => s.trim()).sort();
      const correctArr = correctAnswerStr.split(',').map(s => s.trim()).sort();
      q.isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
      // 多选题部分正确给部分分
      const matched = userArr.filter(a => correctArr.includes(a)).length;
      if (q.isCorrect) {
        q.score = 100;
      } else if (matched > 0 && userArr.length <= correctArr.length) {
        q.score = Math.round((matched / correctArr.length) * 100);
      } else {
        q.score = 0;
      }
    } else if (q.type === 'judge') {
      // 判断题：标准化答案比较
      // 正确答案的可能格式: "对", "是", "true", "正确"
      // 错误答案的可能格式: "错", "否", "false", "错误"
      const normalizeJudgeAnswer = (ans) => {
        const a = ans.toLowerCase().trim();
        if (['对', '是', 'true', '正确', 'yes', '√', '✓'].includes(a)) return '对';
        if (['错', '否', 'false', '错误', 'no', '×', '✗'].includes(a)) return '错';
        return a;
      };
      const normalizedUser = normalizeJudgeAnswer(userAnswerUpper);
      const normalizedCorrect = normalizeJudgeAnswer(correctAnswerUpper);
      q.isCorrect = normalizedUser === normalizedCorrect;
      q.score = q.isCorrect ? 100 : 0;
    } else if (q.type === 'code') {
      // 代码题：调用 MaxKB 评分
      gradingProgress.value = `正在评分: ${i + 1}/${totalQuestions} 题 (代码题评分中...)`;
      const result = await gradeCodeQuestion(chatId, q);
      q.isCorrect = result.isCorrect;
      // 代码题按实际得分比例计算
      score += Math.round(pointsPerQuestion * (result.score / 100));
      if (q.isCorrect) correct++;
      continue; // 跳过下面的统分逻辑
    } else if (q.type === 'short') {
      // 简答题：需要人工评分，暂时给0分并标记
      q.isCorrect = false;
      q.score = 0;
      q.needsManualGrading = true;
    } else {
      // 填空题：模糊匹配
      q.isCorrect = userAnswerUpper === correctAnswerUpper || 
                   userAnswerUpper.includes(correctAnswerUpper) ||
                   correctAnswerUpper.includes(userAnswerUpper);
      q.score = q.isCorrect ? 100 : 0;
    }
    
    if (q.isCorrect) {
      score += pointsPerQuestion;
      correct++;
    }
  }

  // 确保总分不超过 100
  totalScore.value = Math.min(score, 100);
  correctCount.value = correct;
  showResult.value = true;
  gradingProgress.value = '';
  isSubmitting.value = false;
};

// 代码题评分 - 调用 MaxKB
const gradeCodeQuestion = async (chatId, question) => {
  if (!chatId) {
    // 无法调用 MaxKB，默认给 60% 分
    return { isCorrect: false, score: 0 };
  }

  const prompt = `你是一位专业的代码评审专家。请评判以下代码：

题目要求：${question.content}

参考答案/评分标准：
${question.correctAnswer}

用户提交的代码：
${question.userAnswer}

请根据以下标准评分：
- 优秀(90-100分)：代码完全正确，逻辑清晰，风格规范
- 良好(80-89分)：代码基本正确，有小瑕疵但不影响功能
- 及格(60-79分)：代码思路正确，但有明显错误或不完整
- 不及格(0-59分)：代码错误较多或完全错误

请只返回JSON格式：
{
  "score": 0-100的分数,
  "level": "优秀/良好/及格/不及格",
  "explanation": "简短的评分说明（100字以内）"
}`;

  try {
    const response = await fetch(`${MAXKB_BASE_URL}/chat/api/chat_message/${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MAXKB_TOKEN
      },
      body: JSON.stringify({
        message: prompt,
        stream: false,
        re_chat: true
      })
    });

    const data = await response.json();
    const aiReply = data.data?.content || '';
    console.log('代码题评分原始回复:', aiReply);
    
    // 解析 AI 返回的 JSON（复用修复逻辑）
    let jsonStr = aiReply;
    
    // 提取 JSON 部分
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('未找到 JSON 格式');
      return { isCorrect: false, score: 0 };
    }
    
    jsonStr = jsonMatch[0];
    
    // 修复 JSON 字符串值里的问题
    let fixedJson = '';
    let inJsonString = false;
    let jsonEscape = false;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      
      if (jsonEscape) {
        fixedJson += char;
        jsonEscape = false;
        continue;
      }
      
      if (char === '\\' && inJsonString) {
        fixedJson += char;
        jsonEscape = true;
        continue;
      }
      
      if (char === '"') {
        if (!inJsonString) {
          inJsonString = true;
          fixedJson += char;
        } else {
          const rest = jsonStr.substring(i + 1).trimStart();
          const nextChar = rest.charAt(0);
          if ([':', ',', '}', ']', '\n', '\r', ''].includes(nextChar) || rest === '') {
            inJsonString = false;
            fixedJson += char;
          } else {
            fixedJson += '\\"';
          }
        }
        continue;
      }
      
      if (inJsonString) {
        if (char === '\n') {
          fixedJson += '\\n';
        } else if (char === '\r') {
          fixedJson += '\\r';
        } else if (char === '\t') {
          fixedJson += '\\t';
        } else {
          fixedJson += char;
        }
      } else {
        fixedJson += char;
      }
    }
    
    // 尝试解析修复后的 JSON
    try {
      const parsed = JSON.parse(fixedJson);
      // 更新解析内容
      if (parsed.explanation) {
        question.explanation = parsed.explanation;
      }
      if (parsed.level) {
        question.level = parsed.level;
      }
      const score = parsed.score || 0;
      question.score = score;
      // 分数 >= 60 算正确
      return { isCorrect: score >= 60, score };
    } catch (parseError) {
      console.log('JSON 解析仍失败，尝试提取数字:', parseError.message);
      // 尝试直接提取分数数字
      const scoreMatch = aiReply.match(/"score"\s*:\s*(\d+)/);
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        question.score = score;
        return { isCorrect: score >= 60, score };
      }
    }
  } catch (e) {
    console.error('代码题评分失败:', e);
  }
  
  return { isCorrect: false, score: 0 };
};

// 重置
const resetQuiz = () => {
  questions.value = [];
  currentQuestionIndex.value = 0;
  showResult.value = false;
  totalScore.value = 0;
  correctCount.value = 0;
};

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
  }
};

// 分数颜色
const getScoreColor = (s) => {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#eab308';
  return '#ef4444';
};

// 评分等级
const getScoreLevel = (s) => {
  if (s >= 90) return '优秀';
  if (s >= 80) return '良好';
  if (s >= 60) return '及格';
  return '不及格';
};

// 评分等级样式类
const getScoreClass = (s) => {
  if (s >= 90) return 'level-excellent';
  if (s >= 80) return 'level-good';
  if (s >= 60) return 'level-pass';
  return 'level-fail';
};

onMounted(() => {
  fetchKnowledgeList();
});
</script>

<style scoped>
/* -----------------------------------------------------------
   1. 基础布局与氛围
----------------------------------------------------------- */
.practice-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #020617; /* 深邃底色 */
  color: #f8fafc;
  overflow: hidden;
  position: relative;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.practice-container::before {
  content: '';
  position: absolute;
  bottom: -10%; left: -10%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}

/* -----------------------------------------------------------
   2. 顶部导航
----------------------------------------------------------- */
.practice-nav {
  height: 80px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  z-index: 10;
}

.nav-brand .main-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #ffffff; 
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
}

.nav-brand .sub-title {
  font-size: 0.75rem;
  color: #60a5fa;
  opacity: 0.8;
}

/* -----------------------------------------------------------
   3. 左侧题目列表 (已修饰宽度与省略)
----------------------------------------------------------- */
.questions-section {
  width: 300px; /* 固定宽度 */
  min-width: 300px;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.section-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0; /* 禁止伸缩 */
}

.question-card:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(6, 182, 212, 0.4);
}

.question-card.active {
  background: rgba(6, 182, 212, 0.15);
  border-color: #06b6d4;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-number { font-weight: bold; font-size: 0.9rem; }

.question-preview {
  font-size: 0.8rem;
  color: #94a3b8;
  white-space: nowrap; /* 禁止换行 */
  overflow: hidden; /* 超出隐藏 */
  text-overflow: ellipsis; /* 省略号 */
}

/* -----------------------------------------------------------
   4. 右侧答题区 (选项变按钮)
----------------------------------------------------------- */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.answer-section {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: radial-gradient(circle at top right, rgba(30, 41, 59, 0.5), transparent);
}

.answer-panel {
  max-width: 800px;
  margin: 0 auto;
}

.question-content {
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 30px;
  color: #f1f5f9;
}

/* 选项按钮化 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.option-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(6, 182, 212, 0.5);
}

.option-item.selected {
  background: rgba(6, 182, 212, 0.2);
  border-color: #06b6d4;
  color: #22d3ee;
}

.option-letter {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
}

.selected .option-letter {
  background: #06b6d4;
  color: white;
}

/* -----------------------------------------------------------
   5. 输入框美化 (Textarea)
----------------------------------------------------------- */
textarea {
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
  color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  outline: none;
}

textarea:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
  background: rgba(15, 23, 42, 1);
}

/* -----------------------------------------------------------
   6. 按钮修饰 (上一题/下一题/提交)
----------------------------------------------------------- */
.nav-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.btn-nav {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-submit-all {
  width: 100%;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
}

.btn-submit-all:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5);
  filter: brightness(1.1);
}

/* -----------------------------------------------------------
   7. 评分与结果
----------------------------------------------------------- */
.result-panel {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.score-circle {
  width: 120px;
  height: 120px;
  border: 8px solid #06b6d4;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.score-circle .score { font-size: 2.5rem; font-weight: 800; }

/* -----------------------------------------------------------
   8. 判断题专用样式 (修复按钮化)
----------------------------------------------------------- */
.judge-options {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.judge-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 12px;
}

.judge-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 选中状态：正确（青色/绿色系） */
.judge-item.selected:has(.judge-icon:contains('✓')), 
.judge-item.selected {
  background: rgba(6, 182, 212, 0.15);
  border-color: #06b6d4;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
}

.judge-item.selected .judge-text {
  color: #22d3ee;
  font-weight: bold;
}

.judge-icon {
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  transition: all 0.3s;
}

.judge-item.selected .judge-icon {
  background: #06b6d4;
  color: white;
  transform: scale(1.1);
}

/* 特殊处理错误选项的颜色（可选，如果不想要全青色） */
.judge-item:last-child.selected {
  border-color: #f43f5e; /* 红色边框 */
  background: rgba(244, 63, 94, 0.1);
}
.judge-item:last-child.selected .judge-icon {
  background: #f43f5e;
}
.judge-item:last-child.selected .judge-text {
  color: #fb7185;
}

/* -----------------------------------------------------------
   9. 补充：列表卡片分隔感
----------------------------------------------------------- */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 每一题之间留出间距 */
  padding-right: 5px;
}

.answer-status {
  font-size: 0.8rem;
  margin-left: auto;
}

.answer-status.answered {
  color: #06b6d4; /* 已作答显示青色圆点 */
  text-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
}

/* -----------------------------------------------------------
   顶部操作区样式：随机知识库下拉框 & 生成题目按钮
----------------------------------------------------------- */

/* 下拉选择框容器 */
.actions {
  display: flex;
  align-items: center;
  gap: 16px; /* 下拉框和按钮之间的间距 */
}
.knowledge-select {
  background: rgba(30, 41, 59, 0.7); /* 深色透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  padding: 10px 16px;
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none; /* 移除原生箭头以进行自定义 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px; /* 为自定义箭头留出空间 */
  min-width: 180px;
}

.knowledge-select:hover {
  background-color: rgba(51, 65, 85, 0.8);
  border-color: rgba(6, 182, 212, 0.5); /* 悬浮时青色边框 */
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.1);
}

.knowledge-select:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
}

/* 生成题目按钮 - 电光青渐变风格 */
.btn-generate {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px); /* 悬浮上浮效果 */
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.5);
  filter: brightness(1.1);
}

.btn-generate:active:not(:disabled) {
  transform: translateY(0);
}

.btn-generate:disabled {
  background: #334155;
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

/* 按钮内的加载动画修饰 */
.loading-icon {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .main-content { flex-direction: column; }
  .questions-section { width: 100%; height: 200px; border-right: none; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
}
</style>