// 获取DOM元素
const chatForm = document.getElementById("chat-form");
const chatInput = document.querySelector(".chat-input-field");
const chatMessages = document.getElementById("chat-messages");
const startCameraBtn = document.getElementById("start-camera");
const stopCameraBtn = document.getElementById("stop-camera");
const analyzeBtn = document.getElementById("analyze-btn");
const video = document.querySelector("#video-grid video"); // 假设第一个视频是自己的摄像头
const analysisContent = document.getElementById("analysis-content");

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

// 发送消息
function sendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `
    <div class="message-header">
        <div class="message-avatar">${message.sender.charAt(0)}</div>
        <span class="message-sender">${message.sender}</span>
        <span class="message-time">${message.time}</span>
    </div>
    <div class="message-content">${message.content}</div>
  `;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加消息到聊天框
function addMessage(sender, content) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const timeString = `${hours}:${minutes}`;
  sendMessage({ sender, content, time: timeString });
}

// 模拟回复
function simulateReply() {
  const replies = [
    "这是个很好的观点！",
    "我同意你的看法",
    "我们可以从这个角度继续讨论",
    "有意思的见解",
    "让我们深入探讨一下这个问题",
  ];
  const randomReply = replies[Math.floor(Math.random() * replies.length)];
  const participants = ["王丽", "李强", "赵敏", "刘伟", "陈芳"];
  const randomParticipant =
    participants[Math.floor(Math.random() * participants.length)];
  addMessage(randomParticipant, randomReply);
}

// 发送消息
chatForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message) {
    addMessage("张小明", message);
    chatInput.value = "";

    // 模拟回复
    setTimeout(simulateReply, 1000 + Math.random() * 3000);
  }
});

// 开启摄像头
startCameraBtn.addEventListener("click", async () => {
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
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = false;
    stopCameraBtn.classList.remove("disabled");
  } catch (err) {
    console.error("摄像头开启失败:", err);
  }
});

// 关闭摄像头
stopCameraBtn.addEventListener("click", () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    stream = null;
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    stopCameraBtn.classList.add("disabled");

    // 停止分析
    if (analysisInterval) {
      clearInterval(analysisInterval);
      analysisInterval = null;
      analyzeBtn.querySelector(".analyze-btn-text").textContent = "开启AI分析";
      analyzeBtn.style.backgroundColor = "#4CAF50";
    }
  }
});

// AI分析按钮
analyzeBtn.addEventListener("click", () => {
  if (!stream) {
    alert("请先开启摄像头");
    return;
  }

  if (analysisInterval) {
    // 停止分析
    clearInterval(analysisInterval);
    analysisInterval = null;
    analyzeBtn.querySelector(".analyze-btn-text").textContent = "开启AI分析";
    analyzeBtn.style.backgroundColor = "#4CAF50";
  } else {
    // 开始分析
    analysisInterval = setInterval(() => {
      const feedback = document.createElement("div");
      feedback.classList.add("analysis-item");
      feedback.innerHTML = `
        <div class="analysis-title positive">
          您听起来很积极!
          <span class="analysis-time">${getCurrentTime()}</span>
        </div>
        <div class="analysis-content">
          太棒了，您回答的这一部分有着很好的积极语调！在下次练习中保持同样的能量！
        </div>
      `;
      analysisContent.appendChild(feedback);
    }, 5000); // 每5秒生成一次分析结果

    analyzeBtn.querySelector(".analyze-btn-text").textContent = "停止AI分析";
    analyzeBtn.style.backgroundColor = "#f44336";
  }
});
