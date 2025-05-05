<template>
  <div
    class="modal-option"
    :class="{ active }"
    @click="$emit('select')"
    tabindex="0"
  >
    <div class="plus">+</div>
    <h4>{{ type === "question" ? "Question" : "Interview" }}</h4>
  </div>
</template>
  
  <script setup>
const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["select"]);
</script>

<style scoped src="../assets/mainpage.css"></style>