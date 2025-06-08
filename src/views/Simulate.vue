<template>
  <div class="simulate-page">
    <header class="simulate-header">
      <h1>AI 模拟面试</h1>
      <p>在这里，与 AI 一同提升你的面试技巧，自信迎接每一个挑战。</p>
    </header>

    <main class="interview-cards-container">
      <div class="interview-card individual" @click="startIndividualInterview">
        <div class="card-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h2 class="card-title">个人面试</h2>
        <p class="card-description">
          与AI面试官进行一对一深度对话，模拟真实面试场景，获得即时反馈和改进建议。
        </p>
        <button class="card-cta">立即开始 <span>&rarr;</span></button>
      </div>

      <div class="interview-card group" @click="startGroupInterview">
        <div class="card-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h2 class="card-title">小组面试</h2>
        <p class="card-description">
          在多角色AI模拟的小组讨论中，锻炼你的团队协作、沟通和领导能力。
        </p>
        <button class="card-cta">立即开始 <span>&rarr;</span></button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

// 假设你使用了 Vue Router
const router = useRouter();

function startIndividualInterview() {
  console.log("开始个人面试...");
  // 在实际应用中，你可能会导航到新的路由
  router.push("/interview");
}

// [MODIFIED] 新增小组面试的点击处理函数
function startGroupInterview() {
  console.log("开始小组面试...");
  // 在实际应用中，你可能会导航到新的路由
  router.push("/multi_interview");
}
</script>

<style scoped src="../assets/simulate.css"></style>