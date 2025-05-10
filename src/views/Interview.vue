<template>
  <div class="container">
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
          <div class="gesture-indicator">手势: {{ gesture }}</div>
          <video ref="cameraView" id="camera-view" autoplay playsinline></video>
          <canvas ref="overlay" class="overlay-canvas"></canvas>
        </div>
        <div class="camera-controls">
          <button @click="startCamera" class="control-btn">开启摄像头</button>
          <button
            @click="stopCamera"
            :disabled="!cameraOn"
            class="control-btn stop"
          >
            关闭摄像头
          </button>
          <button @click="analyze" class="control-btn">
            {{ analysisReady ? "重新分析" : "开启AI分析" }}
          </button>
        </div>
      </div>

      <div class="feedback-section">
        <div class="section-header">AI面试反馈</div>
        <div class="content">
          <div class="ai-feedback" id="feedback-container">
            <div
              v-for="(item, idx) in feedbackList"
              :key="idx"
              class="feedback-item"
            >
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
      </div>
      <div class="copyright">© 2025 AI面试助手 | 由智能人机交互团队制作</div>
      <div class="version">v1.0.0</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import {
  GestureRecognizer, // 从 HandLandmarker 更改为 GestureRecognizer
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

// Refs for UI elements and state
const userName = ref("张小明");
const cameraOn = ref(false);
const analysisReady = ref(false);
const feedbackList = ref([]);
const gesture = ref("无"); // 用于显示识别到的手势

const cameraView = ref(null); // video 元素
const overlay = ref(null); // canvas 元素
let overlayCtx = null; // canvas 上下文

// MediaPipe GestureRecognizer specific variables
let gestureRecognizer = null; // 从 handLandmarker 更改
let drawingUtils = null;
let animationFrameId = null;

// Paths for MediaPipe Tasks Vision assets
// 保持您项目中指定的版本，确保与JS库兼容
const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.22-rc.20250304"; // Vue 代码中使用的版本
// GestureRecognizer 模型路径 (来自原生JS示例)
const GESTURE_RECOGNIZER_TASK_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const VISION_WASM_URL_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;

// Async function to initialize the GestureRecognizer
async function createGestureRecognizer() {
  console.log("[createGestureRecognizer] - Initializing...");
  console.log(
    `[createGestureRecognizer] - Model URL: ${GESTURE_RECOGNIZER_TASK_URL}`
  );
  console.log(
    `[createGestureRecognizer] - WASM Base URL: ${VISION_WASM_URL_BASE}`
  );
  try {
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL_BASE);
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: GESTURE_RECOGNIZER_TASK_URL,
        delegate: "GPU", // 或 "CPU"
      },
      runningMode: "VIDEO", // 处理视频帧
      numHands: 1, // 检测单手 (GestureRecognizer 也支持此参数)
      // 以下置信度参数也可以用于 GestureRecognizer，您可以根据需要调整
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    console.log(
      "[createGestureRecognizer] - GestureRecognizer initialized successfully.",
      gestureRecognizer
    );
  } catch (error) {
    console.error(
      "[createGestureRecognizer] - Error initializing GestureRecognizer:",
      error
    );
    feedbackList.value = [`AI手势识别模型加载失败: ${error.message}`];
    gestureRecognizer = null; // 确保在失败时重置
  }
}

// Function to start the webcam and gesture detection
async function startCamera() {
  console.log("[startCamera] - Attempting to start camera...");
  if (!gestureRecognizer) {
    console.warn(
      "[startCamera] - GestureRecognizer not ready yet. Attempting to create again."
    );
    await createGestureRecognizer(); // 调用新的初始化函数
    if (!gestureRecognizer) {
      feedbackList.value = ["AI模型初始化失败，无法开启摄像头。"];
      return;
    }
  }
  if (cameraOn.value) {
    console.log("[startCamera] - Camera is already on.");
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error(
      "[startCamera] - getUserMedia not supported on this browser."
    );
    feedbackList.value = ["您的浏览器不支持摄像头访问。"];
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } }, // 您可以调整分辨率
    });
    if (cameraView.value) {
      cameraView.value.srcObject = stream;
      cameraView.value.onloadeddata = () => {
        console.log(
          "[startCamera] - Video data loaded. Starting prediction loop."
        );
        if (overlay.value) {
          overlayCtx = overlay.value.getContext("2d");
          if (overlayCtx) {
            drawingUtils = new DrawingUtils(overlayCtx);
            console.log(
              "[startCamera] - Canvas context and DrawingUtils initialized for loadeddata."
            );
            lastVideoTime = -1;
            cameraOn.value = true; // 在数据加载后且所有设置完成后，才真正设置为 on
            if (cameraOn.value) predictWebcam();
          } else {
            console.error(
              "[startCamera] - Failed to get 2D context from overlay canvas during loadeddata."
            );
            feedbackList.value = ["无法初始化绘图区域。"];
            cameraOn.value = false; // 启动失败
            stream.getTracks().forEach((track) => track.stop()); // 关闭流
          }
        } else {
          console.error(
            "[startCamera] - Overlay canvas element not found during loadeddata."
          );
          feedbackList.value = ["绘图区域未找到。"];
          cameraOn.value = false; // 启动失败
          stream.getTracks().forEach((track) => track.stop()); // 关闭流
        }
      };
      console.log(
        "[startCamera] - Webcam stream acquired and attached to video element."
      );
      // cameraOn.value = true; // 移动到 onloadeddata 内部成功初始化后
    } else {
      console.error("[startCamera] - Video element (cameraView) not found.");
      stream.getTracks().forEach((track) => track.stop());
      cameraOn.value = false; // 启动失败
    }
  } catch (error) {
    console.error("[startCamera] - Error accessing webcam:", error);
    feedbackList.value = [`无法访问摄像头: ${error.message}`];
    cameraOn.value = false;
  }
}

let lastVideoTime = -1;
async function predictWebcam() {
  if (
    !cameraOn.value ||
    !cameraView.value ||
    !gestureRecognizer || // 检查 gestureRecognizer
    !drawingUtils ||
    !overlayCtx
  ) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    return;
  }

  if (
    cameraView.value.paused ||
    cameraView.value.ended ||
    cameraView.value.readyState < 2 // HAVE_CURRENT_DATA or more
  ) {
    animationFrameId = requestAnimationFrame(predictWebcam);
    return;
  }

  const video = cameraView.value;
  // 确保canvas尺寸与视频一致
  if (
    overlay.value &&
    (overlay.value.width !== video.videoWidth ||
      overlay.value.height !== video.videoHeight)
  ) {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      overlay.value.width = video.videoWidth;
      overlay.value.height = video.videoHeight;
      console.log(
        `[predictWebcam] - Resized overlay to ${overlay.value.width}x${overlay.value.height}`
      );
    }
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const startTimeMs = performance.now();

    // 使用 gestureRecognizer.recognizeForVideo
    const results = gestureRecognizer.recognizeForVideo(video, startTimeMs);

    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);

    if (results.landmarks && results.landmarks.length > 0) {
      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS, // 使用 GestureRecognizer 的连接常量
          {
            color: "#00FF00", // 绿色连接线
            lineWidth: 5,
          }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000", // 红色关键点
          lineWidth: 2,
          radius: 3,
        });
      }
    }

    // 处理手势结果
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

  if (cameraOn.value) {
    animationFrameId = requestAnimationFrame(predictWebcam);
  }
}

// detectSimpleGesture 函数不再需要，因为 GestureRecognizer 会直接提供手势分类

function stopCamera() {
  console.log("[stopCamera] - Attempting to stop camera...");
  cameraOn.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (cameraView.value && cameraView.value.srcObject) {
    const stream = cameraView.value.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    cameraView.value.srcObject = null;
    cameraView.value.onloadeddata = null; // 清除事件监听器
    console.log("[stopCamera] - Webcam stream stopped and detached.");
  }
  if (overlayCtx && overlay.value) {
    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);
  }
  gesture.value = "无";
  lastVideoTime = -1;
  analysisReady.value = false; // 如果摄像头关闭，AI分析也应重置
}

function analyze() {
  if (cameraOn.value) {
    analysisReady.value = true;
    // 更新反馈列表以包含由 GestureRecognizer 识别的手势
    feedbackList.value = [
      "请保持眼神交流。",
      "回答速度可以更均匀一些。",
      "尝试多使用专业术语，提高表达精准度。",
      `当前手势: ${gesture.value}`, // gesture.value 现在由 GestureRecognizer 更新
    ];
  } else {
    feedbackList.value = ["请先开启摄像头再进行AI分析。"];
    analysisReady.value = false;
  }
}

onMounted(async () => {
  console.log("Vue component MOUNTED. Initializing GestureRecognizer...");
  await createGestureRecognizer(); // 调用新的初始化函数
});

onUnmounted(() => {
  console.log("Vue component UNMOUNTED. Cleaning up...");
  stopCamera(); // 确保摄像头停止
  if (gestureRecognizer) {
    gestureRecognizer.close(); // 关闭 GestureRecognizer 实例
    gestureRecognizer = null;
    console.log("[onUnmounted] - GestureRecognizer closed.");
  }
});
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 640px; /* 与JS中摄像头请求的宽度一致或按比例 */
  height: 480px; /* 与JS中摄像头请求的高度一致或按比例 */
  background-color: #000; /* 给未加载视频时一个黑色背景 */
}

#camera-view {
  width: 100%;
  height: 100%;
  display: block; /* 移除可能的额外空间 */
  transform: scaleX(-1); /* 镜像摄像头画面，使其更像镜子 */
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%; /* 确保canvas覆盖video */
  height: 100%; /* 确保canvas覆盖video */
  pointer-events: none; /* 允许点击穿透到视频（如果需要） */
  transform: scaleX(-1); /* 镜像canvas以匹配视频 */
}

.gesture-indicator {
  position: absolute;
  bottom: 10px; /*调整到左下角 */
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  z-index: 10; /* 确保在canvas之上 */
}

/* 保持您项目原有的其他样式 */
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
  top: 40px; /* 调整位置避免与状态指示器重叠 */
}
</style>

<style scoped src="../assets/interview.css"></style>