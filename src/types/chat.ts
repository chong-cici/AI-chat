export type UserMessage = {
  id: number
  role: 'user'
  content: string
}

export type AIMessage = {
  id: number
  role: 'assistant'
  content: string
}

export type ChatMessage = UserMessage | AIMessage
