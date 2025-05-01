<template>
  <div class="container">
    <!-- Sidebar -->
    <aside id="sidebar">
      <div class="sidebar-content">
        <div class="logo">career.io</div>
        <div class="profile-section">
          <div class="avatar">5%</div>
          <div class="profile-info">
            <div class="name">add sub</div>
            <div class="role">Set your target role</div>
          </div>
        </div>
        <ul class="menu">
          <li :class="{ active: isActive('/') }">
            <router-link to="/">Interview Prepare</router-link>
          </li>
          <li :class="{ active: isActive('/mock') }">
            <router-link to="/mock">Mock Interview</router-link>
          </li>
          <li :class="{ active: isActive('/resumes') }">
            <router-link to="/resumes">Resumes</router-link>
          </li>
          <li :class="{ active: isActive('/tracker') }">
            <router-link to="/tracker">Job Tracker</router-link>
          </li>
          <li :class="{ active: isActive('/calendar') }">
            <router-link to="/calendar">Calendar</router-link>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main + Topbar -->
    <div class="main-section">
      <header class="topbar">
        <nav class="topnav">
          <router-link to="/contact">Contact Us</router-link>
        </nav>
        <button class="upgrade-btn">Upgrade Now</button>
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
  