<script setup lang="ts">
import { ref } from 'vue'

const inputValue = ref('')
const emit = defineEmits<{ sendMessage: [value: string] }>()

function send() {
  const value = inputValue.value.trim()
  if (!value) return

  emit('sendMessage', value)
  inputValue.value = ''
}
</script>

<template>
  <form class="chat-input" @submit.prevent="send">
    <input
      v-model.trim="inputValue"
      aria-label="消息内容"
      placeholder="输入消息…"
      type="text"
    />
    <button type="submit" :disabled="!inputValue.trim()">发送</button>
  </form>
</template>
