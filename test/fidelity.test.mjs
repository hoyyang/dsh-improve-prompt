import test from 'node:test'
import assert from 'node:assert/strict'
import { extractAnchors } from '../lib/anchors.js'
import { checkFidelity, repairClause, reinjectionBlock, fidelityNote } from '../lib/fidelity.js'

test('reports every hard fact that survived', () => {
  const draft = '改 src/a.ts 的 maxRatioFor 到 2.5'
  const report = checkFidelity(extractAnchors(draft), '请修改 src/a.ts 中的 maxRatioFor，将其设为 2.5')
  assert.equal(report.total, report.kept)
  assert.deepEqual(report.missing, [])
})

test('names the exact facts that were dropped', () => {
  const draft = '改 src/a.ts 的 maxRatioFor 到 2.5'
  const report = checkFidelity(extractAnchors(draft), '请修改那个比例参数')
  assert.ok(report.missing.length >= 2)
  const dropped = report.missing.map((a) => a.text)
  assert.ok(dropped.includes('src/a.ts'))
  assert.ok(dropped.includes('maxRatioFor'))
})

test('repair clause lists each dropped string verbatim', () => {
  const clause = repairClause([{ text: 'src/a.ts', kind: 'path' }, { text: '2.5', kind: 'version' }])
  assert.match(clause, /- src\/a\.ts/)
  assert.match(clause, /- 2\.5/)
  assert.match(clause, /DROPPED/)
})

test('repair clause is empty when nothing is missing', () => {
  assert.equal(repairClause([]), '')
})

test('reinjection block is deterministic and labels itself', () => {
  const block = reinjectionBlock([{ text: 'src/a.ts', kind: 'path' }])
  assert.match(block, /保留原始细节/)
  assert.match(block, /- src\/a\.ts/)
  assert.equal(reinjectionBlock([]), '')
})

test('user-facing note truncates beyond five facts', () => {
  const many = Array.from({ length: 7 }, (_, i) => ({ text: 'p' + String(i), kind: 'path' }))
  const note = fidelityNote(many)
  assert.match(note, /等 7 处/)
  assert.equal(fidelityNote([{ text: 'a', kind: 'path' }]), 'a')
})
