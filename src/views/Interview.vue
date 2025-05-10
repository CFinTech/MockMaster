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
          <div class="indicator-container">
            <div class="gesture-indicator">手势: {{ gesture }}</div>
            <div class="face-indicator">面部: {{ faceExpression }}</div>
          </div>
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
const GESTURE_RECOGNIZER_TASK_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const FACE_LANDMARKER_TASK_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const VISION_WASM_URL_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;

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
    feedbackList.value = [`AI手势识别模型加载失败: ${error.message}`];
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
      outputFaceBlendshapes: true, // 关键：启用blendshapes输出
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    console.log("FaceLandmarker with blendshapes initialized successfully.");
  } catch (error) {
    console.error("Error initializing FaceLandmarker:", error);
    feedbackList.value = [`AI面部识别模型加载失败: ${error.message}`];
    faceLandmarker = null;
  }
}

// Function to start the webcam and detection
async function startCamera() {
  console.log("[startCamera] - Attempting to start camera...");

  // Initialize models if not ready
  if (!gestureRecognizer) {
    await createGestureRecognizer();
  }
  if (!faceLandmarker) {
    await createFaceLandmarker();
  }

  if (!gestureRecognizer || !faceLandmarker) {
    feedbackList.value = ["AI模型初始化失败，无法开启摄像头。"];
    return;
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
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
    });

    if (cameraView.value) {
      cameraView.value.srcObject = stream;
      cameraView.value.onloadeddata = () => {
        console.log("Video data loaded. Starting prediction loop.");
        if (overlay.value) {
          overlayCtx = overlay.value.getContext("2d");
          if (overlayCtx) {
            drawingUtils = new DrawingUtils(overlayCtx);
            console.log("Canvas context and DrawingUtils initialized.");
            lastVideoTime = -1;
            cameraOn.value = true;
            if (cameraOn.value) predictWebcam();
          } else {
            console.error("Failed to get 2D context from overlay canvas.");
            feedbackList.value = ["无法初始化绘图区域。"];
            cameraOn.value = false;
            stream.getTracks().forEach((track) => track.stop());
          }
        } else {
          console.error("Overlay canvas element not found.");
          feedbackList.value = ["绘图区域未找到。"];
          cameraOn.value = false;
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    } else {
      console.error("Video element (cameraView) not found.");
      stream.getTracks().forEach((track) => track.stop());
      cameraOn.value = false;
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
    !gestureRecognizer ||
    !faceLandmarker ||
    !drawingUtils ||
    !overlayCtx
  ) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    return;
  }

  if (
    cameraView.value.paused ||
    cameraView.value.ended ||
    cameraView.value.readyState < 2
  ) {
    animationFrameId = requestAnimationFrame(predictWebcam);
    return;
  }

  const video = cameraView.value;
  if (
    overlay.value &&
    (overlay.value.width !== video.videoWidth ||
      overlay.value.height !== video.videoHeight)
  ) {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      overlay.value.width = video.videoWidth;
      overlay.value.height = video.videoHeight;
    }
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const startTimeMs = performance.now();

    // Clear canvas before drawing new results
    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);

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
        .filter((shape) => shape.score > 0.1) // Filter out low-confidence shapes
        .sort((a, b) => b.score - a.score); // Sort by score in descending order

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
    cameraView.value.onloadeddata = null;
    console.log("[stopCamera] - Webcam stream stopped and detached.");
  }
  if (overlayCtx && overlay.value) {
    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);
  }
  gesture.value = "无";
  faceExpression.value = "无检测";
  lastVideoTime = -1;
  analysisReady.value = false;
}

function analyze() {
  if (cameraOn.value) {
    analysisReady.value = true;
    feedbackList.value = [
      "请保持眼神交流。",
      "回答速度可以更均匀一些。",
      "尝试多使用专业术语，提高表达精准度。",
      `当前手势: ${gesture.value}`,
      `当前表情: ${faceExpression.value}`,
    ];
  } else {
    feedbackList.value = ["请先开启摄像头再进行AI分析。"];
    analysisReady.value = false;
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
.camera-container {
  position: relative;
  width: 640px;
  height: 480px;
  background-color: #000;
}

#camera-view {
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
  gap: 10px; /* 间距 */
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
</style>

<style scoped src="../assets/interview.css"></style>
