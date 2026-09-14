import test from 'node:test'
import assert from 'node:assert/strict'
import { extractAnchors, anchorSurvives, normalizeForMatch, stripWhitespace } from '../lib/anchors.js'

const kinds = (draft) => extractAnchors(draft).map((a) => a.kind)
const texts = (draft) => extractAnchors(draft).map((a) => a.text)

test('extracts file paths, identifiers, versions, urls and code', () => {
  const draft = '把 src/host/config.ts 里的 maxRatioFor 改成 2.5，参考 https://example.com/a?b=1，用 `pnpm build` 跑'
  const found = texts(draft)
  assert.ok(found.includes('src/host/config.ts'), 'path')
  assert.ok(found.includes('maxRatioFor'), 'camelCase identifier')
  assert.ok(found.includes('2.5'), 'version-ish number')
  assert.ok(found.some((t) => t.startsWith('https://example.com')), 'url')
  assert.ok(found.includes('pnpm build'), 'backticked code')
})

test('a path inside backticks is claimed once, as code', () => {
  const found = extractAnchors('看 `/Users/hoy/a/b.md` 这个文件')
  const path = found.filter((a) => a.text.includes('/Users/hoy/a/b.md'))
  assert.equal(path.length, 1)
  assert.equal(path[0].kind, 'code')
})

test('snake_case, SCREAMING_SNAKE and dotted paths are identifiers', () => {
  const found = texts('改 max_input_chars 与 MAX_TOKENS，还有 config.defaultMode')
  assert.ok(found.includes('max_input_chars'))
  assert.ok(found.includes('MAX_TOKENS'))
  assert.ok(found.includes('config.defaultMode'))
})

test('fenced code blocks do not leak their inner prose as anchors', () => {
  const draft = '示例：\n```\nSome Prose Here\n```\n就这样'
  const found = texts(draft)
  assert.ok(!found.includes('Some Prose Here'))
})

test('plain prose yields no anchors', () => {
  assert.deepEqual(extractAnchors('帮我把它做得更好看一点谢谢'), [])
})

test('empty and non-string drafts are safe', () => {
  assert.deepEqual(extractAnchors(''), [])
  assert.deepEqual(extractAnchors(undefined), [])
})

test('@references keep their @ marker', () => {
  const found = texts('按 @src/index.ts 的写法来')
  assert.ok(found.some((t) => t === '@src/index.ts'))
})

test('a fact split across a line break still matches', () => {
  const anchor = { text: 'src/a/b.ts', kind: 'path' }
  const enhanced = '编辑 src/a/\nb.ts 文件'
  assert.equal(anchorSurvives(anchor, normalizeForMatch(enhanced), enhanced, stripWhitespace(enhanced)), true)
})

test('case matters for identifiers', () => {
  const anchor = { text: 'maxRatioFor', kind: 'identifier' }
  assert.equal(anchorSurvives(anchor, normalizeForMatch('maxratiofor'), 'maxratiofor'), false)
})
