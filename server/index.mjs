import { createChatServer } from './chat.mjs'

createChatServer().listen(3001, '127.0.0.1', () => {
  console.log('Chat API: http://127.0.0.1:3001')
})
