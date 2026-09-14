/**
 * Button visual harness — build a standalone page from the REAL bundle.
 *
 * The CSS comes out of the built client bundle (the same string the plugin injects
 * into the live page) and the markup comes from rendering the actual component, so
 * what this page shows is what the composer renders — no re-typed copy of either.
 *
 * `busy` and `disabled` are produced by flipping the exact attributes the component
 * emits in those states (data-busy / data-on / disabled), because the store phase
 * lives behind the module boundary.
 *
 * Usage: node scripts/button-harness.mjs [outfile]
 */
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

/** The zh copy, so the label is the string users actually see. */
const ZH = {
  modeLight: '轻',
  modeStandard: '标准',
  buttonAria: '把草稿改写为更清晰、更贴 Agent 执行的提示词',
  buttonTitle: '一键增强提示词（直接替换，可撤回）',
  buttonTitleBusy: '正在增强…点击取消',
  buttonTitleCommand: '一键增强提示词（保留斜杠命令前缀，只改写正文）',
  commandOnlyTitle: '斜杠命令后还没有正文，无可改写内容',
  modeSwitchTitle: '切换档位',
  modeLightHint: '轻档：只去废话、消歧义，几乎不改结构',
  modeStandardHint: '标准档：结构化重述，让 Agent 能直接执行',
}

let captured = null
const styles = []
globalThis.window = {
  __ModuleLoader__: { load: (m) => { captured = m } },
  localStorage: { getItem: () => null, setItem: () => {} },
  setTimeout,
  clearTimeout,
}
globalThis.document = {
  querySelectorAll: () => [],
  createElement: () => {
    const el = { dataset: {}, remove() {}, _t: '' }
    Object.defineProperty(el, 'textContent', { get() { return el._t }, set(v) { el._t = v; styles.push(v) } })
    return el
  },
  head: { appendChild: () => {} },
}

await import(join(root, 'lib/client.js') + '?h=' + String(Date.now()))
const mod = captured.factory((id) => {
  if (id === 'react') return React
  if (id === 'react/jsx-runtime') return require('react/jsx-runtime')
  if (id === 'react-dom') return require('react-dom')
  if (id === 'react-dom/client') return require('react-dom/client')
  throw new Error('unexpected external ' + id)
})

const registered = []
mod.apply({
  slots: {
    inject: (_seat, fn) => { const it = fn(); if (it !== undefined && typeof it.next === 'function') it.next(); return () => {} },
    register: (options, component) => { registered.push({ options, component }); return () => {} },
  },
  locale: { register: () => () => {}, bind: () => (key) => ZH[key] ?? key },
  effect: (fn) => fn(),
  get: () => undefined,
})

const Button = registered[0].component
const draft = '把那个登录接口改快一点，就是感觉有点慢'
const markup = renderToStaticMarkup(React.createElement(Button, {
  sessionId: 's1',
  useInput: (selector) => selector({ draft, phase: 'plain' }),
  inputActions: { setDraft() {} },
  t: (key) => ZH[key] ?? key,
}))
const busy = markup.replace(/data-busy="false"/g, 'data-busy="true"').replace(/data-on="false"/g, 'data-on="true"')
const disabled = markup.replace('<button type="button" class="dip-btn"', '<button type="button" disabled class="dip-btn"')

// DSH theme tokens, copied from the live app's dark and light palettes.
const THEMES = {
  dark: {
    '--dsw-alias-border-l2': '#333a48', '--dsw-alias-border-l3': '#4a5468',
    '--dsw-alias-label-secondary': '#a8b0c0', '--dsw-alias-label-primary': '#e8edf7',
    '--dsw-alias-label-dimmed': '#6b7484', '--dsw-alias-interactive-bg-hover': '#232833',
    '--dsw-alias-bg-base': '#161a22', '--dsw-alias-bg-elevated': '#1c212b',
    page: '#0f1115',
  },
  light: {
    '--dsw-alias-border-l2': '#d8dce4', '--dsw-alias-border-l3': '#b9c0cc',
    '--dsw-alias-label-secondary': '#4a5261', '--dsw-alias-label-primary': '#14171d',
    '--dsw-alias-label-dimmed': '#98a0ae', '--dsw-alias-interactive-bg-hover': '#eceef2',
    '--dsw-alias-bg-base': '#ffffff', '--dsw-alias-bg-elevated': '#f6f7f9',
    page: '#ffffff',
  },
}

/**
 * The hard constraint, as a machine check that runs in the page.
 *
 * 1. **No geometry overlap** — no FX element's box may intersect the label's box, and
 *    the label must stay inside the pill's padding box, so the 1px rotating border
 *    band can never reach it either.
 * 2. **WCAG contrast** — the label's colour against the effective backdrop (the first
 *    opaque background walking up from the pill), as a ratio.
 *
 * Both are computed from the real cascade, not from a description of it. Results land
 * on window.__DIP_REPORT__ and in a <pre> so a screenshot-only review can be replaced
 * by reading numbers.
 */
const SELF_CHECK = [
  '<pre id="dip-report" style="color:#8b93a3;font:11px ui-monospace,monospace;padding:12px 30px 30px;white-space:pre-wrap"></pre>',
  '<script>',
  'window.__DIP_CHECK__ = function () {',
  '  const lum = (c) => { const f = [c.r, c.g, c.b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] }',
  '  const parse = (s) => {',
  '    const m = /rgba?\\(([^)]+)\\)/.exec(s || "")',
  '    if (m) { const p = m[1].split(/[ ,\\/]+/).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 } }',
  '    const h = /^#([0-9a-f]{6})$/i.exec((s || "").trim())',
  '    if (h) { const n = parseInt(h[1], 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 } }',
  '    return null',
  '  }',
  '  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 })',
  '  const backdropOf = (el) => { let node = el; let acc = null; while (node) { const c = parse(getComputedStyle(node).backgroundColor); if (c && c.a > 0) acc = acc === null ? c : over(acc, c); if (acc !== null && acc.a >= 0.999) return acc; node = node.parentElement } return acc || { r: 255, g: 255, b: 255, a: 1 } }',
  '  const ratio = (a, b) => { const l1 = lum(a); const l2 = lum(b); const hi = Math.max(l1, l2); const lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05) }',
  '  const intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom',
  '  const report = []',
  '  document.querySelectorAll(".cell").forEach((cell) => {',
  '    const label = cell.querySelector(".dip-label")',
  '    const pill = cell.querySelector(".dip-btn")',
  '    const lb = label.getBoundingClientRect()',
  '    const pb = pill.getBoundingClientRect()',
  '    const cs = getComputedStyle(label)',
  '    const rawFg = parse(cs.color)',
  '    const bg = backdropOf(pill)',
  '    // Group opacity on an ancestor composites the glyphs themselves, so it must be',
  '    // folded into the effective foreground: otherwise a disabled 0.82 opacity would',
  '    // be ignored and the reported ratio would be optimistic.',
  '    let groupOpacity = 1',
  '    for (let node = label; node && node !== cell; node = node.parentElement) {',
  '      const o = parseFloat(getComputedStyle(node).opacity)',
  '      if (!isNaN(o)) groupOpacity *= o',
  '    }',
  '    const fg = rawFg === null ? null : { r: rawFg.r, g: rawFg.g, b: rawFg.b, a: rawFg.a * groupOpacity }',
  '    const effectiveFg = fg === null ? null : over(fg, bg)',
  '    // The halo is a rect the size of the pill, but only its perimeter is opaque, so',
  '    // the meaningful check is not "boxes do not intersect" -- it is that a VISIBLE',
  '    // effect layer implies an OPAQUE plate between it and the glyphs. The spark is a',
  '    // filled sprite, so for it the box check is the right one.',
  '    const halo = cell.querySelector(".dip-halo")',
  '    const haloAlpha = halo ? parseFloat(getComputedStyle(halo).opacity) : 0',
  '    const haloVisible = haloAlpha > 0.01',
  '    const ownBg = parse(getComputedStyle(pill).backgroundColor)',
  '    const plateOpaque = ownBg !== null && ownBg.a >= 0.999',
  '    const spark = cell.querySelector(".dip-spark")',
  '    const sparkClash = spark !== null && intersects(spark.getBoundingClientRect(), lb)',
  '    const pad = parseFloat(getComputedStyle(pill).paddingLeft) || 0',
  '    report.push({',
  '      state: cell.dataset.state, theme: cell.dataset.theme,',
  '      contrast: Math.round(ratio(effectiveFg || { r: 0, g: 0, b: 0 }, bg) * 100) / 100,',
  '      groupOpacity: Math.round(groupOpacity * 100) / 100,',
  '      rawColor: cs.color, rawBackdrop: "rgb(" + Math.round(bg.r) + ", " + Math.round(bg.g) + ", " + Math.round(bg.b) + ")",',
  '      haloVisible, plateOpaque, sparkClash,',
  '      insidePaddingBox: lb.left >= pb.left + pad - 0.5 && lb.right <= pb.right - pad + 0.5,',
  '      labelText: label.textContent, fontSize: cs.fontSize, fontWeight: cs.fontWeight,',
  '    })',
  '  })',
  '  const worst = report.reduce((m, r) => (r.contrast < m ? r.contrast : m), Infinity)',
  '  const bad = report.filter((r) => r.sparkClash || !r.insidePaddingBox || r.contrast < 4.5 || (r.haloVisible && !r.plateOpaque))',
  '  window.__DIP_REPORT__ = { report, worst, pass: bad.length === 0 }',
  '  document.getElementById("dip-report").textContent =',
  '    "worst contrast " + worst.toFixed(2) + ":1   " + (bad.length === 0 ? "PASS" : "FAIL " + JSON.stringify(bad)) + "\\n" +',
  '    report.map((r) => "  " + r.theme + "/" + r.state + "  " + r.contrast.toFixed(2) + ":1  plate=" + (r.plateOpaque ? "opaque" : "clear") + "  halo=" + (r.haloVisible ? "on" : "off") + "  sparkClash=" + r.sparkClash + "  inside=" + r.insidePaddingBox).join("\\n")',
  '  return { report, worst, pass: bad.length === 0 }',
  '}; window.__DIP_CHECK__()',
  '<\/script>',
].join('\n')

/** One state cell: a composer-ish strip with the button where it really sits. */
function cell(stateName, html, themeName) {
  return [
    '<section class="cell" data-theme="' + themeName + '" data-state="' + stateName + '" id="cell-' + themeName + '-' + stateName + '">',
    '  <div class="row">',
    '    <span class="ghost">模型</span>',
    '    <span class="seatwrap">' + html + '</span>',
    '    <span class="send">发送</span>',
    '  </div>',
    '  <div class="cap">' + themeName + ' / ' + stateName + '</div>',
    '</section>',
  ].join('\n')
}

const themeVars = (name) => Object.entries(THEMES[name])
  .filter(([k]) => k !== 'page')
  .map(([k, v]) => k + ':' + v)
  .join(';')

const html = [
  '<!doctype html><html><head><meta charset="utf-8"><title>dsh-improve-prompt button harness</title>',
  '<style>',
  'body{margin:0;background:#0f1115;font-family:-apple-system,"PingFang SC",Inter,sans-serif}',
  '.cell{padding:26px 30px 22px}',
  '.cell[data-theme="light"]{background:#ffffff}',
  '.row{display:flex;align-items:center;gap:10px}',
  '.ghost{font-size:12px;color:#6b7484}',
  '.send{height:28px;padding:0 14px;border-radius:24px;background:#2b6cff;color:#fff;font-size:12px;display:inline-flex;align-items:center}',
  '.seatwrap{display:inline-flex}',
  '.cap{margin-top:10px;font-size:11px;letter-spacing:.04em;color:#7b8496}',
  '.cell[data-theme="dark"]{', themeVars('dark'), '}',
  '.cell[data-theme="light"]{', themeVars('light'), '}',
  styles.join('\n'),
  '</style></head><body>',
  ['idle', 'busy', 'disabled'].map((s) => {
    const m = s === 'idle' ? markup : s === 'busy' ? busy : disabled
    return cell(s, m, 'dark')
  }).join('\n'),
  ['idle', 'busy', 'disabled'].map((s) => {
    const m = s === 'idle' ? markup : s === 'busy' ? busy : disabled
    return cell(s, m, 'light')
  }).join('\n'),
  SELF_CHECK,
  '</body></html>',
].join('\n')

const out = process.argv[2] ?? '/tmp/dip-button-harness.html'
writeFileSync(out, html)
console.log('harness written:', out)
console.log('css chars:', styles.join('\n').length)
console.log('states: idle / busy / disabled x dark / light')