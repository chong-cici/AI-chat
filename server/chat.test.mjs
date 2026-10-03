import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createChatServer } from './chat.mjs'

async function start(t, generateReply) {
  const server = createChatServer(generateReply)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  return (body) => fetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  })
}

test('valid request returns trimmed Mock reply', async (t) => {
  const post = await start(t)
  const response = await post(JSON.stringify({ message: '  你好  ' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    code: 0, message: 'success', data: { content: 'Mock AI：收到你的消息「你好」。' },
  })
})

test('invalid requests return 400 before calling business logic', async (t) => {
  let calls = 0
  const post = await start(t, () => { calls++; return 'unexpected' })
  for (const body of ['{}', 'null', '{', ...[null, 1, false, [], {}, '', '  \n '].map(message => JSON.stringify({ message }))]) {
    const response = await post(body)
    assert.equal(response.status, 400)
    const result = await response.json()
    assert.equal(result.code, 10001)
    assert.equal(result.data, null)
  }
  assert.equal(calls, 0)
})

test('business failure returns safe 500 response', async (t) => {
  const post = await start(t, () => { throw new Error('PRIVATE_INTERNAL_STACK') })
  const response = await post(JSON.stringify({ message: '你好' }))
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    code: 10002, message: '聊天服务暂时不可用，请稍后再试。', data: null,
  })
})
