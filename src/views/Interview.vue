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
      <!-- 左侧摄像头区域 -->
      <div class="camera-section">
        <div class="section-header">您的面试</div>
        <div class="camera-container">
          <div class="status-indicator">
            摄像头: {{ cameraOn ? "已开启" : "等待开启" }}
          </div>
          <div class="analysis-indicator">
            AI分析: {{ analysisReady ? "就绪" : "准备就绪" }}
          </div>
          <video ref="cameraView" id="camera-view" autoplay playsinline></video>
        </div>
        <div class="camera-controls">
          <button @click="startCamera" class="control-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- 摄像头图标路径 -->
            </svg>
            开启摄像头
          </button>
          <button
            @click="stopCamera"
            :disabled="!cameraOn"
            :class="['control-btn', 'stop', { disabled: !cameraOn }]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- 关闭图标路径 -->
            </svg>
            关闭摄像头
          </button>
          <button @click="analyze" class="control-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- 分析图标路径 -->
            </svg>
            <span class="analyze-btn-text">{{
              analysisReady ? "重新分析" : "开启AI分析"
            }}</span>
          </button>
        </div>
      </div>

      <!-- 右侧反馈区域 -->
      <div class="feedback-section">
        <div class="section-header">AI面试反馈</div>
        <div class="content">
          <div class="ai-feedback" id="feedback-container">
            <div
              v-for="(item, index) in feedbackList"
              :key="index"
              class="feedback-item"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增底部栏 -->
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
import { ref, onMounted, onUnmounted } from "vue";

const userName = ref("张小明");
const cameraOn = ref(false);
const analysisReady = ref(false);
const feedbackList = ref([]);
const cameraView = ref(null);
let stream = null;

const startCamera = async () => {
  if (!cameraOn.value) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraView.value.srcObject = stream;
      cameraOn.value = true;
    } catch (err) {
      console.error("无法开启摄像头:", err);
    }
  }
};

const stopCamera = () => {
  if (cameraOn.value && stream) {
    stream.getTracks().forEach((track) => track.stop());
    cameraOn.value = false;
  }
};

const analyze = () => {
  if (cameraOn.value) {
    // 模拟 AI 分析逻辑
    analysisReady.value = true;
    feedbackList.value = [
      "请保持眼神交流。",
      "回答速度可以更均匀一些。",
      "尝试多使用专业术语，提高表达精准度。",
    ];
  }
};

onUnmounted(() => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
});
</script>
  
<style scoped src="../assets/interview.css"></style>
  