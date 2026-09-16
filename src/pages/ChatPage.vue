<script setup lang="ts">
import { ref } from 'vue'
import MessageList from '../components/MessageList.vue'
import ChatInput from '../components/ChatInput.vue'
import type { ChatMessage } from '../types/chat'

const messages = ref<ChatMessage[]>([])
let nextMessageId = 1

function sendMessage(value: string) {
  const content = value.trim()
  if (!content) return

  messages.value.push({ id: nextMessageId++, role: 'user', content })
  messages.value.push({
    id: nextMessageId++,
    role: 'assistant',
    content: `Mock AI：收到你的消息「${content}」。`,
  })
}
</script>

<template>
  <main class="chat-page">
    <header class="chat-header">
      <h1>AI Chat</h1>
      <p>当前使用 Mock AI 回复</p>
    </header>
    <MessageList :messages="messages" />
    <ChatInput @send-message="sendMessage" />
  </main>
</template>
