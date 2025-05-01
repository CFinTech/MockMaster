<template>
  <div class="mini-card" :class="card.kind">
    <span class="duration">⏱ {{ card.duration }} min</span>
    <span class="tag">
      {{ card.kind === "question" ? "Question" : "Interview" }}
    </span>
    <div v-if="card.icon" class="icon">{{ card.icon }}</div>
    <p class="summary">{{ card.title }}</p>
  </div>
</template>
  
  <script setup>
const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
});
</script>
  