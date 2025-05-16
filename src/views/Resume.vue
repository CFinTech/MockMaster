<template>
  <div class="resumes-page">
    <!-- 页眉 -->
    <div class="page-header">
      <h1>Resumes &amp; Cover Letters</h1>
      <button class="create-btn" @click="onCreateNew">+ 新建</button>
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

    <!-- 简历卡片 & 新建卡片 -->
    <div class="resume-grid-container" v-if="activeTab === 'resumes'">
      <div class="resume-grid">
        <!-- 已有简历 -->
        <div class="card resume-card" v-for="r in resumes" :key="r.id">
          <div class="thumbnail">
            <!-- 可替换为 <img :src="r.thumb" /> -->
          </div>
          <div class="info">
            <div class="title">
              <span>{{ r.title }}</span>
              <span
                class="icon-pencil"
                @click="onEditTitle(r.id)"
                title="Edit title"
                >✏️</span
              >
            </div>
            <div class="updated">Updated {{ r.updated }}</div>
            <span class="score-badge">{{ r.score }}% Your resume score</span>
            <ul class="actions">
              <li>
                <button class="action-btn" @click="onTailor(r.id)">
                  <span class="icon">🎯</span>
                  Tailor to job listing
                  <span v-if="r.isNew" class="new-badge">NEW</span>
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onDownloadPDF(r.id)">
                  <span class="icon">📥</span>
                  Download PDF
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onExport(r.id, 'docx')">
                  <span class="icon">📄</span>
                  Export to DOCX
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onExport(r.id, 'txt')">
                  <span class="icon">📜</span>
                  Export to TXT
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onMore(r.id)">
                  <span class="icon">⋯</span>
                  More
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- 新建卡片 -->
        <div class="card new-card" @click="toggleNewMenu">
          <div class="new-icon" :class="{ open: newMenuOpen }">+</div>
          <div class="new-text">创建简历</div>
          <div class="new-desc">
            根据具体求职需求，创建适合的简历，才能提高上岸概率！！！
            <!-- Create a tailored resume for each job application. Double your
            chances of getting hired! -->
          </div>

          <!-- 弹出菜单 -->
          <div v-if="newMenuOpen" class="new-menu">
            <div class="new-menu-item" @click="onCreateFromTemplate">
              <div class="menu-icon">📄</div>
              <div class="menu-text">
                <div class="title">创建一份新的简历</div>
                <div class="desc">
                  使用模板创建一份新的简历，而后从头书写
                  <!-- Create a new resume using a design template and fill it out
                  from scratch -->
                </div>
              </div>
            </div>
            <div class="new-menu-item" @click="onDuplicateExisting">
              <div class="menu-icon">
                <div class="thumbnail" style="width: 36px; height: 52px"></div>
              </div>
              <div class="menu-text">
                <div class="title">复制已有简历</div>
                <div class="desc">
                  复制一份已有的简历，而后根据需求调整定制
                  <!-- Copy an existing resume and customize it for another job or
                  another goal -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cover Letters 占位 -->
    <div class="coverletters-placeholder" v-else>
      <p>Cover Letters content goes here…</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const activeTab = ref("resumes");
const resumes = ref([
  { id: 1, title: "Untitled", updated: "1 May, 17:03", score: 29, isNew: true },
]);
const newMenuOpen = ref(false);

function toggleNewMenu() {
  newMenuOpen.value = !newMenuOpen.value;
}

function onEditTitle(id) {
  alert(`Edit title of resume ${id}`);
}
function onTailor(id) {
  alert(`Tailor resume ${id}`);
}
function onDownloadPDF(id) {
  alert(`Download PDF ${id}`);
}
function onExport(id, fmt) {
  alert(`Export ${id} as ${fmt}`);
}
function onMore(id) {
  alert(`More options for ${id}`);
}
function onCreateNew() {
  alert("Create new resume");
}
function onCreateFromTemplate() {
  alert("Create a new resume from template");
}
function onDuplicateExisting() {
  alert("Duplicate an existing resume");
}
</script>

<!-- 引入全局布局和本页样式 -->
<style src="../assets/layout.css"></style>
<style src="../assets/resumes.css"></style>
