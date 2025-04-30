<template>
  <div class="resumes-page">
    <!-- 页眉 -->
    <div class="page-header">
      <h1>Resumes &amp; Cover Letters</h1>
      <button class="create-btn">+ Create New</button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'resumes' }"
        @click="activeTab = 'resumes'"
      >
        Resumes
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'coverLetters' }"
        @click="activeTab = 'coverLetters'"
      >
        Cover Letters
      </button>
    </div>

    <!-- Resumes 面板 -->
    <div v-if="activeTab === 'resumes'">
      <!-- Banner -->
      <div class="banner">
        <div class="banner-icon">📧</div>
        <div class="banner-content">
          <p class="banner-title">
            Ready to give your job search a boost and get more exposure?
          </p>
          <p class="banner-subtitle">
            Choose your resume and we'll send it to hundreds of recruiters in
            your field in just a few clicks
          </p>
        </div>
        <button class="start-btn">Start Now</button>
      </div>

      <!-- 卡片网格 -->
      <div class="resume-grid">
        <!-- 示例简历卡片 -->
        <div class="card resume-card" v-for="r in resumes" :key="r.id">
          <div class="thumbnail"></div>
          <div class="info">
            <div class="title">
              <span>{{ r.title }}</span>
              <span class="icon-pencil">✏️</span>
            </div>
            <div class="updated">Updated {{ r.updated }}</div>
            <span class="score-badge">{{ r.score }}% Your resume score</span>
            <ul class="actions">
              <li>
                <button class="action-btn">
                  <span class="icon">🎯</span>
                  Tailor to job listing
                  <span v-if="r.isNew" class="new-badge">NEW</span>
                </button>
              </li>
              <li>
                <button class="action-btn">
                  <span class="icon">📥</span>
                  Download PDF
                </button>
              </li>
              <li>
                <button class="action-btn">
                  <span class="icon">📄</span>
                  Export to DOCX
                </button>
              </li>
              <li>
                <button class="action-btn">
                  <span class="icon">📜</span>
                  Export to TXT
                </button>
              </li>
              <li>
                <button class="action-btn">
                  <span class="icon">⋯</span>
                  More
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- 新建卡片 -->
        <div class="card new-card">
          <div class="new-icon">+</div>
          <div class="new-text">New Resume</div>
          <div class="new-desc">
            Create a tailored resume for each job application. Double your
            chances of getting hired!
          </div>
        </div>
      </div>
    </div>

    <!-- Cover Letters 面板（可自行补充内容） -->
    <div v-else>
      <p>Cover Letters content goes here…</p>
    </div>
  </div>
</template>
  
  <script setup>
import { ref } from "vue";

const activeTab = ref("resumes");

const resumes = ref([
  {
    id: 1,
    title: "Untitled",
    updated: "27 April, 19:15",
    score: 15,
    isNew: true,
  },
  // 如果有更多，依次添加
]);
</script>
  
  <!-- 引入全局布局样式和本页样式 -->
  <style src="../assets/layout.css"></style>
  <style src="../assets/resume.css"></style>
  