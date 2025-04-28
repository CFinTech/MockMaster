// 获取DOM元素
const video = document.getElementById("camera-view");
const startBtn = document.getElementById("start-camera");
const stopBtn = document.getElementById("stop-camera");
const analyzeBtn = document.getElementById("analyze-btn");
const statusIndicator = document.querySelector(".status-indicator");
const analysisIndicator = document.querySelector(".analysis-indicator");
const feedbackContainer = document.getElementById("feedback-container");

let stream = null;
let analysisInterval = null;

// 获取当前时间字符串
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// 开启摄像头
startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: true,
    });
    video.srcObject = stream;
    updateCameraStatus("已开启");
    startBtn.disabled = true;
    stopBtn.disabled = false;
    stopBtn.classList.remove("disabled");
  } catch (err) {
    console.error("摄像头开启失败:", err);
    updateCameraStatus("开启失败");
  }
});

// 关闭摄像头
stopBtn.addEventListener("click", () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    stream = null;
    updateCameraStatus("等待开启");
    startBtn.disabled = false;
    stopBtn.disabled = true;
    stopBtn.classList.add("disabled");

    // 停止分析
    stopAnalysis();
  }
});

// 分析按钮
analyzeBtn.addEventListener("click", () => {
  if (!stream) {
    alert("请先开启摄像头");
    return;
  }

  if (analysisInterval) {
    stopAnalysis();
  } else {
    startAnalysis();
  }
});

// 更新摄像头状态
function updateCameraStatus(status) {
  statusIndicator.textContent = `摄像头: ${status}`;

  // 如果摄像头关闭，确保分析也停止
  if (status === "等待开启" || status === "开启失败") {
    stopAnalysis();
  }
}

// 开始分析
function startAnalysis() {
  analyzeBtn.querySelector(".analyze-btn-text").textContent = "停止AI分析";
  analyzeBtn.style.backgroundColor = "#f44336";
  analysisIndicator.textContent = "AI分析: 已开启";

  // 每5秒提供一条分析反馈
  analysisInterval = setInterval(() => {
    const feedback = document.createElement("div");
    feedback.classList.add("feedback-item");
    feedback.innerHTML = `
      <div class="feedback-title positive">
        您听起来很积极!
        <span class="feedback-time">${getCurrentTime()}</span>
      </div>
      <div class="feedback-content">太棒了，您回答的这一部分有着很好的积极语调！在下次练习中保持同样的能量！</div>
    `;
    feedbackContainer.appendChild(feedback); // 新的反馈添加到末尾
  }, 5000); // 每5秒钟添加一条建议
}

// 停止分析
function stopAnalysis() {
  if (analysisInterval) {
    clearInterval(analysisInterval);
    analysisInterval = null;
    analyzeBtn.querySelector(".analyze-btn-text").textContent = "开启AI分析";
    analyzeBtn.style.backgroundColor = "#4CAF50";
    analysisIndicator.textContent = "AI分析: 准备就绪";
  }
}
