# dsh-improve-prompt

![banner](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/banner.jpg)

**输入框里那颗 ✦ 按钮，点一下把你的草稿改写成 Agent 真能照着做的提示词——直接替换，可撤回，而且保证不丢东西。**

[**English**](README.en.md) · [Releases](https://github.com/hoyyang/dsh-improve-prompt/releases) · [更新日志](CHANGELOG.md)

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="npm" src="https://img.shields.io/npm/v/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="downloads" src="https://img.shields.io/npm/dm/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://github.com/hoyyang/dsh-improve-prompt/releases"><img alt="release" src="https://img.shields.io/github/v/release/hoyyang/dsh-improve-prompt?color=38bdf8"></a>
  <img alt="dsh" src="https://img.shields.io/badge/dsh-%3E%3D0.1.1--rc.2-38bdf8">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green"></a>
  <a href="https://github.com/hoyyang/dsh-improve-prompt/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/hoyyang/dsh-improve-prompt?color=f5c542"></a>
</p>

## 安装

```sh
dsh plugin --profile web add dsh-improve-prompt
# 或直接从 GitHub 装（构建产物已随仓库提交，无需本地构建）
dsh plugin --profile web add github:hoyyang/dsh-improve-prompt
```

重启 `dsh web`，输入框工具行（发送键左侧）出现 **✦** 即成功。**零配置**：不需要 API Key，走 harness 自带的模型服务与凭据存储。最低 `dsh >= 0.1.1-rc.2`（实测 `0.1.5-rc.1`）。

```sh
dsh plugin --profile web remove dsh-improve-prompt   # 卸载
```

## 有啥用

![组件样式实测渲染](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/components.png)

- **一键直替** — 点 ✦，1–3 秒后草稿被替换成更清晰、更贴 Agent 执行的版本。不弹预览、不打断你（对齐 WorkBuddy 的形态）。
- **一键撤回** — 替换后输入框上方出现状态条，8 秒内点「撤回」恢复原文；你一旦手动编辑，状态条自动消失，绝不覆盖你的新输入。
- **保真闸（这插件真正的差异）** — 机械提取草稿里的**硬事实**：文件路径、文件名、标识符、数字与版本、URL、`反引号`代码、@引用。逐条校验是否出现在改写结果里。缺一个 → 一次**点名修复**调用（把这些字符串原样列给模型）→ 仍缺 → **确定性回灌**，正文末尾追加「保留原始细节」块。**生态里其他同类插件都只在 system prompt 里写一句"请保留原文信息"，没有一家去验证。**
- **长度闸** — 结果超预算（标准档 2.5x，**且不低于 200 字符绝对下限**）→ 一次带明确字符预算的收敛调用 → 仍超 → **不写回**、保留原文并说明原因。堵住"一句话需求变成三十行规格书"这个第二大坑。
- **质量凭证** — 状态条直接告诉你结果可不可信：`已增强 · 保真 5/5 · 1.0x · 2.2s`。
- **两档位** — **轻**（去废话、消歧义，≤1.2x，对齐 WorkBuddy "省 token" 定位）/ **标准**（结构化重述，≤2.5x）。档位记忆在本地。
- **可取消** — 增强中再点一次 ✦，真正中断上游请求（`AbortSignal`）。
- **失败即原文** — 无模型 / 超时 / 空输出 / 网络失败，**绝不动你的输入**，只给一句可读提示。
- **智能会话上下文** — 只有当草稿自己站不住时才带历史（出现「它 / 那个 / 上面 / 刚才 / 继续 / it / this」等指代，或 ≤12 字的无实词短句）。判定是本地正则，零额外调用。带的只有**你打的字 + 助手正文的结论尾部**（每轮 600 字符）——工具结果、插件注入上下文、图片、推理过程、项目源码一律不带。

### 和已有 5 个同类插件差在哪

不做预览对比面板、不做语音识别、不做自更新、不做多阶段 LLM 流水线、不做模型链 / 看门狗、不做记忆链、不扫项目源码、不做澄清提问闭环。**只做一件事：点一下，拿到更好的提示词，并且确信它没改坏你的意思。**

**每次点击最多 2 次 LLM 调用**（一次生成 + 一次修复），不是流水线。

## 30 秒上手

1. 在输入框写草稿 —— 一句话、口语化、有错别字都行：
   > 就是那个 帮我把 src/host/config.ts 里的 maxRatioFor 改成 2.5 呗，用 `pnpm build` 验证一下
2. 点 **✦**（想先改档位就点它右边的 **⌄**）
3. 等 1–3 秒，草稿被替换：
   > 把 `src/host/config.ts` 里的 `maxRatioFor` 改成 `2.5`；用 `pnpm build` 验证一下。
4. 看状态条：`已增强 · 保真 5/5 · 1.0x · 2.2s`
5. 不满意 → 「撤回」（8 秒内）

## 进阶用法

### 配置

全部可选，写在 profile 的 `cordis.patch.yml`：

```yaml
- insert:
    - id: dsh-improve-prompt
      name: 'dsh-improve-prompt'
      config:
        defaultMode: standard      # light | standard
        lightMaxRatio: 1.2         # 轻档长度上限
        standardMaxRatio: 2.5      # 标准档长度上限
        acceptanceCriteria: false  # 标准档追加"可验证验收条款"
        temperature: 0.3
        maxTokens: 2000
        timeoutMs: 60000
        maxInputChars: 20000
        contextTurns: 3            # 会话上下文轮数；0 = 关闭
        contextChars: 6000
        smartContext: true         # 智能判定是否带上下文
        fidelityGate: true         # 保真闸
        lengthGate: true           # 长度闸
        provider: ''               # 与 model 成对填写则覆盖会话模型
        model: ''
        reasoningEffort: ''        # 留空 = 不发送该参数（网关兼容性最好）
        logFailures: true
```

**模型路由**：显式 `provider` + `model` → `agentDefaultModel` 当前选择 → 最近一次真实模型调用的路由。三者皆无 → 明确报错，不动草稿。

### 改提示词不用改代码

行为知识全在 `prompts/*.md`：`discipline.md`（全局纪律）+ `light.md` / `standard.md`（档位模板）。覆盖方式：把同名文件放到 `$DSH_HOME/dsh-improve-prompt/prompts/`。

### 本地 HTTP 接口

`GET /dsh-improve-prompt/api/config` 读当前档位与上限；`POST /dsh-improve-prompt/api/improve`（body `{text, sessionId?, mode?}`）执行增强。仅回环。

## 工作原理

```
composer 草稿
   │
   ├─ 本地守卫（空 / 斜杠命令 / 超长）────────────────► 拒绝，零模型流量
   │
   ├─ 智能上下文判定（本地正则）──命中──► 读会话最近 N 轮（仅人话 + 助手正文）
   │
   ├─ 保真闸：抽取硬事实（本地，零调用）
   │
   ├─ 第 1 次 LLM 调用（system = prompts/discipline.md + prompts/<mode>.md）
   │
   ├─ 两道闸同时判定
   │     ├─ 有缺失 或 超预算 ──► 第 2 次调用（两条抱怨一次说清）
   │     └─ 都过 ─────────────► 直接产出
   │
   ├─ 仍缺硬事实 ──► 确定性回灌「保留原始细节」块（保证零丢失）
   │
   └─ 最终长度判定（回灌优先于上限）──► 写回 or 拒绝并说明
```

宿主半是一个回环路由 + 编排器，浏览器半只在 `conversation.input.right` 注册一个按钮、在 `conversation.input.dock` 注册一个状态条。**运行时依赖为 0**（`@deepseek-ai/dsh-llm` 只作类型导入，构建后擦除）。

## 可靠性与验收

- **71 个单测全绿**：纯函数（硬事实抽取 / 保真校验 / 长度判定 / 上下文判定 / 输出规范化 / 会话历史），用 stub 模型驱动的**完整编排**（含修复轮、回灌、拒绝、超时、取消、上游异常、注入防护），以及**加载真实 client bundle** 的界面行为（注册契约 / 禁用态 / 点击回填 / 失败不动草稿 / 撤回 / 档位记忆 / 本地化与回退）。
- **host / client 双 TypeScript 严格检查**通过。
- **冷启动三故障静态检测全绿**（link 依赖 junction / bundle manifest / disabled 状态矛盾）+ `dsh --dump-config` 组合复检无错误。
- **卸载即净实测**：路由注销、junction 删除、profile 清单零残留、loader entry 与 client 模块表清理；重复安装幂等。
- **真实模型端到端实测**：含路径 + 标识符 + 版本号 + URL + 反引号代码的草稿 → 保真 `5/5`、`1.0x`；英文口语草稿轻档 → `0.6x`；空泛输入（「加个功能」）原样返回，不硬编需求。
- **实机修掉一个真实设计缺陷**：9 字草稿「把那个接口加上限流」按 2.5x 只允许 22 字，被长度闸误杀——正是最需要增强的那类输入。改为 `max(200, 字数 × 比例)` 并补测试锁死语义。

## 常见问题

**增强后没变化？** 草稿已经很精确时，纪律层要求"只做轻量清理"，不改内容是正确的输出。

**状态条显示「已回灌 xxx」？** 模型两次都没保住某个硬事实，插件确定性把它补回正文末尾。内容零丢失，代价是格式上多了一小块。

**为什么短草稿会变长好几倍？** 长度闸对短草稿用的是 200 字符绝对预算而非比例——否则它最需要的三行结构会被拒掉。

**带了会话上下文吗？** 状态条显示 `已参考会话` 就是带了。默认只在草稿含指代或过短时才带；`contextTurns: 0` 可完全关闭。

**用的是哪个模型？** 跟随你当前会话的默认模型；想固定成更便宜的模型，填 `provider` + `model`。

## 本地构建

```sh
pnpm install
npm run build          # host: tsc → lib/
npm run build:client   # client: tsdown → lib/client.js（window.__ModuleLoader__ 格式）
npm test               # 71 个单测
npm run typecheck && npm run typecheck:client
```

## 许可证

[MIT](LICENSE)
