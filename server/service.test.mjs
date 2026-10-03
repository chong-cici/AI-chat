import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/services/chat.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } })
const { sendChatMessage, ApiError } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('Service handles success, HTTP, business, network and malformed responses', async (t) => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async (_, options) => {
    assert.deepEqual(JSON.parse(options.body), { message: '你好' })
    return Response.json({ code: 0, message: 'success', data: { content: '回复' } })
  }
  assert.equal((await sendChatMessage({ message: '你好' })).data.content, '回复')
  for (const status of [400, 500]) {
    globalThis.fetch = async () => new Response('proxy error', { status })
    await assert.rejects(sendChatMessage({ message: '你好' }), error => error instanceof ApiError && error.kind === 'http' && error.status === status)
  }
  globalThis.fetch = async () => Response.json({ code: 10001, message: 'failed', data: null })
  await assert.rejects(sendChatMessage({ message: '你好' }), error => error.kind === 'business' && error.code === 10001 && error.status === 200)
  globalThis.fetch = async () => { throw new TypeError('fetch failed') }
  await assert.rejects(sendChatMessage({ message: '你好' }), error => error.kind === 'network')
  for (const response of [Response.json(null), Response.json({ code: 0, message: 'ok', data: null }), new Response('{')]) {
    globalThis.fetch = async () => response
    await assert.rejects(sendChatMessage({ message: '你好' }), error => error.kind === 'response')
  }
})

test('Service forwards signal and preserves cancellation during fetch and body reading', async (t) => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  for (const bodyStage of [false, true]) {
    const controller = new AbortController()
    const abortError = new DOMException('Cancelled', 'AbortError')
    globalThis.fetch = async (_, options) => {
      assert.equal(options.signal, controller.signal)
      const cancel = () => { controller.abort(); throw abortError }
      if (!bodyStage) return cancel()
      return { ok: true, status: 200, json: async () => cancel() }
    }
    await assert.rejects(sendChatMessage({ message: '你好' }, { signal: controller.signal }), error => error === abortError)
  }
})
