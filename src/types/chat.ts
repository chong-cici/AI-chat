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

export interface ChatRequest {
  message: string
}

export interface ChatResponseData {
  content: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export type ChatResponse = ApiResponse<ChatResponseData>
export type ChatErrorResponse = ApiResponse<null>
