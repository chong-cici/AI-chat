import { createServer } from 'node:http'

function reply(response, status, code, message, data = null) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify({ code, message, data }))
}

// 可注入业务函数，方便验证异常分支；实际服务默认使用 Mock。
export function createChatServer(generateReply = (message) => `Mock AI：收到你的消息「${message}」。`) {
  return createServer(async (request, response) => {
    try {
      if (request.url !== '/api/chat' || request.method !== 'POST') {
        reply(response, 404, 10004, '接口不存在')
        return
      }

      let raw = ''
      request.setEncoding('utf8')
      for await (const chunk of request) raw += chunk
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        reply(response, 400, 10001, '请求体必须是有效的 JSON')
        return
      }

      if (typeof body?.message !== 'string' || !body.message.trim()) {
        reply(response, 400, 10001, 'message不能为空且必须是字符串')
        return
      }

      const content = await generateReply(body.message.trim())
      reply(response, 200, 0, 'success', { content })
    } catch (error) {
      console.error('Chat API error:', error)
      reply(response, 500, 10002, '聊天服务暂时不可用，请稍后再试。')
    }
  })
}
