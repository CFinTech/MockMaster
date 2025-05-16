<template>
  <div class="resumes-page">
    <!-- 页眉 -->
    <div class="page-header">
      <h1>简历 & 求职信</h1>
      <button class="create-btn" @click="onCreateNew">+ 新建</button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'resumes' }"
        @click="activeTab = 'resumes'"
      >
        简历
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'coverLetters' }"
        @click="activeTab = 'coverLetters'"
      >
        求职信
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
                title="编辑标题"
                >✏️</span
              >
            </div>
            <div class="updated">更新于 {{ r.updated }}</div>
            <span class="score-badge">{{ r.score }}% 你的简历得分</span>
            <ul class="actions">
              <li>
                <button class="action-btn" @click="onTailor(r.id)">
                  <span class="icon">🎯</span>
                  针对职位调整
                  <span v-if="r.isNew" class="new-badge">新</span>
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onDownloadPDF(r.id)">
                  <span class="icon">📥</span>
                  下载 PDF
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onExport(r.id, 'docx')">
                  <span class="icon">📄</span>
                  导出为 DOCX
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onExport(r.id, 'txt')">
                  <span class="icon">📜</span>
                  导出为 TXT
                </button>
              </li>
              <li>
                <button class="action-btn" @click="onMore(r.id)">
                  <span class="icon">⋯</span>
                  更多
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
          </div>

          <!-- 弹出菜单 -->
          <div v-if="newMenuOpen" class="new-menu">
            <div class="new-menu-item" @click="onCreateFromTemplate">
              <div class="menu-icon">📄</div>
              <div class="menu-text">
                <div class="title">创建一份新的简历</div>
                <div class="desc">使用模板创建一份新的简历，然后从头填写</div>
              </div>
            </div>
            <div class="new-menu-item" @click="onDuplicateExisting">
              <div class="menu-icon">
                <div class="thumbnail" style="width: 36px; height: 52px"></div>
              </div>
              <div class="menu-text">
                <div class="title">复制已有简历</div>
                <div class="desc">复制一份已有的简历，然后根据需求进行定制</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cover Letters 占位 -->
    <div class="coverletters-placeholder" v-else>
      <p>求职信内容将在此显示…</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const activeTab = ref("resumes");
const resumes = ref([
  { id: 1, title: "未命名", updated: "5月1日 17:03", score: 29, isNew: true },
]);
const newMenuOpen = ref(false);

function toggleNewMenu() {
  newMenuOpen.value = !newMenuOpen.value;
}

function onEditTitle(id) {
  alert(`编辑简历 ${id} 的标题`);
}
function onTailor(id) {
  alert(`为职位定制简历 ${id}`);
}
function onDownloadPDF(id) {
  alert(`下载 PDF ${id}`);
}
function onExport(id, fmt) {
  alert(`导出 ${id} 为 ${fmt}`);
}
function onMore(id) {
  alert(`更多选项 ${id}`);
}
function onCreateNew() {
  alert("创建新简历");
}
function onCreateFromTemplate() {
  alert("从模板创建新简历");
}
function onDuplicateExisting() {
  alert("复制现有简历");
}
</script>

<!-- 引入全局布局和本页样式 -->
<style src="../assets/layout.css"></style>
<style src="../assets/resumes.css"></style>
