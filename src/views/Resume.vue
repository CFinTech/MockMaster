<template>
  <div class="resumes-page">
    <div class="page-header">
      <h1>简历 & 求职信</h1>
      <button class="create-btn" @click="onCreateNew">+ 新建</button>
    </div>

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

    <div class="resume-grid-container" v-if="activeTab === 'resumes'">
      <div class="resume-grid">
        <div
          class="card resume-card"
          v-for="r in resumes"
          :key="r.id"
          @click="onEditResume(r.id)"
          title="点击编辑简历"
        >
          <div class="thumbnail"></div>
          <div class="info">
            <div class="title">
              <span>{{ r.title }}</span>
              <span
                class="icon-pencil"
                @click.stop="onEditTitle(r.id)"
                title="编辑标题"
                >✏️</span
              >
            </div>
            <div class="updated">更新于 {{ r.updated }}</div>
            <span class="score-badge">{{ r.score }}% 你的简历得分</span>
            <ul class="actions">
              <li>
                <button class="action-btn" @click.stop="onTailor(r.id)">
                  <span class="icon">🎯</span>
                  针对职位调整
                  <span v-if="r.isNew" class="new-badge">新</span>
                </button>
              </li>
              <li>
                <button class="action-btn" @click.stop="onDownloadPDF(r.id)">
                  <span class="icon">📥</span>
                  下载 PDF
                </button>
              </li>
              <li>
                <button class="action-btn" @click.stop="onExport(r.id, 'docx')">
                  <span class="icon">📄</span>
                  导出为 DOCX
                </button>
              </li>
              <li>
                <button class="action-btn" @click.stop="onExport(r.id, 'txt')">
                  <span class="icon">📜</span>
                  导出为 TXT
                </button>
              </li>
              <li>
                <button class="action-btn" @click.stop="onMore(r.id)">
                  <span class="icon">⋯</span>
                  更多
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div class="new-card-wrapper">
          <div class="card new-card" @click="toggleNewMenu">
            <div class="new-icon" :class="{ open: newMenuOpen }">+</div>
            <div class="new-text">创建简历</div>
            <div class="new-desc">
              根据具体求职需求，创建适合的简历，才能提高上岸概率！！！
            </div>
          </div>

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

    <div class="coverletters-placeholder" v-else>
      <p>求职信内容将在此显示…</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

// 获取 router 实例用于导航
const router = useRouter();

const activeTab = ref("resumes");
const resumes = ref([
  { id: 1, title: "未命名", updated: "5月1日 17:03", score: 29, isNew: true },
]);
const newMenuOpen = ref(false);

function toggleNewMenu() {
  newMenuOpen.value = !newMenuOpen.value;
}

// 导航到简历编辑页
function onEditResume(id) {
  console.log(`正在导航到简历 ${id} 的编辑页面...`);
  router.push(`/singleresume`);
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
  router.push(`/singleresume`);
}
function onCreateFromTemplate() {
  router.push(`/singleresume`);
}
function onDuplicateExisting() {
  router.push(`/singleresume`);
}
</script>

<style src="../assets/layout.css"></style>
<style src="../assets/resumes.css"></style>

<style scoped>
/* 使简历卡片在悬停时更明显，并显示可点击的光标 */
.resume-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 550px;
  height: 300px;
}

.resume-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* “新建卡片”的包裹容器，用于定位弹出菜单 */
.new-card-wrapper {
  position: relative;
  width: 550px;
  height: 350px;
}

.new-menu {
  position: absolute;
  top: 0; /* 垂直方向与卡片顶部对齐 */
  right: 100%; /* 将菜单的右边框对齐到其容器的左边框 */
  margin-right: 36px; /* 在菜单和卡片之间创建一个16px的间隙 */
  transform: none; /* 移除旧的居中 transform */
  z-index: 10; /* 确保菜单在最上层 */
}
</style>