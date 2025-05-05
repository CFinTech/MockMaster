<template>
  <div
    class="big-card"
    :class="[card.kind, { flipped }]"
    @click="flip"
    tabindex="0"
  >
    <!-- 正面 -->
    <div class="side front">
      <span class="duration">⏱ {{ card.duration }} min</span>
      <span class="tag">
        {{ card.kind === "question" ? "Question" : "Interview" }}
      </span>
      <p class="summary">{{ card.title }}</p>
    </div>
    <!-- 背面 -->
    <div class="side back">
      <button class="primary full" @click.stop="doneIt">Start practice</button>
    </div>
  </div>
</template>
  
  <script setup>
import { ref } from "vue";

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["done"]);

const flipped = ref(false);

function flip() {
  flipped.value = !flipped.value;
}

function doneIt() {
  emit("done", props.card);
  flipped.value = false;
}
</script>
  
<style scoped src="../assets/mainpage.css"></style>