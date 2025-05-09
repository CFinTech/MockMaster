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
          <!-- 用户头像 SVG -->
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
          <!-- Gesture display -->
          <div class="gesture-indicator">手势: {{ gesture }}</div>
          <!-- Video and overlay -->
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

      <!-- 右侧反馈区域 -->
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
import { ref, onUnmounted, onMounted } from "vue"; // 建议也导入 onMounted
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const userName = ref("张小明");
const cameraOn = ref(false);
const analysisReady = ref(false);
const feedbackList = ref([]);
const gesture = ref("无");

const cameraView = ref(null);
const overlay = ref(null);
let handsDetector = null;
let mpCamera = null;
let overlayCtx = null; // 将 overlay context 存储起来

// 初始化 MediaPipe Hands
function initHands() {
  handsDetector = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`, // <--- 已修正
  });
  handsDetector.setOptions({
    maxNumHands: 1, // 识别单手
    minDetectionConfidence: 0.7, // 最小检测置信度
    minTrackingConfidence: 0.5, // 最小跟踪置信度
  });
  handsDetector.onResults(onResults); // 设置结果回调
}

// 处理检测结果
function onResults(results) {
  if (!overlay.value || !overlayCtx) {
    return;
  }
  // 清除上一帧的绘制
  overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    // 遍历检测到的每一只手
    for (const landmarks of results.multiHandLandmarks) {
      // 绘制手部连接线
      drawConnectors(overlayCtx, landmarks, Hands.HAND_CONNECTIONS, {
        color: "#00FF00", // 绿色线条
        lineWidth: 5,
      });
      // 绘制手部关键点
      drawLandmarks(overlayCtx, landmarks, {
        color: "#FF0000", // 红色关键点
        lineWidth: 2,
      });
      detectSimpleGesture(landmarks); // 进行手势判断
    }
  } else {
    gesture.value = "无"; // 没有检测到手
  }
}

// 简单手势检测示例：张开手掌 vs 握拳 vs 指向
// 注意：此手势判断逻辑非常基础，依赖于手在摄像头前的特定朝向和姿态。
// Y轴通常在图像中向下为正，X轴向右为正。
function detectSimpleGesture(landmarks) {
  // landmarks[0] 是手腕 WRIST
  // 食指: 4 (THUMB_TIP), 8 (INDEX_FINGER_TIP), 12 (MIDDLE_FINGER_TIP), 16 (RING_FINGER_TIP), 20 (PINKY_TIP)
  // 指关节: 6 (INDEX_FINGER_PIP), 10 (MIDDLE_FINGER_PIP) 等

  const wristY = landmarks[0].y;
  const indexTip = landmarks[8]; // 食指指尖
  const indexPip = landmarks[6]; // 食指指间关节 (PIP)
  const middleTip = landmarks[12]; // 中指指尖
  const middlePip = landmarks[10]; // 中指指间关节 (PIP)
  const ringTip = landmarks[16]; // 无名指指尖
  const ringPip = landmarks[14]; // 无名指指间关节 (PIP)
  const pinkyTip = landmarks[20]; // 小指指尖
  const pinkyPip = landmarks[18]; // 小指指间关节 (PIP)
  const thumbTip = landmarks[4]; // 拇指指尖
  const thumbIp = landmarks[3]; // 拇指指间关节(IP) - 注意不是MCP

  // 判断手指是否伸展（指尖的Y坐标通常小于或显著小于指关节的Y坐标，假设手指向上指）
  // 或者更通用的方式是比较指尖到手腕的距离和指关节到手腕的距离
  const isIndexStretched = indexTip.y < indexPip.y;
  const isMiddleStretched = middleTip.y < middlePip.y;
  const isRingStretched = ringTip.y < ringPip.y;
  const isPinkyStretched = pinkyTip.y < pinkyPip.y;

  // 拇指的判断可能需要基于X坐标或与其他手指的相对位置
  // 例如，一个简单的拇指伸展判断 (假设手掌朝向镜头，右手)
  const isThumbStretched = thumbTip.x < landmarks[2].x; // 拇指尖在拇指CMC关节左侧 (右手)

  if (
    isIndexStretched &&
    isMiddleStretched &&
    isRingStretched &&
    isPinkyStretched
  ) {
    gesture.value = "张开手掌"; // 五指伸展
  } else if (
    !isIndexStretched &&
    !isMiddleStretched &&
    !isRingStretched &&
    !isPinkyStretched
  ) {
    gesture.value = "握拳"; // 四指弯曲 (拇指情况未严格判断)
  } else if (
    isIndexStretched &&
    !isMiddleStretched &&
    !isRingStretched &&
    !isPinkyStretched
  ) {
    // 食指伸出，其他三指（中、无名、小指）弯曲
    // 如果拇指也伸出，类似 "点赞" 或 "一"
    // 如果拇指弯曲，类似 "指向"
    gesture.value = "指向";
  } else {
    gesture.value = "未知手势";
  }
}

// 开启摄像头并启动手势识别
const startCamera = async () => {
  // 标记为 async
  if (cameraOn.value) return;
  if (!handsDetector) {
    // 确保只初始化一次，或按需重新初始化
    initHands();
  }

  if (cameraView.value && overlay.value) {
    overlayCtx = overlay.value.getContext("2d"); // 获取 canvas context

    mpCamera = new Camera(cameraView.value, {
      onFrame: async () => {
        if (
          cameraView.value &&
          cameraView.value.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
        ) {
          // 确保视频帧可用
          await handsDetector.send({ image: cameraView.value });
        }
      },
      width: 640,
      height: 480,
    });

    try {
      await mpCamera.start(); // 等待摄像头成功启动
      // 确保视频流开始后再设置canvas尺寸，以获取正确的videoWidth/videoHeight
      cameraView.value.onloadedmetadata = () => {
        overlay.value.width = cameraView.value.videoWidth;
        overlay.value.height = cameraView.value.videoHeight;
      };
      // 如果视频已经加载元数据，则立即设置
      if (cameraView.value.videoWidth > 0) {
        overlay.value.width = cameraView.value.videoWidth;
        overlay.value.height = cameraView.value.videoHeight;
      }
      cameraOn.value = true;
      console.log("摄像头已开启，手势识别已启动");
    } catch (error) {
      console.error("启动摄像头失败:", error);
      cameraOn.value = false;
    }
  } else {
    console.error("摄像头或画布元素未找到");
  }
};

// 关闭摄像头
const stopCamera = () => {
  if (mpCamera) {
    mpCamera.stop();
    mpCamera = null; // 清理camera实例
  }
  if (overlayCtx) {
    // 清理画布
    overlayCtx.clearRect(0, 0, overlay.value.width, overlay.value.height);
  }
  cameraOn.value = false;
  gesture.value = "无";
  console.log("摄像头已关闭");
};

// AI 分析示例
const analyze = () => {
  if (cameraOn.value) {
    analysisReady.value = true;
    feedbackList.value = [
      "请保持眼神交流。",
      "回答速度可以更均匀一些。",
      "尝试多使用专业术语，提高表达精准度。",
      `当前手势: ${gesture.value}`, // 可以将手势信息加入反馈
    ];
  } else {
    feedbackList.value = ["请先开启摄像头再进行AI分析。"];
    analysisReady.value = false;
  }
};

// 组件挂载时可以初始化handsDetector
onMounted(() => {
  initHands();
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (mpCamera) {
    mpCamera.stop();
  }
  if (handsDetector) {
    handsDetector.close(); // 释放 MediaPipe Hands 资源
  }
});
</script>
  
  <style scoped>
.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
.camera-container {
  position: relative;
  width: 640px;
  height: 480px;
}
.gesture-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
  
<style scoped src="../assets/interview.css"></style>
  