<template>
  <div class="container">
    <!-- Sidebar -->
    <aside id="sidebar">
      <div class="sidebar-content">
        <div class="logo">
          <img
            src="../assets/logo.jpg"
            alt="MockMaster Logo"
            class="logo-img"
          />
          <span class="logo-text">MockMaster</span>
        </div>
        <div class="profile-section">
          <div class="avatar">徐</div>
          <div class="profile-info">
            <div class="name">徐小铭</div>
            <div class="role">软件开发工程师</div>
          </div>
        </div>
        <ul class="menu">
          <li :class="{ active: isActive('/') }">
            <router-link to="/">面试准备</router-link>
          </li>
          <li :class="{ active: isActive('/simulate') }">
            <router-link to="/simulate">模拟面试</router-link>
          </li>
          <li :class="{ active: isActive('/resumes') }">
            <router-link to="/resumes">个人简历</router-link>
          </li>
          <li :class="{ active: isActive('/tracker') }">
            <router-link to="/tracker">进度追踪</router-link>
          </li>
          <li :class="{ active: isActive('/calendar') }">
            <router-link to="/calendar">我的日历</router-link>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main + Topbar -->
    <div class="main-section">
      <header class="topbar">
        <nav class="topnav">
          <router-link to="/contact">联系我们</router-link>
        </nav>
        <button class="upgrade-btn">获取升级版</button>
      </header>
      <main id="main-content" :class="pageClass">
        <slot />
      </main>
    </div>
  </div>
</template>
  
  <script setup>
import { useRoute } from "vue-router";
import { computed } from "vue";
const route = useRoute();
const isActive = (path) => route.path === path;
const pageClass = computed(() => {
  const p = route.path.slice(1) || "home";
  return `${p}-page`;
});
</script>
  