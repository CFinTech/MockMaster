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
          <div class="status-indicators">
            <div class="status-indicator">
              摄像头: {{ cameraOn ? "已开启" : "等待开启" }}
            </div>
            <div class="analysis-indicator">
              AI分析: {{ analysisReady ? "已开启" : "准备就绪" }}
            </div>
          </div>
          <video ref="cameraView" autoplay playsinline></video>
          <canvas ref="overlay" class="overlay-canvas"></canvas>
          <div class="indicator-container">
            <div class="gesture-indicator">手势: {{ gesture }}</div>
            <div class="face-indicator">{{ faceExpression }}</div>
          </div>
        </div>
        <div class="camera-controls">
          <button @click="startCamera" class="control-btn">开启摄像头</button>
          <button @click="stopCamera" :disabled="!cameraOn" class="control-btn stop">
            关闭摄像头
          </button>
          <button @click="analyze" class="control-btn">
            {{ analysisReady ? "重新分析" : "开启AI分析" }}
          </button>
        </div>
      </div>

      <div class="feedback-section">
        <div class="section-header">语音转文字</div>
        <div class="speech-panel">
          <div class="transcript">{{ transcript + interimTranscript }}</div>
          <!-- <h3>DeepSeek 评价：</h3>
          <p v-if="loadingEval">正在评价…</p>
          <p v-else>{{ evaluation }}</p> -->
          <div class="btn-group">
            <button class="control-btn stop" @click="startRecognition">
              {{ isRecognizing ? '停止识别' : '开始识别' }}
            </button>

          </div>
        </div>

        <div class="section-header">AI 面试反馈
          <span v-if="loadingEval" class="spinner"></span>
        </div>
        <div class="content">
          <div class="ai-feedback" id="feedback-container">
            <div v-for="(item, idx) in feedbackList" :key="idx" class="feedback-item" v-html="renderMarkdown(item)">
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
import OpenAI from "openai";
import { marked } from 'marked'

const userName = ref("张小明");
const cameraOn = ref(false);
const analysisReady = ref(false);
const feedbackList = ref([]);
const gesture = ref("无");
const faceExpression = ref("面部: 无");

const cameraView = ref(null);
const overlay = ref(null);
let overlayCtx = null;

let gestureRecognizer = null;
let faceLandmarker = null;
let drawingUtils = null;
let animationFrameId = null;


const transcript = ref("");
const interimTranscript = ref('')
const isRecognizing = ref(false);
let recognition = null;

const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.22-rc.20250304";
const GESTURE_RECOGNIZER_TASK_URL = `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`;
const FACE_LANDMARKER_TASK_URL = `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;
const VISION_WASM_URL_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;

// 新增指标相关变量
let frameCount = 0;
let blinkHistory = [];
let smileHistory = [];
let pressureHistory = [];
let emotionHistory = [];
let mouthHistory = [];
let relaxationHistory = [];
let microExpressionBuffer = [];

const MAX_HISTORY = 30;
const PRESSURE_HISTORY_LENGTH = 20;
const EMOTION_HISTORY_LENGTH = 30;
const MICRO_EXPRESSION_WINDOW = 15;

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
    feedbackList.value = [`AI面部识别模型加载失败: ${error.message}`];
    faceLandmarker = null;
  }
}

async function startCamera() {
  console.log("[startCamera] - Attempting to start camera...");

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
      video: { width: { ideal: 1100 }, height: { ideal: 750 } },
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

    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);

    const gestureResults = gestureRecognizer.recognizeForVideo(
      video,
      startTimeMs
    );
    processGestureResults(gestureResults);

    const faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
    processFaceResults(faceResults);
  }

  if (cameraOn.value) {
    animationFrameId = requestAnimationFrame(predictWebcam);
  }
}

function processGestureResults(results) {
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

function extractExpressionFeatures(blendshapes) {
  return {
    eyeClosure: getBlendshapeScore(blendshapes, ["eyeBlink_L", "eyeBlink_R"]),
    eyeWideness:
      1 - getBlendshapeScore(blendshapes, ["eyeSquint_L", "eyeSquint_R"]),

    browFrown: getBlendshapeScore(blendshapes, ["browDown_L", "browDown_R"]),
    browRaise: getBlendshapeScore(blendshapes, ["browInnerUp"]),

    mouthSmile: getBlendshapeScore(blendshapes, [
      "mouthSmile_L",
      "mouthSmile_R",
    ]),
    mouthFrown: getBlendshapeScore(blendshapes, [
      "mouthFrown_L",
      "mouthFrown_R",
    ]),
    mouthOpen: getBlendshapeScore(blendshapes, ["mouthOpen", "jawOpen"]),
    mouthPress: getBlendshapeScore(blendshapes, [
      "mouthPress_L",
      "mouthPress_R",
    ]),

    jawTension: getBlendshapeScore(blendshapes, ["jawForward", "jawClench"]),
    noseWrinkle: getBlendshapeScore(blendshapes, [
      "noseSneer_L",
      "noseSneer_R",
    ]),

    cheekSquint: getBlendshapeScore(blendshapes, [
      "cheekSquint_L",
      "cheekSquint_R",
    ]),
  };
}

function analyzeEmotionalIndicators(blendshapes, frameCount) {
  const features = extractExpressionFeatures(blendshapes);

  return {
    eyeContact: calculateDynamicEyeContact(features, frameCount),
    smileNaturalness: calculateDynamicSmile(features, frameCount),
    focusLevel: calculateDynamicFocus(features, frameCount),
    articulation: calculateArticulation(features, frameCount),
    emotionalActivity: calculateEmotionalActivity(features, frameCount),
    emotionalPositivity: calculateEmotionalPositivity(features),
  };
}

function calculateDynamicEyeContact(features, frameCount) {
  const currentBlink = features.eyeClosure;

  blinkHistory.push(currentBlink);
  if (blinkHistory.length > MAX_HISTORY) blinkHistory.shift();

  const dynamicBaseline = 0.2 + 0.1 * Math.sin(frameCount / 100);
  const blinkFrequency =
    blinkHistory.filter((b) => b > 0.5).length / MAX_HISTORY;

  return Math.max(
    0,
    1 - (currentBlink * 0.7 + blinkFrequency * 0.3 + dynamicBaseline * 0.2)
  );
}

function calculateDynamicSmile(features, frameCount) {
  smileHistory.push(features.mouthSmile);
  if (smileHistory.length > 10) smileHistory.shift();

  const smileChangeRate =
    smileHistory.length > 1
      ? Math.abs(
          smileHistory[smileHistory.length - 1] -
            smileHistory[smileHistory.length - 2]
        )
      : 0;

  const naturalness =
    (features.mouthSmile * 0.4 +
      features.cheekSquint * 0.3 +
      features.eyeWideness * 0.3) *
    (1 - Math.min(1, smileChangeRate * 5));

  const dynamicFactor = 0.9 + 0.1 * Math.sin(frameCount / 45);
  return Math.min(1, naturalness * dynamicFactor);
}

function calculateDynamicFocus(features, frameCount) {
  const dynamicWeight = 0.5 + 0.3 * Math.sin(frameCount / 60);
  return (
    (features.browRaise * 0.5 +
      features.eyeWideness * 0.3 +
      (1 - features.jawTension) * 0.2) *
    dynamicWeight
  );
}

function calculateArticulation(features, frameCount) {
  const currentMouthActivity = Math.abs(
    features.mouthOpen - (1 - features.mouthPress)
  );
  mouthHistory.push(currentMouthActivity);
  if (mouthHistory.length > 15) mouthHistory.shift();

  let changeRate = 0;
  if (mouthHistory.length > 1) {
    changeRate =
      mouthHistory
        .slice(1)
        .map((val, i) => Math.abs(val - mouthHistory[i]))
        .reduce((a, b) => a + b, 0) /
      (mouthHistory.length - 1);
  }

  const baseScore =
    (1 - features.mouthPress) * (0.3 + 0.7 * Math.min(1, changeRate * 5));
  const dynamicFactor = 0.8 + 0.2 * Math.sin(frameCount / 75);
  return Math.min(1, baseScore * dynamicFactor);
}

function calculateEmotionalActivity(features, frameCount) {
  const expressionIntensity =
    Math.abs(features.mouthSmile - features.mouthFrown) * 0.6 +
    Math.abs(features.browRaise - features.browFrown) * 0.4;

  const dynamicBaseline = 0.3 + 0.2 * Math.sin(frameCount / 120);

  emotionHistory.push(expressionIntensity);
  if (emotionHistory.length > EMOTION_HISTORY_LENGTH) {
    emotionHistory.shift();
  }

  let changeRate = 0;
  if (emotionHistory.length > 1) {
    const changes = [];
    for (let i = 1; i < emotionHistory.length; i++) {
      changes.push(Math.abs(emotionHistory[i] - emotionHistory[i - 1]));
    }
    changeRate = changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  return Math.min(
    1,
    (expressionIntensity * 0.6 + changeRate * 0.3 + dynamicBaseline * 0.1) * 1.2
  );
}

function calculateEmotionalPositivity(features) {
  const positiveSignals =
    features.mouthSmile * 0.5 +
    features.browRaise * 0.3 +
    (1 - features.browFrown) * 0.2;

  const negativeSignals =
    features.mouthFrown * 0.5 +
    features.browFrown * 0.3 +
    features.noseWrinkle * 0.2;

  const netPositivity = positiveSignals - negativeSignals * 0.7;
  return Math.min(1, Math.max(0, (netPositivity + 1) / 2));
}

function calculateShortTermVariance(history) {
  if (history.length < 5) return 0;
  const recent = history.slice(-5);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  return recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
}

function getBlendshapeScore(blendshapes, shapeNames) {
  const relevantShapes = blendshapes.filter(
    (shape) => shapeNames.includes(shape.categoryName) && shape.score > 0.1
  );
  if (relevantShapes.length === 0) return 0;
  return (
    relevantShapes.reduce((sum, shape) => sum + shape.score, 0) /
    shapeNames.length
  );
}

function processFaceResults(results) {
  if (!results.faceBlendshapes || results.faceBlendshapes.length === 0) {
    faceExpression.value = "面部: 无";
    return;
  }

  frameCount++;
  const blendshapes = results.faceBlendshapes[0].categories;

  // 绘制面部标记
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
  }

  // 分析动态指标
  const indicators = analyzeEmotionalIndicators(blendshapes, frameCount);

  // 更新显示 - 包含新旧指标
  faceExpression.value = 
    `眼神交流: ${(indicators.eyeContact * 100).toFixed(0)}%\n` +
    `微笑自然度: ${(indicators.smileNaturalness * 100).toFixed(0)}%\n` +
    `专注度: ${(indicators.focusLevel * 100).toFixed(0)}%\n` +
    `表达清晰度: ${(indicators.articulation * 100).toFixed(0)}%\n` +
    `情绪活跃度: ${(indicators.emotionalActivity * 100).toFixed(0)}%\n` +
    `情绪积极度: ${(indicators.emotionalPositivity * 100).toFixed(0)}%`;

  // 生成反馈
  if (analysisReady.value) {
    feedbackList.value = generateEmotionalFeedback(indicators);
  }
}

function generateEmotionalFeedback(indicators) {
  const feedback = [];

  // 原有指标反馈
  if (indicators.eyeContact < 0.5) {
    feedback.push("眼神交流不足，建议每3-5秒有意识地看向摄像头");
  } else if (indicators.eyeContact < 0.7) {
    feedback.push("眼神交流尚可，但可以更频繁些");
  } else {
    feedback.push("眼神交流良好，保持这个状态");
  }

  if (indicators.smileNaturalness < 0.4) {
    feedback.push("表情较严肃，尝试自然微笑");
  } else if (indicators.smileNaturalness < 0.6) {
    feedback.push("微笑稍显僵硬，试着放松面部肌肉");
  } else if (indicators.smileNaturalness < 0.8) {
    feedback.push("微笑自然度不错，继续保持");
  } else {
    feedback.push("微笑非常自然亲切");
  }

  if (indicators.focusLevel < 0.5) {
    feedback.push("注意力似乎不太集中，试着更投入");
  } else if (indicators.focusLevel < 0.7) {
    feedback.push("专注度尚可，但可以更好");
  } else {
    feedback.push("您非常专注，这是很好的表现");
  }

  if (indicators.articulation < 0.5) {
    feedback.push("嘴部动作较小，建议更清晰地发音");
  } else if (indicators.articulation < 0.7) {
    feedback.push("表达尚清晰，可以更明显些");
  } else {
    feedback.push("表达非常清晰，很好");
  }

  if (indicators.emotionalActivity > 0.7) {
    feedback.push("情绪表达丰富，但注意保持稳定");
  } else if (indicators.emotionalActivity > 0.5) {
    feedback.push("情绪表达适度，效果不错");
  } else if (indicators.emotionalActivity > 0.3) {
    feedback.push("情绪表达稍显平淡，可以更生动些");
  } else {
    feedback.push("情绪表达不足，建议增加面部表情");
  }

  if (indicators.emotionalPositivity > 0.7) {
    feedback.push("情绪非常积极，给人良好印象");
  } else if (indicators.emotionalPositivity > 0.5) {
    feedback.push("情绪偏向积极，继续保持");
  } else if (indicators.emotionalPositivity > 0.3) {
    feedback.push("情绪中性，可以增加些积极表情");
  } else {
    feedback.push("情绪偏消极，尝试微笑改善印象");
  }

  return feedback;
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
  faceExpression.value = "面部: 无";
  lastVideoTime = -1;
  analysisReady.value = false;
}

function analyze() {
  if (cameraOn.value) {
    analysisReady.value = true;
  } else {
    feedbackList.value = ["请先开启摄像头再进行AI分析。"];
    analysisReady.value = false;
  }
}

onMounted(async () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "zh-CN";

    // recognition.onresult = (event) => {
    //   let interim = "";
    //   for (let i = event.resultIndex; i < event.results.length; i++) {
    //     const text = event.results[i][0].transcript;
    //     if (event.results[i].isFinal) {
    //       transcript.value += text;
    //       evaluateWithDeepSeek(transcript.value)
    //     } else {
    //       interim += text;
    //     }
    //   }
    //   interimTranscript.value = interim
    // };
    // recognition.onresult = (event) => {
    //   // 只处理 isFinal=true，即最终结果
    //   for (let i = event.resultIndex; i < event.results.length; i++) {
    //     if (event.results[i].isFinal) {
    //       transcript.value += event.results[i][0].transcript
    //       evaluateWithDeepSeek(transcript.value) // 停后才调用 DeepSeek
    //     }
    //   }
    // }
    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const txt = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          transcript.value += txt
        } else {
          interim += txt
        }
      }
      interimTranscript.value = interim
    }

    recognition.onerror = (e) => {
      console.error("语音识别出错：", e);
    };

    recognition.onend = () => {
      isRecognizing.value = false;
    };
  } else {
    console.warn("浏览器不支持 SpeechRecognition");
  }
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
  if (recognition && isRecognizing.value) {
    recognition.stop();
  }
});

function startRecognition() {
  // if (recognition && !isRecognizing.value) {
  //   transcript.value = "";
  //   recognition.start();
  //   isRecognizing.value = true;
  // }
  if (isRecognizing.value) {
    recognition.stop()
    isRecognizing.value = false
    evaluateWithDeepSeek(transcript.value)
  } else {
    transcript.value = ''
    evaluation.value = ''
    recognition.start()
    isRecognizing.value = true
  }
}

// function stopRecognition() {
//   if (recognition && isRecognizing.value) {
//     recognition.stop();
//   }
// }

const evaluation = ref('')
const loadingEval = ref(false)

// sk-0f909e0c234c4fd3a582966371e29f63
async function evaluateWithDeepSeek(text) {
  console.log(text)
  if (!text) {
    evaluation.value = ''
    return
  }
  loadingEval.value = true
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-0f909e0c234c4fd3a582966371e29f63',
    dangerouslyAllowBrowser: true
  })
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "你是一位AI面试官，需要帮助用户优化面试表现。对于以下作答，给出专业，有价值，具有帮助性，态度友好的回答。内容上回答顺序为[总体评价][优点][改进建议]。形式上以清晰美观且可以被js的marked包直接渲染的格式输出。省略头部的“```markdown”和尾部的“```”" },
        { role: 'user', content: text }],
      model: "deepseek-chat",
    });
    evaluation.value = completion.choices[0].message.content
    feedbackList.value = [evaluation.value]
  } catch (err) {
    console.error('DeepSeek 评价失败：', err)
    evaluation.value = '评价服务不可用'
  } finally {
    loadingEval.value = false
  }
}

function renderMarkdown(text) {
  const norm = text.replace(/```[a-zA-Z]*\n/, '').replace(/```/, '')
  console.log(norm);
  return marked.parse(norm)
}

</script>

<style scoped>
@import "../assets/interview.css";
</style>
