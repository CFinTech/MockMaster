<!-- src/App.vue -->
<template>
  <BaseLayout>
    <router-view />
  </BaseLayout>
</template>

<script>
import BaseLayout from "./components/BaseLayout.vue";
export default {
  components: { BaseLayout },
};
</script>
