import type { ChatRequest, ChatResponse } from '../types/chat'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: 'http' | 'business' | 'network' | 'response',
    public readonly status?: number,
    public readonly code?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function sendChatMessage(
  request: ChatRequest,
  options: { signal?: AbortSignal } = {},
): Promise<ChatResponse> {
  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) throw error
    throw new ApiError('无法连接聊天服务，请稍后再试。', 'network')
  }

  // HTTP 状态独立于业务 code；使用本地提示避免泄漏内部错误。
  if (!response.ok) {
    throw new ApiError(response.status === 400
      ? '消息内容无效，请输入非空文本。'
      : '聊天服务暂时不可用，请稍后再试。', 'http', response.status)
  }

  let result: unknown
  try {
    result = await response.json()
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) throw error
    throw new ApiError('聊天服务返回异常，请稍后再试。', 'response', response.status)
  }
  if (typeof result !== 'object' || result === null
    || !('code' in result) || typeof result.code !== 'number'
    || !('message' in result) || typeof result.message !== 'string') {
    throw new ApiError('聊天服务返回异常，请稍后再试。', 'response', response.status)
  }
  if (result.code !== 0) {
    throw new ApiError('聊天请求未成功，请稍后再试。', 'business', response.status, result.code)
  }
  if (!('data' in result) || typeof result.data !== 'object' || result.data === null
    || !('content' in result.data) || typeof result.data.content !== 'string') {
    throw new ApiError('聊天服务返回异常，请稍后再试。', 'response', response.status)
  }
  return { code: result.code, message: result.message, data: { content: result.data.content } }
}
