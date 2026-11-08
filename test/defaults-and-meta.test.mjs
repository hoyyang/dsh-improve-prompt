import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveConfig } from '../lib/config.js'
import { improveDraft } from '../lib/orchestrate.js'

// 2026-09-24: reasoning-model defaults. GLM-5.3-flash at the agent's effort=max
// routinely outgrew the 60s timeout and burned the 2000-token budget on thinking
// before any answer text, so every click could end in "no result". The plugin now
// ships patient defaults and asks for its own shallow effort.

test('defaults are sized for reasoning models', () => {
  const cfg = resolveConfig({})
  assert.equal(cfg.timeoutMs, 180000)
  assert.equal(cfg.maxTokens, 8192)
  assert.equal(cfg.reasoningEffort, 'low')
})

test('an empty reasoningEffort falls back to low, an explicit one wins', () => {
  assert.equal(resolveConfig({ reasoningEffort: '' }).reasoningEffort, 'low')
  assert.equal(resolveConfig({ reasoningEffort: 'max' }).reasoningEffort, 'max')
})

test('the effort reaches the call and the certificate names the model once', async () => {
  const calls = []
  const llm = {
    stream(options) {
      calls.push(options)
      return (async function* () {
        yield { type: 'text-delta', index: 0, text: '修复这个 bug。' }
        yield { type: 'finish', reason: { kind: 'stop' } }
      })()
    },
  }
  const out = await improveDraft(
    { llm, selection: { provider: 'zhipuai', model: 'zhipuai/glm-5.3-flash' }, lastRoute: null },
    resolveConfig({}),
    { draft: '修一下登录白屏', sessionId: '', mode: 'standard', signal: new AbortController().signal },
  )
  assert.equal(out.ok, true)
  assert.equal(calls[0].reasoningEffort, 'low')
  // The agent's default selection carries the provider prefix already; the
  // certificate must not render it twice ("zhipuai/zhipuai/...").
  assert.equal(out.meta.model, 'zhipuai/glm-5.3-flash')
})

// 2026-11-09: a market install never gets peerDependencies. The DSH profile
// template pins pnpm to `autoInstallPeers: false`, so anything outside Node
// builtins and the plugin's own files is simply absent at boot — 0.7.2 shipped
// `import z from 'schemastery'` and every pnpm/market install failed to load
// with ERR_MODULE_NOT_FOUND while a repo link (with dev deps) hid the bug.
// This guards the packaged output, not the source: a dev-only node_modules
// cannot make it pass.
test('the published host half imports nothing but node builtins and local files', async () => {
  const { readdirSync, readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { join } = await import('node:path')
  const libDir = fileURLToPath(new URL('../lib/', import.meta.url))
  const offenders = []
  for (const file of readdirSync(libDir).filter((name) => name.endsWith('.js'))) {
    const text = readFileSync(join(libDir, file), 'utf8')
    for (const pattern of [/^\s*import\s[^\n]*?from\s+['"]([^'"]+)['"]/gm, /^\s*export\s[^\n]*?from\s+['"]([^'"]+)['"]/gm]) {
      for (const match of text.matchAll(pattern)) {
        const specifier = match[1]
        if (!specifier.startsWith('.') && !specifier.startsWith('node:')) offenders.push(`${file}: ${specifier}`)
      }
    }
  }
  assert.deepEqual(offenders, [], 'packaged host files must not import bare packages: ' + offenders.join(', '))
})
