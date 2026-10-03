<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MessageList from '../components/MessageList.vue'
import ChatInput from '../components/ChatInput.vue'
import type { ChatMessage } from '../types/chat'
import { sendChatMessage } from '../services/chat'

const messages = ref<ChatMessage[]>([])
const isSending = ref(false)
const errorMessage = ref('')
let nextMessageId = 1
let activeController: AbortController | undefined

onBeforeUnmount(() => activeController?.abort())

async function sendMessage(value: string) {
  const content = value.trim()
  if (!content || isSending.value) return

  isSending.value = true
  errorMessage.value = ''
  messages.value.push({ id: nextMessageId++, role: 'user', content })
  const controller = new AbortController()
  activeController = controller
  try {
    const response = await sendChatMessage({ message: content }, { signal: controller.signal })
    if (controller.signal.aborted) return
    messages.value.push({
      id: nextMessageId++,
      role: 'assistant',
      content: response.data.content,
    })
  } catch (error) {
    if (!controller.signal.aborted) {
      errorMessage.value = error instanceof Error ? error.message : '发送失败，请稍后再试。'
    }
  } finally {
    activeController = undefined
    isSending.value = false
  }
}
</script>

<template>
  <main class="chat-page">
    <header class="chat-header">
      <h1>AI Chat</h1>
      <p>当前使用 Mock AI 回复</p>
      <p><RouterLink to="/history">历史会话</RouterLink></p>
    </header>
    <MessageList :messages="messages" />
    <p v-if="errorMessage" role="alert" class="chat-error">{{ errorMessage }}</p>
    <ChatInput :is-sending="isSending" @send-message="sendMessage" />
  </main>
</template>

<style scoped>
.chat-error { margin: 0; padding: 12px 16px; color: #b91c1c; }
</style>
