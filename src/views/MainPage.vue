<template>
  <section class="interview-page" tabindex="-1">
    <!-- 1. 顶部标题区 -->
    <header class="header-row">
      <h1 class="title">
        我的面试&nbsp;
        <a href="#" class="job-link" @click.prevent>
          软件开发工程师
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
        <span class="progress-text">{{ done }} / {{ total }} 已完成</span>
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
      <button class="create-btn" @click="modalOpen = true">+ 新建</button>
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
        进行中
      </button>
      <button
        role="tab"
        class="tab"
        :class="{ active: tab === 'complete' }"
        @click="tab = 'complete'"
        :aria-selected="tab === 'complete'"
      >
        已完成
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
        <p>目前你还没有完成的面试</p>
        <button class="primary" @click="modalOpen = true">新建面试</button>
      </div>

      <div v-else key="progress-dummy"></div>
    </transition>

    <!-- 6. 下方滚动区域 -->
    <section class="section">
      <h2 class="section-title">
        <span>提升你的面试技巧</span>
        <!-- <span class="badge">仅限高级版</span> -->
        <button class="lib-btn">题库 ❔</button>
      </h2>
      <div class="h-scroll">
        <MiniCard v-for="c in skillCards" :key="c.id" :card="c" />
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">
        <span>为真实面试做好准备</span>
        <!-- <span class="badge">仅限高级版</span> -->
      </h2>
      <div class="h-scroll">
        <MiniCard v-for="c in realCards" :key="c.id" :card="c" />
      </div>
    </section>

    <!-- 5. 新建弹框 -->
    <transition name="fade">
      <div v-if="modalOpen" class="mask" @click.self="modalOpen = false">
        <div class="modal" role="dialog" aria-modal="true">
          <h3 class="modal-title">新建</h3>
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
            <button class="primary" @click="confirmCreate">创建</button>
            <button class="ghost" @click="modalOpen = false">取消</button>
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
    title: "是什么激励你希望在我们组织中担任软件开发工程师？",
    done: false,
  },
  {
    id: 2,
    kind: "question",
    duration: 5,
    title: "你对软件开发工程师职位最感兴趣的方面是什么？它与你的经验如何契合？",
    done: false,
  },
  {
    id: 3,
    kind: "question",
    duration: 5,
    title: "你能详细说明你实施持续集成和持续部署的方式吗？",
    done: false,
  },
  {
    id: 4,
    kind: "interview",
    duration: 45,
    title: "美国银行 软件开发工程师 • 9 道问题",
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
  alert(`创建新${modalType.value === "question" ? "问题" : "面试"}`);
  modalOpen.value = false;
}

const skillCards = [
  {
    id: 11,
    kind: "question",
    duration: 5,
    title: "谈谈你在软件开发项目中必须在紧迫期限下工作的经历。",
  },
  {
    id: 12,
    kind: "question",
    duration: 5,
    title: "描述你如何快速适应新技术或编程语言的情况。",
  },
  {
    id: 13,
    kind: "question",
    duration: 5,
    title: "你能讨论你在之前软件开发角色中遇到的技术挑战吗？",
  },
];
const realCards = [
  {
    id: 21,
    kind: "interview",
    duration: 45,
    title: "埃森哲 软件开发工程师 • 9 道问题",
    icon: "▶",
  },
  {
    id: 22,
    kind: "interview",
    duration: 45,
    title: "Adobe 软件开发工程师 • 9 道问题",
    icon: "🅰",
  },
  {
    id: 23,
    kind: "interview",
    duration: 45,
    title: "亚马逊 软件开发工程师 • 9 道问题",
    icon: "🛒",
  },
  {
    id: 24,
    kind: "interview",
    duration: 45,
    title: "苹果 软件开发工程师 • 9 道问题",
    icon: "A",
  },
];
</script>

<!-- <style src="../assets/layout.css"></style> -->
<style src="../assets/mainpage.css"></style>
