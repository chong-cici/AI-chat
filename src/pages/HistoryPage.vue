<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="chat-page">
    <header class="chat-header">
      <h1>历史会话</h1>
      <p><RouterLink to="/chat">返回聊天</RouterLink></p>
    </header>
    <section class="message-list" aria-label="历史会话">
      <p class="empty-state">暂无历史会话，当前消息仅保存在聊天页面内存中。</p>
    </section>
  </main>
</template>
