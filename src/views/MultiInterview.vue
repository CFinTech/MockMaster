<template>
  <div class="container">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <a href="#" class="back-button">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="#4CAF50"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        返回主页
      </a>
      <div class="user-profile">
        <span class="user-name">{{ userName }}</span>
        <div class="user-avatar">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="8" r="4" fill="#4CAF50" />
            <path
              d="M5.33788 18.3206C5.99897 15.5269 8.77173 14 11.6426 14H12.3574C15.2283 14 18.001 15.5269 18.6621 18.3206C18.79 18.8611 18.8917 19.4268 18.9489 20.0016C18.9825 20.3343 18.7117 20.6084 18.3776 20.5528C15.855 20.1357 13.073 20 12 20C10.927 20 8.14501 20.1357 5.62236 20.5528C5.28835 20.6084 5.0175 20.3343 5.0511 20.0016C5.1083 19.4268 5.20997 18.8611 5.33788 18.3206Z"
              fill="#4CAF50"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧视频区域 -->
      <div class="video-section">
        <div class="section-header">
          群体面试 - {{ participants.length }} 人参与
        </div>
        <div class="video-grid" id="video-grid">
          <div class="video-item" v-for="(p, i) in participants" :key="i">
            <video
              autoplay
              playsinline
              :ref="(el) => (videoElements[i] = el)"
            ></video>
            <div class="participant-info">
              <div class="participant-avatar">{{ p.initial }}</div>
              <span>{{ p.name }}<span v-if="p.isSelf"> (您)</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-section">
        <div class="section-header">群聊</div>
        <div class="chat-messages" id="chat-messages">
          <div class="message" v-for="(msg, idx) in chatMessages" :key="idx">
            <div class="message-header">
              <div class="message-avatar">{{ msg.avatar }}</div>
              <span class="message-sender">{{ msg.sender }}</span>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <div class="message-content">{{ msg.content }}</div>
          </div>
        </div>
        <div class="chat-input">
          <form class="chat-form" id="chat-form" @submit.prevent="sendMessage">
            <input
              v-model="inputText"
              type="text"
              class="chat-input-field"
              placeholder="输入消息..."
            />
            <button type="submit" class="send-button">发送</button>
          </form>
        </div>
      </div>

      <!-- AI分析区域 -->
      <div class="ai-analysis-section">
        <div class="analysis-header">AI面试反馈</div>
        <div class="ai-feedback" id="analysis-content">
          <div v-for="(f, i) in analysisFeedback" :key="i">{{ f }}</div>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="controls">
      <button
        id="start-camera"
        class="control-btn"
        @click="startCamera"
        :disabled="cameraOn"
      >
        开启摄像头
      </button>
      <button
        id="stop-camera"
        class="control-btn stop"
        @click="stopCamera"
        :disabled="!cameraOn"
      >
        关闭摄像头
      </button>
      <button id="analyze-btn" class="control-btn" @click="analyze">
        开启AI分析
      </button>
    </div>

    <!-- 底部栏 -->
    <div class="footer">
      <div class="footer-links">
        <a href="#" class="footer-link">关于我们</a>
        <a href="#" class="footer-link">隐私政策</a>
        <a href="#" class="footer-link">使用条款</a>
      </div>
      <div class="copyright">© 2025 AI面试助手 | 由智能人机交互团队制作</div>
      <div class="version">v1.0.0</div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, onUnmounted } from "vue";

// 参与者列表
const participants = [
  { name: "张小明", initial: "张", isSelf: true },
  { name: "王丽", initial: "王", isSelf: false },
  { name: "李强", initial: "李", isSelf: false },
  { name: "赵敏", initial: "赵", isSelf: false },
  { name: "刘伟", initial: "刘", isSelf: false },
  { name: "陈芳", initial: "陈", isSelf: false },
];

const userName = ref("张小明");
const cameraOn = ref(false);
const videoElements = ref([]);
let stream = null;

// 聊天消息
const chatMessages = ref([
  {
    avatar: "王",
    sender: "王丽",
    time: "10:23",
    content: "大家好，我是王丽，很高兴参加这次群面！",
  },
  {
    avatar: "李",
    sender: "李强",
    time: "10:24",
    content: "大家好，我是李强，期待与各位合作完成今天的面试任务",
  },
  {
    avatar: "张",
    sender: "张小明",
    time: "10:25",
    content: "大家好，我是张小明，很高兴认识各位",
  },
]);
const inputText = ref("");

// AI 分析反馈
const analysisFeedback = ref([]);

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function startCamera() {
  if (!cameraOn.value) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // 仅设置第一个视频元素
      const firstVideo = videoElements.value[0];
      if (firstVideo) {
        firstVideo.srcObject = stream;
      }
      cameraOn.value = true;
    } catch (err) {
      console.error("无法开启摄像头:", err);
    }
  }
}

function stopCamera() {
  if (cameraOn.value && stream) {
    stream.getTracks().forEach((track) => track.stop());
    cameraOn.value = false;
  }
}

function analyze() {
  // 模拟 AI 分析结果
  analysisFeedback.value = [
    "请注意群体互动时的眼神交流。",
    "尝试在讨论中更积极地发言。",
    "团队合作时，多给予他人回应。",
  ];
}

function sendMessage() {
  if (inputText.value.trim()) {
    chatMessages.value.push({
      avatar: "张",
      sender: "张小明",
      time: formatTime(new Date()),
      content: inputText.value.trim(),
    });
    inputText.value = "";
    setTimeout(() => {
      const chat = document.getElementById("chat-messages");
      if (chat) chat.scrollTop = chat.scrollHeight;
    });
  }
}

onUnmounted(() => {
  if (stream) stream.getTracks().forEach((track) => track.stop());
});
</script>
  
  <style scoped src="../assets/multi_interview.css" />
  