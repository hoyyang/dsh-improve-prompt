import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveConfig } from '../lib/config.js'
import { callModel } from '../lib/llm-call.js'
import { improveDraft } from '../lib/orchestrate.js'

const CFG = resolveConfig({})

/** Scripted model: each entry is one streamed response; records every request. */
function stubLlm(script) {
  const calls = []
  return {
    calls,
    stream(options) {
      calls.push(options)
      const step = script.length > 0 ? script.shift() : {}
      return (async function* () {
        if (step.throw !== undefined) throw new Error(step.throw)
        if (step.text !== undefined && step.text !== '') yield { type: 'text-delta', index: 0, text: step.text }
        yield { type: 'finish', ...step.reason === undefined ? {} : { reason: step.reason } }
      })()
    },
  }
}

const request = (over = {}) => ({
  route: { provider: 'opencode-go', model: 'deepseek-v4.1-flash' },
  system: 'SYSTEM',
  userMessage: 'DRAFT',
  config: CFG,
  signal: new AbortController().signal,
  ...over,
})

const call = (over = {}) => ({
  draft: '把 src/a.ts 的 maxRatioFor 改成 2.5',
  sessionId: 's1',
  mode: 'standard',
  signal: new AbortController().signal,
  ...over,
})
const deps = (llm) => ({ llm, selection: { provider: 'opencode-go', model: 'deepseek-v4.1-flash' }, lastRoute: null })

// 2026-11-10: a provider that routes on a per-call session header. opencode-go
// answers every request without `x-opencode-session` with HTTP 400
// `MissingSessionID`; the harness forwards its `sessionId` call option as that
// header, and the agent loop always supplies one. The plugin's host-side
// one-shot call used to omit it, so the button worked on DeepSeek's own
// provider and failed on opencode-go with a misleading "the model returned
// nothing" — the adapter failure arrived as a terminal finish chunk whose
// reason was ignored. Both halves are covered below.

test('the call hands the session id to the provider', async () => {
  const llm = stubLlm([{ text: 'OK', reason: { kind: 'stop' } }])
  const out = await callModel(llm, request({ sessionId: 'session-abc' }))
  assert.equal(out.ok, true)
  assert.equal(llm.calls[0].sessionId, 'session-abc')
})

test('a caller without a session sends no session id', async () => {
  const llm = stubLlm([{ text: 'OK', reason: { kind: 'stop' } }])
  const out = await callModel(llm, request())
  assert.equal(out.ok, true)
  assert.equal('sessionId' in llm.calls[0], false)
})

test('a terminal adapter failure is UPSTREAM, never EMPTY', async () => {
  const llm = stubLlm([{
    reason: {
      kind: 'error',
      failure: { code: 'INVALID_REQUEST', message: 'Request is missing x-opencode-session and cannot be routed efficiently.' },
    },
  }])
  const out = await callModel(llm, request({ sessionId: 'session-abc' }))
  assert.equal(out.ok, false)
  assert.equal(out.failure.code, 'UPSTREAM')
  assert.match(out.failure.message, /x-opencode-session/)
})

test('a failure payload without a message still names the failure kind', async () => {
  const llm = stubLlm([{ reason: { kind: 'error', failure: {} } }])
  const out = await callModel(llm, request())
  assert.equal(out.ok, false)
  assert.equal(out.failure.code, 'UPSTREAM')
  assert.match(out.failure.message, /ended with error/)
})

test('the composer session id reaches every model call of one enhancement', async () => {
  const llm = stubLlm([
    { text: '请修改那个比例参数。', reason: { kind: 'stop' } },
    { text: '请把 src/a.ts 中的 maxRatioFor 改为 2.5。', reason: { kind: 'stop' } },
  ])
  const out = await improveDraft(deps(llm), CFG, call())
  assert.equal(out.ok, true)
  assert.equal(llm.calls.length, 2)
  assert.equal(llm.calls[0].sessionId, 's1')
  assert.equal(llm.calls[1].sessionId, 's1')
})

test('a loopback caller that omits sessionId still gets a routing id', async () => {
  const llm = stubLlm([{ text: '请把 src/a.ts 中的 maxRatioFor 改为 2.5。', reason: { kind: 'stop' } }])
  const out = await improveDraft(deps(llm), CFG, call({ sessionId: '' }))
  assert.equal(out.ok, true)
  assert.match(llm.calls[0].sessionId, /^dsh-improve-prompt-/)
})

test('a provider refusal reaches the response payload with the provider message', async () => {
  const llm = stubLlm([{
    reason: { kind: 'error', failure: { code: 'INVALID_REQUEST', message: 'Request is missing x-opencode-session and cannot be routed efficiently.' } },
  }])
  const out = await improveDraft(deps(llm), CFG, call())
  assert.equal(out.ok, false)
  assert.equal(out.code, 'UPSTREAM')
  assert.match(out.message, /x-opencode-session/)
})
