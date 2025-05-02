<template>
  <!-- 根据当前路由 meta.layout 决定用 div （无 layout）还是 BaseLayout -->
  <component :is="layoutComp">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import BaseLayout from "./components/BaseLayout.vue";

const route = useRoute();
// 如果 meta.layout === false，就用 <div> 包裹，否则用 BaseLayout
const layoutComp = computed(() =>
  route.meta.layout === false ? "div" : BaseLayout
);
</script>
