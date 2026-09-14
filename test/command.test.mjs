import test from 'node:test'
import assert from 'node:assert/strict'
import { splitCommand } from '../lib/command.js'

test('a plain draft has no command and the whole text as its body', () => {
  assert.deepEqual(splitCommand('把登录接口改快一点'), { prefix: '', command: '', body: '把登录接口改快一点' })
})

test('a command with a body splits into prefix and body', () => {
  const split = splitCommand('/bugfix ISS-202607-00090605A 用户反馈填充后密码框被清空')
  assert.equal(split.command, '/bugfix')
  assert.equal(split.body, 'ISS-202607-00090605A 用户反馈填充后密码框被清空')
  assert.equal(split.prefix + split.body, '/bugfix ISS-202607-00090605A 用户反馈填充后密码框被清空')
})

test('a command alone has an empty body — nothing to enhance', () => {
  assert.deepEqual(splitCommand('/bugfix'), { prefix: '/bugfix', command: '/bugfix', body: '' })
  assert.equal(splitCommand('/bugfix   ').body, '')
  assert.equal(splitCommand('/').body, '')
  assert.equal(splitCommand('  /help  ').body, '')
})

test('the separator between command and body is preserved verbatim', () => {
  assert.equal(splitCommand('/bugfix\n描述内容').prefix, '/bugfix\n')
  assert.equal(splitCommand('/bugfix\n描述内容').body, '描述内容')
  assert.equal(splitCommand('/bugfix\t描述').prefix, '/bugfix\t')
  assert.equal(splitCommand('/bugfix描述').prefix, '/bugfix ')   // glued: insert one space
})

test('a slash in the middle of prose is not a command', () => {
  const split = splitCommand('看看 src/a/b.ts 里的写法')
  assert.equal(split.command, '')
  assert.equal(split.body, '看看 src/a/b.ts 里的写法')
})

test('hyphens and underscores are valid command names', () => {
  assert.equal(splitCommand('/deep-review-fix 帮我看看').command, '/deep-review-fix')
  assert.equal(splitCommand('/human_fix 描述').command, '/human_fix')
})

test('empty input is safe', () => {
  assert.deepEqual(splitCommand(''), { prefix: '', command: '', body: '' })
  assert.deepEqual(splitCommand(undefined), { prefix: '', command: '', body: '' })
})
