<template>
  <div class="container">
    <div class="top-nav">
      <router-link to="/simulate" class="back-button">
        <!-- 返回箭头 -->
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="#355DCE"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        返回主页
      </router-link>
      <div class="user-profile">
        <span class="user-name">{{ userName }}</span>
        <div class="avatar">徐</div>
      </div>
    </div>

    <div class="main-content">
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
            <canvas
              :ref="(el) => (canvasElements[i] = el)"
              class="overlay-canvas"
            ></canvas>
            <div class="participant-info">
              <div class="participant-avatar">{{ p.initial }}</div>
              <span>{{ p.name }}<span v-if="p.isSelf"> (您)</span></span>
            </div>
          </div>
        </div>
      </div>

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

      <div class="ai-analysis-section">
        <div class="analysis-header">AI面试反馈</div>
        <div class="ai-feedback" id="analysis-content">
          <div v-if="!analysisFeedback.length" class="feedback-placeholder">
            点击“开启AI分析”以获取实时反馈
          </div>
          <div
            class="feedback-item"
            v-for="(item, i) in analysisFeedback"
            :key="i"
            :class="`feedback-item--${item.type}`"
          >
            <div class="feedback-icon">{{ item.icon }}</div>
            <div class="feedback-text-content">
              <div class="feedback-title">{{ item.title }}</div>
              <div class="feedback-detail">{{ item.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
      <router-link to="/evaluation" class="no-underline">
        <button class="control-btn">结束面试</button>
      </router-link>
    </div>

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
import {
  GestureRecognizer,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

// 参与者列表
const participants = [
  { name: "徐小铭", initial: "徐", isSelf: true },
  { name: "王丽", initial: "王", isSelf: false },
  { name: "李强", initial: "李", isSelf: false },
  { name: "赵敏", initial: "赵", isSelf: false },
  { name: "刘伟", initial: "刘", isSelf: false },
  { name: "陈芳", initial: "陈", isSelf: false },
];

const userName = ref("徐小铭");
const cameraOn = ref(false);
const analysisReady = ref(false);
const videoElements = ref([]);
const canvasElements = ref([]);
let overlayCtx = null;
let stream = null;

// 手势和面部识别状态
const gesture = ref("无");
const faceExpression = ref("无检测");

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
    avatar: "徐",
    sender: "徐小铭",
    time: "10:25",
    content: "大家好，我是徐小铭，很高兴认识各位",
  },
]);
const inputText = ref("");

// [MODIFIED] AI 分析反馈，初始值为空数组
const analysisFeedback = ref([]);

// MediaPipe models variables
let gestureRecognizer = null;
let faceLandmarker = null;
let drawingUtils = null;
let animationFrameId = null;

// Paths for MediaPipe Tasks Vision assets
const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.22-rc.20250304";
const GESTURE_RECOGNIZER_TASK_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const FACE_LANDMARKER_TASK_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const VISION_WASM_URL_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;

let lastVideoTime = -1;

// Async function to initialize the GestureRecognizer
async function createGestureRecognizer() {
  console.log("[createGestureRecognizer] - Initializing...");
  try {
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL_BASE);
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
    console.log("GestureRecognizer initialized successfully.");
  } catch (error) {
    console.error("Error initializing GestureRecognizer:", error);
    analysisFeedback.value = [`AI手势识别模型加载失败: ${error.message}`];
    gestureRecognizer = null;
  }
}

// Async function to initialize the FaceLandmarker
async function createFaceLandmarker() {
  console.log("[createFaceLandmarker] - Initializing with blendshapes...");
  try {
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL_BASE);
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: FACE_LANDMARKER_TASK_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      outputFaceBlendshapes: true,
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    console.log("FaceLandmarker with blendshapes initialized successfully.");
  } catch (error) {
    console.error("Error initializing FaceLandmarker:", error);
    analysisFeedback.value = [`AI面部识别模型加载失败: ${error.message}`];
    faceLandmarker = null;
  }
}

async function startCamera() {
  if (!cameraOn.value) {
    try {
      // Initialize models if not ready
      if (!gestureRecognizer) {
        await createGestureRecognizer();
      }
      if (!faceLandmarker) {
        await createFaceLandmarker();
      }

      if (!gestureRecognizer || !faceLandmarker) {
        analysisFeedback.value = ["AI模型初始化失败，无法开启摄像头。"];
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });

      // 仅设置第一个视频元素（自己的摄像头）
      const firstVideo = videoElements.value[0];
      const firstCanvas = canvasElements.value[0];

      if (firstVideo) {
        firstVideo.srcObject = stream;
        firstVideo.onloadeddata = () => {
          if (firstCanvas) {
            overlayCtx = firstCanvas.getContext("2d");
            if (overlayCtx) {
              drawingUtils = new DrawingUtils(overlayCtx);
              lastVideoTime = -1;
              cameraOn.value = true;
              if (cameraOn.value) predictWebcam();
            }
          }
        };
      }
    } catch (err) {
      console.error("无法开启摄像头:", err);
      analysisFeedback.value = [`无法访问摄像头: ${err.message}`];
    }
  }
}

async function predictWebcam() {
  if (
    !cameraOn.value ||
    !videoElements.value[0] ||
    !gestureRecognizer ||
    !faceLandmarker ||
    !drawingUtils ||
    !overlayCtx
  ) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    return;
  }

  const video = videoElements.value[0];
  const canvas = canvasElements.value[0];

  if (video.paused || video.ended || video.readyState < 2) {
    animationFrameId = requestAnimationFrame(predictWebcam);
    return;
  }

  if (
    canvas &&
    (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)
  ) {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const startTimeMs = performance.now();

    // Clear canvas before drawing new results
    overlayCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Process gesture recognition
    const gestureResults = gestureRecognizer.recognizeForVideo(
      video,
      startTimeMs
    );
    processGestureResults(gestureResults);

    // Process face recognition
    const faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
    processFaceResults(faceResults);
  }

  if (cameraOn.value) {
    animationFrameId = requestAnimationFrame(predictWebcam);
  }
}

function processGestureResults(results) {
  // Draw hand landmarks
  if (results.landmarks && results.landmarks.length > 0) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
        radius: 3,
      });
    }
  }

  // Update gesture text
  if (
    results.gestures &&
    results.gestures.length > 0 &&
    results.gestures[0].length > 0
  ) {
    const topGesture = results.gestures[0][0];
    const categoryName = topGesture.categoryName;
    const categoryScore = parseFloat(topGesture.score * 100).toFixed(2);
    const handedness =
      results.handednesses &&
      results.handednesses.length > 0 &&
      results.handednesses[0].length > 0
        ? results.handednesses[0][0].displayName
        : "N/A";

    if (categoryName && categoryName !== "") {
      gesture.value = `${categoryName} (${categoryScore}%) - ${handedness}`;
    } else {
      gesture.value = `未知手势 (${categoryScore}%) - ${handedness}`;
    }
  } else {
    gesture.value = "无手势";
  }
}

function processFaceResults(results) {
  // Draw face landmarks
  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30", lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0", lineWidth: 2 }
      );
    }

    // Process blendshapes
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;

      // Extract and sort blendshapes by score
      const sortedBlendshapes = blendshapes
        .filter((shape) => shape.score > 0.1)
        .sort((a, b) => b.score - a.score);

      // Format the blendshapes as a string
      const blendshapeLabels = sortedBlendshapes.map(
        (shape) => `${shape.categoryName} (${(shape.score * 100).toFixed(1)}%)`
      );

      // Update face expression display
      faceExpression.value = blendshapeLabels.join(", ");
    } else {
      faceExpression.value = "无检测";
    }
  } else {
    faceExpression.value = "无检测";
  }
}

function stopCamera() {
  cameraOn.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (videoElements.value[0] && videoElements.value[0].srcObject) {
    const stream = videoElements.value[0].srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    videoElements.value[0].srcObject = null;
  }

  if (canvasElements.value[0] && overlayCtx) {
    overlayCtx.clearRect(
      0,
      0,
      canvasElements.value[0].width,
      canvasElements.value[0].height
    );
  }

  gesture.value = "无";
  faceExpression.value = "无检测";
  lastVideoTime = -1;
  analysisReady.value = false;
}

function analyze() {
  if (cameraOn.value) {
    analysisReady.value = true;
    // [MODIFIED] 生成结构化的反馈数据
    analysisFeedback.value = [
      {
        type: "suggestion",
        icon: "💡",
        title: "核心建议",
        detail: "回答速度可以更均匀一些，尝试多使用专业术语，提高表达精准度。",
      },
      {
        type: "data",
        icon: "✋",
        title: "当前手势",
        detail: gesture.value,
      },
      {
        type: "data",
        icon: "😊",
        title: "当前表情",
        detail: faceExpression.value,
      },
      {
        type: "info",
        icon: "👁️",
        title: "眼神交流",
        detail: "请尽量保持注视摄像头，如同与面试官对视。",
      },
    ];
  } else {
    // [MODIFIED] 更新错误提示的结构
    analysisFeedback.value = [
      {
        type: "error",
        icon: "⚠️",
        title: "操作提醒",
        detail: "请先开启摄像头再进行AI分析。",
      },
    ];
    analysisReady.value = false;
  }
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function sendMessage() {
  if (inputText.value.trim()) {
    chatMessages.value.push({
      avatar: "徐",
      sender: "徐小铭",
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

onMounted(async () => {
  console.log("Vue component MOUNTED. Initializing models...");
  await createGestureRecognizer();
  await createFaceLandmarker();
});

onUnmounted(() => {
  console.log("Vue component UNMOUNTED. Cleaning up...");
  stopCamera();
  if (gestureRecognizer) {
    gestureRecognizer.close();
    gestureRecognizer = null;
  }
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
});
</script>

<style scoped>
.video-item {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
}

.video-item video {
  width: 100%;
  height: 100%;
  display: block;
  transform: scaleX(-1);
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform: scaleX(-1);
}

.indicator-container {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.gesture-indicator,
.face-indicator {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  z-index: 10;
}

.status-indicator,
.analysis-indicator {
  position: absolute;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  z-index: 10;
}
.status-indicator {
  top: 10px;
}
.analysis-indicator {
  top: 40px;
}

/* [ADDED] AI 面试反馈美化样式 */
.ai-feedback {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 反馈项之间的间距 */
  padding-top: 8px;
}

.feedback-placeholder {
  color: #888;
  text-align: center;
  padding: 20px;
  font-style: italic;
  border: 1px dashed #ccc;
  border-radius: 8px;
}

.feedback-item {
  display: flex;
  align-items: flex-start; /* 图标与顶部对齐 */
  padding: 16px;
  border-radius: 8px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left-width: 4px; /* 左侧的彩色提示条 */
  transition: background-color 0.2s;
}

/* 根据反馈类型设置不同的颜色提示 */
.feedback-item--suggestion {
  border-left-color: #3b82f6; /* 蓝色 - 建议 */
}
.feedback-item--data {
  border-left-color: #22c55e; /* 绿色 - 数据 */
}
.feedback-item--info {
  border-left-color: #8b5cf6; /* 紫色 - 信息 */
}
.feedback-item--error {
  border-left-color: #ef4444; /* 红色 - 错误 */
}

.feedback-item:hover {
  background-color: #f3f4f6;
}

.feedback-icon {
  font-size: 20px;
  margin-right: 12px;
  margin-top: -2px; /* 微调图标垂直对齐 */
}

.feedback-text-content {
  display: flex;
  flex-direction: column;
}

.feedback-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.feedback-detail {
  color: #4b5563;
  line-height: 1.5;
  font-size: 0.95em;
}
</style>

<style scoped src="../assets/multi_interview.css"></style>