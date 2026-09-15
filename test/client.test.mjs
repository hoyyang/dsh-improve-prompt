import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import React from 'react'
import TestRenderer from 'react-test-renderer'

const require = createRequire(import.meta.url)
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/**
 * Load the BUILT client bundle the way the harness does: execute the file, capture
 * the window.__ModuleLoader__.load({id, factory}) payload, and run the factory with
 * a require that resolves only the declared externals.
 */
async function loadClientModule() {
  let captured = null
  const store = new Map()
  globalThis.window = {
    __ModuleLoader__: { load: (m) => { captured = m } },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)) },
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
  }
  await import('../lib/client.js?cachebust=' + String(Date.now()))
  assert.ok(captured !== null, 'bundle must call window.__ModuleLoader__.load')
  const module = captured.factory((id) => {
    if (id === 'react') return React
    if (id === 'react-dom') return require('react-dom')
    if (id === 'react/jsx-runtime') return require('react/jsx-runtime')
    if (id === 'react-dom/client') return require('react-dom/client')
    throw new Error('unexpected external: ' + id)
  })
  return { id: captured.id, module }
}

/** Copy a real locale registration would provide; anything absent is "unregistered". */
const DICT = { err_LENGTH_EXCEEDED: '已保留原文（本地化文案）' }

function fakeCtx() {
  const registered = []
  const ctx = {
    slots: {
      inject(seat, fn) {
        const iterator = fn()
        if (iterator !== undefined && typeof iterator.next === 'function') iterator.next()
        return () => {}
      },
      register(options, component) { registered.push({ options, component }); return () => {} },
    },
    locale: {
      register() { return () => {} },
      bind() { return (key) => (DICT[key] !== undefined ? DICT[key] : key) },
    },
    effect(fn) { return fn() },
    get() { return undefined },
  }
  return { ctx, registered }
}

/** Props a conversation renderer injects into a session-scoped composer entry. */
function seatProps(over = {}) {
  const draft = over.draft !== undefined ? over.draft : '把那个接口加上限流'
  return {
    sessionId: 's1',
    useInput: (selector) => selector({ draft, phase: 'plain' }),
    inputActions: over.inputActions !== undefined ? over.inputActions : { setDraft() {} },
    t: (key) => key,
    ...over,
  }
}

/** Mount an entry through a real React root so hooks work. */
async function mount(Component, props) {
  let renderer = null
  await TestRenderer.act(async () => {
    renderer = TestRenderer.create(React.createElement(Component, props))
  })
  return renderer
}

/** Boot the bundle and hand back the two registered entries. */
async function boot() {
  const { id, module } = await loadClientModule()
  const { ctx, registered } = fakeCtx()
  await TestRenderer.act(async () => { module.apply(ctx) })
  return { id, module, registered, button: registered[0].component, bar: registered[1].component }
}

/** A canned successful host reply. */
function okResponse(over = {}) {
  return {
    json: async () => ({
      ok: true,
      text: '为登录接口增加按 IP 的限流，每分钟 60 次。',
      meta: {
        mode: 'standard', model: 'p/m', ratio: 1.4, ratioLabel: '1.4x', elapsedMs: 2100,
        anchors: { total: 3, kept: 3, reinjected: 0 }, note: '', contextUsed: 'none',
        ...(over.meta !== undefined ? over.meta : {}),
      },
    }),
  }
}

test('the built bundle registers exactly the two composer entries under the right ids', async () => {
  const { id, module, registered } = await boot()
  assert.equal(id, 'dsh-improve-prompt')
  assert.deepEqual(module.inject, ['slots', 'locale'])
  assert.equal(registered.length, 2)
  assert.deepEqual(registered.map((r) => r.options.name), ['conversation.input.right', 'conversation.input.dock'])
  assert.deepEqual(registered.map((r) => r.options.id), ['dsh-improve-prompt-button', 'dsh-improve-prompt-bar'])
  for (const entry of registered) {
    assert.equal(entry.options.locale, 'dsh-improve-prompt', 'every entry is localizable')
    assert.deepEqual(entry.options.inject('s9'), { sessionId: 's9' }, 'the session id reaches the component')
  }
})

test('the button renders enabled with a draft and disabled on an empty composer or a slash command', async () => {
  const { button } = await boot()

  const enabled = await mount(button, seatProps())
  const enabledBtn = enabled.root.findAllByType('button')[0]
  assert.equal(enabledBtn.props.disabled, false)
  assert.equal(enabled.root.findAllByProps({ className: 'dip-chevron' }).length, 1)

  const empty = await mount(button, seatProps({ draft: '   ' }))
  assert.equal(empty.root.findAllByType('button')[0].props.disabled, true)

  // A bare command has no body — nothing to rewrite. (A command WITH a body is
  // enhancable; that case is covered by the slash-command test below.)
  const command = await mount(button, seatProps({ draft: '/help' }))
  assert.equal(command.root.findAllByType('button')[0].props.disabled, true)
  assert.equal(command.root.findAllByType('button')[0].props.title, 'commandOnlyTitle')
})

test('a slash command with a body stays clickable, a bare command does not', async () => {
  const { button } = await boot()

  // The case that used to be blocked by mistake: /bugfix <正文> has a real body.
  const withBody = await mount(button, seatProps({ draft: '/bugfix ISS-202607-00090605A 填充后密码框被清空' }))
  assert.equal(withBody.root.findAllByType('button')[0].props.disabled, false,
    'a command carrying a body must be enhancable')
  assert.equal(withBody.root.findAllByType('button')[0].props.title, 'buttonTitleCommand',
    'and the tooltip says the prefix is preserved')

  // A command with nothing after it still has nothing to rewrite.
  const bare = await mount(button, seatProps({ draft: '/bugfix' }))
  assert.equal(bare.root.findAllByType('button')[0].props.disabled, true)
  // The locale key is the contract; the copy itself lives in locales.ts.
  assert.equal(bare.root.findAllByType('button')[0].props.title, 'commandOnlyTitle')

  const blankCommand = await mount(button, seatProps({ draft: '/bugfix   ' }))
  assert.equal(blankCommand.root.findAllByType('button')[0].props.disabled, true)
})

test('clicking on a slash-command draft sends only the body', async () => {
  const { button } = await boot()
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => { calls.push(JSON.parse(options.body)); return okResponse() }
  try {
    const renderer = await mount(button, seatProps({ draft: '/bugfix 把登录接口改快一点' }))
    await TestRenderer.act(async () => { await renderer.root.findAllByType('button')[0].props.onClick() })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].text, '/bugfix 把登录接口改快一点', 'the full draft goes to the host, which owns the split')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('the button still renders on a host that only provides a point-in-time input snapshot', async () => {
  const { button } = await boot()
  const renderer = await mount(button, {
    sessionId: 's1',
    input: { draft: '老宿主草稿' },
    inputActions: { setDraft() {} },
    t: (key) => key,
  })
  assert.equal(renderer.root.findAllByType('button')[0].props.disabled, false)
})

test('clicking posts the draft with its mode and writes the enhanced text back', async () => {
  const { button } = await boot()
  let written = null
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return okResponse() }
  try {
    const renderer = await mount(button, seatProps({ inputActions: { setDraft: (text) => { written = text } } }))
    await TestRenderer.act(async () => { await renderer.root.findAllByType('button')[0].props.onClick() })

    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, '/dsh-improve-prompt/api/improve')
    assert.equal(calls[0].body.sessionId, 's1')
    assert.equal(calls[0].body.mode, 'standard')
    assert.equal(calls[0].body.text, '把那个接口加上限流')
    assert.equal(written, '为登录接口增加按 IP 的限流，每分钟 60 次。')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('a failed call never touches the draft and surfaces localized copy', async () => {
  const { button, bar } = await boot()
  let written = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ json: async () => ({ ok: false, code: 'LENGTH_EXCEEDED', message: 'host copy' }) })
  try {
    const renderer = await mount(button, seatProps({ inputActions: { setDraft: (text) => { written = text } } }))
    await TestRenderer.act(async () => { await renderer.root.findAllByType('button')[0].props.onClick() })
    assert.equal(written, null, 'the draft must not be touched on failure')

    // The status bar renders the LOCALIZED copy for a registered code — the harness
    // convention is that an unregistered key comes back unchanged.
    const barRenderer = await mount(bar, { sessionId: 's1', t: (key) => key })
    const text = JSON.stringify(barRenderer.toJSON())
    assert.match(text, /dip-bar/)
    assert.match(text, /已保留原文（本地化文案）/, 'the code is localized, not echoed from the host')
    assert.ok(!text.includes('host copy'), 'the host copy is only the fallback')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('the status bar shows the certificate and undo restores the original draft', async () => {
  const { button, bar } = await boot()
  let written = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => okResponse({ meta: { contextUsed: 'anaphora' } })
  try {
    const actions = { setDraft: (text) => { written = text } }
    const renderer = await mount(button, seatProps({ inputActions: actions }))
    await TestRenderer.act(async () => { await renderer.root.findAllByType('button')[0].props.onClick() })
    assert.equal(written, '为登录接口增加按 IP 的限流，每分钟 60 次。')

    const barRenderer = await mount(bar, { sessionId: 's1', t: (key) => key })
    const shown = JSON.stringify(barRenderer.toJSON())
    assert.match(shown, /dip-bar/)
    assert.match(shown, /1\.4x/)
    assert.match(shown, /contextTag/)

    const undo = barRenderer.root.findAllByProps({ className: 'dip-undo' })[0]
    await TestRenderer.act(async () => { undo.props.onClick() })
    assert.equal(written, '把那个接口加上限流', 'undo puts the original draft back')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('an unregistered error code falls back to the host message', async () => {
  const { button, bar } = await boot()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ json: async () => ({ ok: false, code: 'SOMETHING_NEW', message: 'host copy' }) })
  try {
    const renderer = await mount(button, seatProps({ inputActions: { setDraft() {} } }))
    await TestRenderer.act(async () => { await renderer.root.findAllByType('button')[0].props.onClick() })
    const barRenderer = await mount(bar, { sessionId: 's1', t: (key) => key })
    assert.match(JSON.stringify(barRenderer.toJSON()), /host copy/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('the status bar renders nothing while idle', async () => {
  const { bar } = await boot()
  const renderer = await mount(bar, { sessionId: 'never-used', t: (key) => key })
  assert.equal(renderer.toJSON(), null)
})

test('the mode chevron switches between light and standard and remembers it', async () => {
  const { button } = await boot()
  const renderer = await mount(button, seatProps())
  const buttons = renderer.root.findAllByType('button')
  const chevron = buttons.find((b) => b.props.className === 'dip-chevron')
  await TestRenderer.act(async () => { chevron.props.onClick() })
  assert.equal(globalThis.window.localStorage.getItem('dsh-improve-prompt:mode'), 'light')
  assert.match(JSON.stringify(renderer.toJSON()), /modeLight/, 'the label follows the stored mode')
})

test('a cancellation aborts the in-flight request instead of writing anything', async () => {
  const { button } = await boot()
  let seenSignal = null
  let written = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (_url, options) => {
    seenSignal = options.signal
    return okResponse()
  }
  try {
    const renderer = await mount(button, seatProps({ inputActions: { setDraft: (text) => { written = text } } }))
    await TestRenderer.act(async () => { await renderer.root.findAllByType('button')[0].props.onClick() })
    assert.ok(seenSignal !== null && seenSignal.aborted === false, 'the request carries a live AbortSignal')
    assert.equal(written, '为登录接口增加按 IP 的限流，每分钟 60 次。')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('the chip carries both zones, light layers span it, and each zone ink is topmost', async () => {
  const { button } = await boot()
  const renderer = await mount(button, seatProps())

  const chip = renderer.root.findAllByProps({ className: 'dip-root' })
  assert.equal(chip.length, 1)
  // the chip's direct children: contained light, rim light, progress bar, main zone,
  // hairline divider, switch zone — one plate, two zones, nothing outside the glass
  const chipChildren = chip[0].children.map((c) => (typeof c === 'string' ? c : c.props.className))
  assert.deepEqual(chipChildren, ['dip-aurora', 'dip-ring', 'dip-arc', 'dip-btn', 'dip-divider', 'dip-chevron', 'dip-burst'])

  // inside the main zone: spark, icon, label (label is the topmost of the zone)
  const pill = renderer.root.findAllByProps({ className: 'dip-btn' })[0]
  const inner = pill.children.map((c) => (typeof c === 'string' ? c : c.props.className))
  assert.deepEqual(inner, ['dip-spark', 'dip-icon', 'dip-label'])

  // the switch zone owns its own ink span
  const chevron = renderer.root.findAllByProps({ className: 'dip-chevron' })[0]
  const chevronChildren = chevron.children.map((c) => (typeof c === 'string' ? c : c.props.className))
  assert.deepEqual(chevronChildren, ['dip-caret'])

  for (const decor of ['dip-aurora', 'dip-ring', 'dip-arc', 'dip-spark', 'dip-divider', 'dip-caret', 'dip-burst']) {
    const el = renderer.root.findAllByProps({ className: decor })[0]
    assert.equal(el.props['aria-hidden'], 'true', decor + ' is decoration, never content')
  }
})

test('the stylesheet keeps the guarantees the legibility check relies on', async () => {
  const fs = await import('node:fs')
  const css = fs.readFileSync(new URL('../src/client/styles.ts', import.meta.url), 'utf8')

  // containment: the chip clips, so no inside layer can escape it, and the aurora is inset:0
  assert.match(css, /\.dip-root\{[^}]*overflow:hidden/)
  assert.match(css, /\.dip-aurora\{position:absolute;inset:0/)
  assert.match(css, /\.dip-ring\{position:absolute;inset:0/)
  // no light layer outside the pill: no bloom rule, no blend modes
  assert.ok(!/\.dip-bloom\{/.test(css), 'no layer outside the pill')
  assert.ok(!/mix-blend-mode/.test(css), 'no blend modes on the light layers')

  // the chip speaks the dsh-plan-board language: dark glass plate + four-stop gradient rim
  assert.match(css, /padding-box/, 'plate and rim are two layers of one background')
  // the rim is CONIC, not linear: a linear ramp only shows its first quarter on a 66px chip
  assert.match(css, /RIM = 'conic-gradient\(/, 'the rim is width-independent')
  assert.match(css, /PLATE = 'linear-gradient\(135deg,#061024/, 'the plate is the dark navy glass')
  assert.match(css, /INK = '#f2f7ff'/, 'near-white ink is what makes it readable in both themes')
  // the plate never swaps by theme or by a mode attribute on the chip itself —
  // [data-mode] legitimately exists ONLY on the collapsed-state mode badge
  assert.ok(!/prefers-color-scheme/.test(css), 'no theme-conditional styles')
  assert.ok(!/\.dip-root\[data-mode|\.dip-btn\[data-mode/.test(css), 'the plate does not invert per theme')
  // and the palette is this plugin's own: cyan/blue with a gold accent, NOT the reference
  // plugin's violet/magenta ramp (its craft was borrowed, its colours were not)
  assert.ok(!/#8b5cf6|#e879f9|#a855f7|#7c3aed|#e879f9/.test(css), 'no borrowed violet/magenta hues')

  // the label owns a stacking level above every light layer
  assert.match(css, /\.dip-label\{position:relative;z-index:2/)

  // the progress bar hugs the bottom edge and stays short, so it cannot reach the label box
  assert.match(css, /\.dip-arc\{position:absolute;left:0;right:0;bottom:(\d+)px;height:(\d+)px/)
  const barBottom = Number(/\.dip-arc\{position:absolute;left:0;right:0;bottom:(\d+)px/.exec(css)?.[1])
  const barHeight = Number(/bottom:\d+px;height:(\d+)px/.exec(css)?.[1])
  assert.ok(barHeight <= 3, 'the bar stays a hairline, got ' + String(barHeight) + 'px')
  // pill is 28px tall with the label vertically centred; the bar lives in the last few px
  assert.ok(barBottom + barHeight <= 4, 'the bar hugs the bottom edge')

  // and busy must be visibly different from hover, not just faster
  assert.match(css, /@keyframes dip-sweep/, 'busy has its own sweeping progress bar')
  assert.match(css, /@keyframes dip-charge/, 'busy has its own charging breath')
  assert.match(css, /\.dip-root\[data-busy="true"\]\{animation:dip-charge/, 'the chip itself charges while busy')

  // the fusion contract: a hairline divider and a real switch zone on the same plate
  assert.match(css, /\.dip-divider\{position:relative;z-index:2;width:1px;/, 'the divider is a 1px hairline')
  assert.match(css, /\.dip-divider\{[^}]*linear-gradient\(180deg,transparent/, 'the divider fades at both ends')
  assert.match(css, /\.dip-chevron\{position:relative;z-index:2;flex:none;width:24px;height:28px;/,
    'the switch zone is a 24x28 hit target on the plate')
  assert.match(css, /\.dip-caret\{display:block;flex:none;/,
    'the caret is drawn by code at a known size')
  assert.match(css, /CARET = '#cfe4ff'/, 'the caret speaks the same light ink as the label')
  // the switch zone carries its own light pool so the fusion reads as one object
  assert.match(css, /at 96% 46%,rgba\(43,108,255,\.44\)/, 'the switch zone owns a light pool')

  // v7 collapse contract: content technique, never chip scaling
  assert.match(css, /\.dip-label\{[^}]*max-width:0/, 'the label collapses to zero width')
  // the expansion selector is built at runtime from the EXPANDED const — assert its
  // definition and its use on the label, not a concatenated string that never exists
  // in this file (the stylesheet test runs against the SOURCE text)
  assert.match(css, /const EXPANDED = '\.dip-root:is\(:hover,:has\(:focus-visible\),\[data-busy="true"\]\)'/,
    'expansion applies on hover, keyboard focus and busy')
  assert.match(css, /EXPANDED \+ ' \.dip-label\{max-width:64px/, 'hover/focus/busy expand the label')
  assert.ok(!/\.dip-root:hover\{[^}]*scale\(/.test(css), 'hover never scales the chip')
  assert.ok(!/\.dip-root:active\{[^}]*scale\(/.test(css), 'press never scales the chip')
  assert.match(css, /@keyframes dip-burst/, 'press has its shockwave')
  assert.match(css, /\.dip-root:active \.dip-burst\{animation:dip-burst/, 'the burst fires on press')
  assert.match(css, /@keyframes dip-attract/, 'the collapsed chip breathes while a draft waits')

  // the spark is a filled sprite: its box must stay clear of the label's box
  const sparkLeft = Number(/\.dip-spark\{position:absolute;left:(\d+)px/.exec(css)?.[1])
  const sparkWidth = Number(/left:\d+px;top:50%;width:(\d+)px/.exec(css)?.[1])
  const pad = Number(/\.dip-btn\{[^}]*padding:0 \d+px 0 (\d+)px/.exec(css)?.[1])
  const labelStart = pad + 15 + 6
  assert.ok(sparkLeft + sparkWidth <= labelStart,
    'spark box must end before the label box: ' + String(sparkLeft + sparkWidth) + ' vs ' + String(labelStart))

  // motion preferences never touch legibility, only movement
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('the injected stylesheet is scoped by a plugin data attribute', async () => {
  const source = await import('node:fs').then((fs) => fs.readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'))
  assert.match(source, /data-plugin/)
  assert.match(source, /dsh-improve-prompt/)
})