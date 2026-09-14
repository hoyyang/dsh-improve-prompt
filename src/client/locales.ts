/**
 * Client-side copy (zh / en) registered through the harness locale service.
 * Host errors carry stable codes; the codes are translated here so the message
 * matches the interface language rather than the host's.
 *
 * @module dsh-improve-prompt/client/locales
 */

/** Locale namespace. */
export const NS = 'dsh-improve-prompt'

export const zh: Record<string, string> = {
  buttonAria: '把草稿改写为更清晰、更贴 Agent 执行的提示词',
  buttonTitle: '一键增强提示词（直接替换，可撤回）',
  buttonTitleBusy: '正在增强…点击取消',
  buttonTitleCommand: '一键增强提示词（保留斜杠命令前缀，只改写正文）',
  commandOnlyTitle: '斜杠命令后还没有正文，无可改写内容',
  modeLight: '轻',
  modeStandard: '标准',
  modeSwitchTitle: '切换档位',
  modeLightHint: '轻档：只去废话、消歧义，几乎不改结构',
  modeStandardHint: '标准档：结构化重述，让 Agent 能直接执行',
  undo: '撤回',
  undoTitle: '恢复增强前的原文',
  done: '已增强',
  canceled: '已取消，原文未改动',
  fidelity: '保真',
  contextTag: '已参考会话',
  preserved: '已回灌',
  err_EMPTY: '输入框为空',
  err_COMMAND: '斜杠命令后没有可改写的正文',
  err_TOO_LONG: '草稿过长',
  err_BAD_BODY: '请求格式错误',
  err_NO_ROUTE: '未找到可用模型：请先在设置里选默认模型',
  err_TIMEOUT: '增强超时，原文未改动',
  err_ABORTED: '已取消，原文未改动',
  err_EMPTY_OUTPUT: '模型没有返回内容，原文未改动',
  err_TOOL_CALL: '模型返回了工具调用而非提示词，原文未改动',
  err_LENGTH_EXCEEDED: '增强结果超出长度上限，已保留原文（可切「轻」档或调高上限）',
  err_UPSTREAM: '模型调用失败，原文未改动',
  err_UNKNOWN: '增强失败，原文未改动',
}

export const en: Record<string, string> = {
  buttonAria: 'Rewrite the draft into a sharper, agent-ready prompt',
  buttonTitle: 'Improve prompt (replaces in place, undoable)',
  buttonTitleBusy: 'Improving… click to cancel',
  buttonTitleCommand: 'Improve prompt (keeps the slash-command prefix, rewrites only the body)',
  commandOnlyTitle: 'Nothing to rewrite yet — this is only a slash command',
  modeLight: 'Light',
  modeStandard: 'Standard',
  modeSwitchTitle: 'Switch mode',
  modeLightHint: 'Light: remove filler and ambiguity, keep the structure',
  modeStandardHint: 'Standard: restructure so an agent can execute it directly',
  undo: 'Undo',
  undoTitle: 'Restore the draft from before the enhancement',
  done: 'Improved',
  canceled: 'Cancelled — draft untouched',
  fidelity: 'fidelity',
  contextTag: 'context used',
  preserved: 're-appended',
  err_EMPTY: 'The composer is empty',
  err_COMMAND: 'A slash command with no body has nothing to rewrite',
  err_TOO_LONG: 'Draft is too long',
  err_BAD_BODY: 'Malformed request',
  err_NO_ROUTE: 'No model available — pick a default model in settings first',
  err_TIMEOUT: 'Enhancement timed out — draft untouched',
  err_ABORTED: 'Cancelled — draft untouched',
  err_EMPTY_OUTPUT: 'The model returned nothing — draft untouched',
  err_TOOL_CALL: 'The model returned a tool call instead of a prompt — draft untouched',
  err_LENGTH_EXCEEDED: 'Result exceeded the length ceiling — draft kept (try Light mode or raise the ceiling)',
  err_UPSTREAM: 'Model call failed — draft untouched',
  err_UNKNOWN: 'Enhancement failed — draft untouched',
}
