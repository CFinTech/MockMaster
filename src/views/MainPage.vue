<template>
  <section class="interview-page" tabindex="-1">
    <!-- 1. 顶部标题区 -->
    <header class="header-row">
      <h1 class="title">
        My Interviews&nbsp;
        <a href="#" class="job-link" @click.prevent>
          for&nbsp;Software&nbsp;Developer
          <i class="i-badge" aria-hidden="true">🔷</i>
        </a>
      </h1>
      <div
        class="progress-wrap"
        @mouseenter="tooltipOpen = true"
        @mouseleave="tooltipOpen = false"
        tabindex="0"
        @focus="tooltipOpen = true"
        @blur="tooltipOpen = false"
      >
        <svg viewBox="0 0 44 44" class="ring">
          <circle cx="22" cy="22" r="20" class="track" />
          <circle
            cx="22"
            cy="22"
            r="20"
            class="progress"
            :style="{ strokeDashoffset: progressOffset }"
          />
        </svg>
        <span class="progress-text">{{ done }} of {{ total }} completed</span>
        <transition name="fade">
          <div v-if="tooltipOpen" class="tooltip" role="tooltip">
            已完成 {{ done }} 项，还剩 {{ total - done }} 项
          </div>
        </transition>
      </div>
    </header>

    <!-- 2. In-Progress 卡片区 -->
    <section class="card-scroll">
      <InterviewCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @done="markDone"
      />
      <button class="create-btn" @click="modalOpen = true">+ Create new</button>
    </section>

    <!-- 3. 标签切换区 -->
    <nav class="tabs" role="tablist">
      <button
        role="tab"
        class="tab"
        :class="{ active: tab === 'progress' }"
        @click="tab = 'progress'"
        :aria-selected="tab === 'progress'"
      >
        In progress
      </button>
      <button
        role="tab"
        class="tab"
        :class="{ active: tab === 'complete' }"
        @click="tab = 'complete'"
        :aria-selected="tab === 'complete'"
      >
        Complete
      </button>
      <span
        class="tab-underline"
        :style="{
          transform: tab === 'progress' ? 'translateX(0)' : 'translateX(100%)',
        }"
      ></span>
    </nav>

    <!-- 4. 完成区 & 空状态 -->
    <transition name="fade-slide" mode="out-in">
      <ul
        v-if="tab === 'complete' && doneCards.length"
        key="list"
        class="complete-list"
      >
        <li v-for="c in doneCards" :key="c.id">{{ c.title }}</li>
      </ul>

      <div v-else-if="tab === 'complete'" key="empty" class="empty-state">
        <p>So far, you have no complete interviews</p>
        <button class="primary" @click="modalOpen = true">New interview</button>
      </div>

      <div v-else key="progress-dummy"></div>
    </transition>

    <!-- 6. 下方滚动区域 -->
    <section class="section">
      <h2 class="section-title">
        <span>Polish your interview skills</span>
        <span class="badge">Available for Premium</span>
        <button class="lib-btn">Questions Library ❔</button>
      </h2>
      <div class="h-scroll">
        <MiniCard v-for="c in skillCards" :key="c.id" :card="c" />
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">
        <span>Get ready for the real thing</span>
        <span class="badge">Available for Premium</span>
      </h2>
      <div class="h-scroll">
        <MiniCard v-for="c in realCards" :key="c.id" :card="c" />
      </div>
    </section>

    <!-- 5. 新建弹框 -->
    <transition name="fade">
      <div v-if="modalOpen" class="mask" @click.self="modalOpen = false">
        <div class="modal" role="dialog" aria-modal="true">
          <h3 class="modal-title">Create new</h3>
          <div class="modal-options">
            <ModalOption
              type="question"
              :active="modalType === 'question'"
              @select="modalType = 'question'"
            />
            <ModalOption
              type="interview"
              :active="modalType === 'interview'"
              @select="modalType = 'interview'"
            />
          </div>
          <footer class="modal-actions">
            <button class="primary" @click="confirmCreate">Create</button>
            <button class="ghost" @click="modalOpen = false">Cancel</button>
          </footer>
        </div>
      </div>
    </transition>
  </section>
</template>
  
  <script setup>
import { ref, computed } from "vue";
import InterviewCard from "../components/InterviewCard.vue";
import MiniCard from "../components/MiniCard.vue";
import ModalOption from "../components/ModalOption.vue";

const total = 4;
const done = ref(0);
const tooltipOpen = ref(false);
const cards = ref([
  {
    id: 1,
    kind: "question",
    duration: 5,
    title:
      "What inspires you about the prospect of working as a Software Developer within our organization?",
    done: false,
  },
  {
    id: 2,
    kind: "question",
    duration: 5,
    title:
      "What interests you most about the Software Developer role, and how does it resonate with your...",
    done: false,
  },
  {
    id: 3,
    kind: "question",
    duration: 5,
    title:
      "Can you detail your approach to implementing continuous integration and continuous...",
    done: false,
  },
  {
    id: 4,
    kind: "interview",
    duration: 45,
    title: "Software Developer at Bank Of America • 9 questions",
    done: false,
  },
]);
const tab = ref("progress");
const modalOpen = ref(false);
const modalType = ref("question");

const progressOffset = computed(() => {
  const ratio = done.value / total;
  return 125.6 * (1 - ratio);
});
const doneCards = computed(() => cards.value.filter((c) => c.done));

function markDone(card) {
  if (!card.done) {
    card.done = true;
    done.value++;
  }
}
function confirmCreate() {
  alert(`Create new ${modalType.value}`);
  modalOpen.value = false;
}

const skillCards = [
  {
    id: 11,
    kind: "question",
    duration: 5,
    title:
      "Tell me about a time when you had to work under a tight deadline in a software development proje...",
  },
  {
    id: 12,
    kind: "question",
    duration: 5,
    title:
      "Describe a situation where you had to quickly adapt to a new technology or programming...",
  },
  {
    id: 13,
    kind: "question",
    duration: 5,
    title:
      "Can you discuss a technical challenge you faced in a previous software development role and...",
  },
];
const realCards = [
  {
    id: 21,
    kind: "interview",
    duration: 45,
    title: "Software Developer at Accenture • 9 Questions",
    icon: "▶",
  },
  {
    id: 22,
    kind: "interview",
    duration: 45,
    title: "Software Developer at Adobe • 9 Questions",
    icon: "🅰",
  },
  {
    id: 23,
    kind: "interview",
    duration: 45,
    title: "Software Developer at Amazon • 9 Questions",
    icon: "🛒",
  },
  {
    id: 24,
    kind: "interview",
    duration: 45,
    title: "Software Developer at Apple • 9 Questions",
    icon: "",
  },
];
</script>
  
  <style src="../assets/layout.css"></style>
  <style src="../assets/mainpage.css"></style>
  