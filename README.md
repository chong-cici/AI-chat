# AI Chat · README V0.2

记录 Day4–Day7 页面、Server API、Router 与请求生命周期的当前实现。

## 运行与验证

- 安装：`npm install`。
- 两个终端分别运行 `npm run server` 和 `npm run dev`。
- Server 监听 `127.0.0.1:3001`，Vite 开发代理将 `/api` 转发至 Server。
- `npm run typecheck` 检查类型；`npm run build` 检查类型并构建；`npm test` 运行 Server 与 Service 测试。
- Router 使用浏览器 history 模式，生产部署需将页面路径回退到 `index.html`，并单独配置 `/api` 转发；开发代理不包含在生产构建中。

## Router 与页面

```text
main.ts → App.vue → RouterView
/         → 重定向 /chat
/chat     → ChatPage → MessageList + ChatInput
/history  → HistoryPage（标题与空状态）
```

Vue Router 4 管理页面。聊天页提供历史会话入口，历史页提供返回聊天入口。没有历史数据、持久化或假会话。离开聊天页会卸载页面，返回时创建新的空会话。

## 状态边界

- `ChatPage`：`messages: ChatMessage[]`、`isSending`（Loading）、`errorMessage`、消息 ID 与当前请求的 AbortController。
- `MessageList`：仅通过 props 接收 messages 并渲染。
- `ChatInput`：局部 `inputValue`；通过事件传递已 trim 的文本，发送后清空。请求期间按钮禁用，仍可输入。
- 状态仅在聊天页面使用，未引入 Pinia 或跨页面 ChatStore。刷新或离开页面后消息清空。

## Chat 请求数据流

```text
ChatInput → emit sendMessage → ChatPage
→ trim + 空输入/重复发送防护
→ 清除上次错误、设置 Loading、追加 UserMessage
→ services/chat.ts：POST /api/chat + signal
→ Server：解析 JSON、运行时校验 message、生成 Mock AI
→ Service：检查 HTTP 状态、业务 code、响应数据
→ ChatPage：追加 AIMessage；失败保留 UserMessage 并显示提示
→ finally 恢复 Loading
```

`src/types/chat.ts` 定义 UserMessage、AIMessage、ChatMessage 与请求/响应类型。TypeScript 类型不替代运行时校验。

## HTTP、业务错误与校验

请求示例：`{ "message": "你好" }`。

成功返回 HTTP 200：`{ "code": 0, "message": "success", "data": { "content": "Mock AI：收到你的消息「你好」。" } }`。

Server 在调用 Mock AI 之前解析 JSON，并要求 message 存在、为 string 且 trim 后非空。无效 JSON 或参数返回 HTTP 400 + 业务 code 10001；内部异常返回 HTTP 500 + code 10002 和安全提示。当前未约定最大消息长度。

Service 主动检查 `response.ok`：HTTP 400/500 不依赖 fetch 自动 reject。`ApiError.kind` 区分 http、business、network、response；`status` 记录 HTTP 状态，`code` 记录成功 HTTP 响应中的非零业务 code，例如 10001 不会作为 HTTP Status。HTTP 失败优先按状态处理，不解析其业务体。网络失败和不合法响应使用本地可读提示，避免显示内部堆栈或代理错误正文。ChatPage 将 unknown error 收窄后转换为字符串提示。

## 请求取消

ChatPage 在发送时创建单个 AbortController，将 `signal` 通过 Service options 传给 fetch。页面 `onBeforeUnmount` 时 abort 未完成请求。Service 保留 fetch 和读取响应体阶段的取消异常；ChatPage 识别自己的 signal 已取消后，不追加回复、不显示服务器错误，finally 仍清理请求引用并恢复 Loading。同一时间仅允许一个请求，无 messageId → controller Map。

## 当前范围与后续方向

当前完成 Vue 3 + TypeScript 聊天页面、Router、HTTP Server、一次性 Mock AI 回复、错误处理、运行时参数校验与页面请求取消。

尚未实现真实 LLM、Streaming / SSE / ReadableStream、Auth、DB、RAG、Tool、历史会话存储，以及图片、文件、音频或语音输入。
