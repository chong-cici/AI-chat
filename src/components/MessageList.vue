<script setup lang="ts">
import type { ChatMessage } from '../types/chat'

defineProps<{ messages: ChatMessage[] }>()
</script>

<template>
  <section class="message-list" aria-label="聊天消息" role="log" aria-live="polite">
    <p v-if="messages.length === 0" class="empty-state">发送一条消息，开始聊天。</p>
    <article
      v-for="message in messages"
      :key="message.id"
      class="message"
      :class="message.role"
    >
      <span class="message-role">{{ message.role === 'user' ? '你' : 'AI' }}</span>
      <p>{{ message.content }}</p>
    </article>
  </section>
</template>
