<template>
  <div class="container">
    <div class="top-nav">
      <a href="#" class="back-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        返回主页
      </a>
      <div class="user-profile">
        <span class="user-name">{{ userName }}</span>
        <div class="user-avatar"></div>
      </div>
    </div>

    <div class="main-content">
      <div class="camera-section">
        <div class="section-header">您的面试</div>
        <div class="camera-container">
          <div class="status-indicator">
            摄像头: {{ cameraOn ? "已开启" : "等待开启" }}
          </div>
          <div class="analysis-indicator">
            AI分析: {{ analysisReady ? "就绪" : "准备就绪" }}
          </div>
          <div class="indicator-container">
            <div class="gesture-indicator">手势: {{ gesture }}</div>
            <div class="face-indicator">面部: {{ faceExpression }}</div>
          </div>
          <video ref="cameraView" autoplay playsinline></video>
          <canvas ref="overlay" class="overlay-canvas"></canvas>
        </div>
        <div class="camera-controls">
          <button @click="toggleCamera" class="control-btn">开启摄像头</button>
          <button @click="stopCamera" :disabled="!cameraOn" class="control-btn stop">
            关闭摄像头
          </button>
          <button @click="triggerAnalysis" :disabled="!cameraOn">
            {{ analysisReady ? "重新分析" : "开启 AI 分析" }}
          </button>
        </div>
        <div class="status-indicator" v-if="cameraOn">摄像头已开启</div>
        <div class="analysis-indicator" v-if="analysisReady">AI 分析就绪</div>
      </div>

      <div class="feedback-section">
        <!-- 语音转文字 新功能 -->
        <div class="section-header">语音转文字</div>
        <div class="speech-panel">
          <div class="transcript">{{ transcript }}</div>
          <div class="btn-group">
            <button class="control-btn" @click="startRecognition" :disabled="isRecognizing">
              开始识别
            </button>
            <button class="control-btn stop" @click="stopRecognition" :disabled="!isRecognizing">
              停止识别
            </button>
          </div>
        </div>

        <!-- AI 面试反馈 原有功能 -->
        <div class="section-header">AI 面试反馈</div>
        <div class="content">
          <div class="ai-feedback" id="feedback-container">
            <div v-for="(item, idx) in feedbackList" :key="idx" class="feedback-item">
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-links">
        <a href="#" class="footer-link">关于我们</a>
        <a href="#" class="footer-link">隐私政策</a>
        <a href="#" class="footer-link">使用条款</a>
        <div class="copyright">© 2025 AI面试助手 | 由智能人机交互团队制作</div>
        <div class="version">v1.0.0</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import {
  GestureRecognizer,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

// Refs for UI elements and state
const userName = ref("张小明");
const cameraOn = ref(false);
const analysisReady = ref(false);
const feedbackList = ref([]);
const gesture = ref("无");
const faceExpression = ref("无检测");

const cameraView = ref(null);
const overlay = ref(null);
let overlayCtx = null;

// MediaPipe models variables
let gestureRecognizer = null;
let faceLandmarker = null;
let drawingUtils = null;
let animationFrameId = null;

// Paths for MediaPipe Tasks Vision assets
const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.22-rc.20250304";
const VISION_WASM_URL_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;
const GESTURE_RECOGNIZER_TASK_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/gesture_recognizer.task`;
const FACE_LANDMARKER_TASK_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/face_landmarker.task`;

// 新增：语音识别状态
const transcript = ref("");
const isRecognizing = ref(false);
let recognition = null;

/**
 * 原有：开启/关闭摄像头
 */
async function toggleCamera() {
  if (!cameraOn.value) {
    // 打开摄像头
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    cameraView.value.srcObject = stream;
    await cameraView.value.play();
    cameraOn.value = true;

    // 初始化画布
    overlayCtx = overlay.value.getContext("2d");
    overlay.value.width = cameraView.value.videoWidth;
    overlay.value.height = cameraView.value.videoHeight;
  } else {
    // 关闭摄像头
    const tracks = cameraView.value.srcObject.getTracks();
    tracks.forEach((t) => t.stop());
    cameraOn.value = false;
    cancelAnimationFrame(animationFrameId);
    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);
  }
}

/**
 * 原有：触发 AI 分析（手势 & 面部表情）
 */
async function triggerAnalysis() {
  if (!analysisReady.value) {
    // 第一次初始化 MediaPipe
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL_BASE);

    // 手势识别
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: GESTURE_RECOGNIZER_TASK_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 人脸关键点
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: FACE_LANDMARKER_TASK_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    });

    drawingUtils = new DrawingUtils();
    analysisReady.value = true;
  }

  // 清空旧反馈
  feedbackList.value = [];

  // 循环读取视频帧并分析
  const processFrame = async () => {
    if (!cameraOn.value) return;

    overlayCtx.drawImage(cameraView.value, 0, 0, overlay.value.width, overlay.value.height);

    // 手势识别
    const gestureResult = gestureRecognizer.recognize(overlay.value);
    if (gestureResult.gestures.length > 0) {
      gesture.value = gestureResult.gestures[0][0].categoryName;
      feedbackList.value.push(`检测到手势：${gesture.value}`);
    }

    // 人脸关键点检测
    const faceResult = faceLandmarker.detect(overlay.value);
    if (faceResult.faceLandmarks.length > 0) {
      drawingUtils.drawConnectors(overlayCtx, faceResult.faceLandmarks[0], DrawingUtils.FACE_LANDMARKS, {});

      feedbackList.value.push(`检测到人脸关键点`);
    }

    animationFrameId = requestAnimationFrame(processFrame);
  };

  processFrame();
}

onMounted(async () => {
  // 原有 onMounted 内容：无须放在此处重复

  // 新增：初始化 Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcript.value += text;
        } else {
          interim += text;
        }
      }
      // 若需显示中间结果，可使用 transcript.value + interim
    };

    recognition.onerror = (e) => {
      console.error("语音识别出错：", e);
    };

    recognition.onend = () => {
      isRecognizing.value = false;
    };
  } else {
    console.warn("浏览器不支持 SpeechRecognition");
  }
});

// 新增：开始语音识别
function startRecognition() {
  if (recognition && !isRecognizing.value) {
    transcript.value = "";
    recognition.start();
    isRecognizing.value = true;
  }
}

// 新增：停止语音识别
function stopRecognition() {
  if (recognition && isRecognizing.value) {
    recognition.stop();
  }
}

onUnmounted(() => {
  console.log("Vue component UNMOUNTED. Cleaning up...");
  // 关闭摄像头
  if (cameraOn.value) {
    const tracks = cameraView.value.srcObject.getTracks();
    tracks.forEach((t) => t.stop());
  }
  // 关闭 MediaPipe 模型
  if (gestureRecognizer) {
    gestureRecognizer.close();
    gestureRecognizer = null;
  }
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
  // 停止语音识别
  if (recognition && isRecognizing.value) {
    recognition.stop();
  }
});
</script>

<style scoped>
@import "../assets/interview.css";
</style>
