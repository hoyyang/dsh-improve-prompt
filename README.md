# dsh-improve-prompt

![banner](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/banner.jpg)

**输入框里那颗 ✦ 按钮，点一下把你的草稿改写成 Agent 真能照着做的提示词——直接替换，可撤回，而且保证不丢东西。**

[**English**](README.en.md) · [Releases](https://github.com/hoyyang/dsh-improve-prompt/releases) · [更新日志](CHANGELOG.md)

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="npm" src="https://img.shields.io/npm/v/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="downloads" src="https://img.shields.io/npm/dm/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://github.com/hoyyang/dsh-improve-prompt/releases"><img alt="release" src="https://img.shields.io/github/v/release/hoyyang/dsh-improve-prompt?color=38bdf8"></a>
  <img alt="dsh" src="https://img.shields.io/badge/dsh-%3E%3D0.1.1--rc.2-38bdf8">
  <a href="https://github.com/hoyyang/dsh-improve-prompt/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/hoyyang/dsh-improve-prompt/actions/workflows/ci.yml/badge.svg"></a>
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

![按钮四态实拍](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/button-states.png)

- **一键直替** — 点 ✦，1–3 秒后草稿被替换成更清晰、更贴 Agent 执行的版本。不弹预览、不打断你（对齐 WorkBuddy 的形态）。
- **一键撤回** — 替换后输入框上方出现状态条，8 秒内点「撤回」恢复原文；你一旦手动编辑，状态条自动消失，绝不覆盖你的新输入。
- **保真闸（这插件真正的差异）** — 机械提取草稿里的**硬事实**：文件路径、文件名、标识符、数字与版本、URL、`反引号`代码、@引用。逐条校验是否出现在改写结果里。缺一个 → 一次**点名修复**调用（把这些字符串原样列给模型）→ 仍缺 → **确定性回灌**，正文末尾追加「保留原始细节」块。**生态里其他同类插件都只在 system prompt 里写一句"请保留原文信息"，没有一家去验证。**
- **长度闸** — 结果超预算（标准档 2.5x，**且不低于 200 字符绝对下限**）→ 一次带明确字符预算的收敛调用 → 仍超 → **不写回**、保留原文并说明原因。堵住"一句话需求变成三十行规格书"这个第二大坑。
- **质量凭证** — 状态条直接告诉你结果可不可信：`已增强 · 保真 5/5 · 1.0x · 2.2s`。
- **两档位** — **轻**（去废话、消歧义，≤1.2x，对齐 WorkBuddy "省 token" 定位）/ **标准**（结构化重述，≤2.5x）。档位记忆在本地。
- **斜杠命令也能用** — `/bugfix ISS-202607-00090605A 用户反馈填充后密码框被清空…`：命令前缀**原样保留**，只把命令后面的正文改写成更清晰的版本。只有斜杠命令、后面还没写正文时按钮才禁用（此时也真的无可改写）。
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



## 按钮视觉与交互（v5.1）

![四种状态 × 明暗主题（真实 CSS + 真实 DOM 渲染）](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/button-states.png)

**设计原则：先是精确的形状，然后才是光；而且光源全部收在药丸内部。**

前两版都栽在同一个错误上——把"炫酷"理解成"更多光"：一版只有发丝描边、没有材质；一版加了一整层宽幅光晕，实测把整行输入区糊住（28px 控件上大面积发光 = 雾）。

第三版起换了参照系：**同工具栏里做得对的插件是 dsh-plan-board**。拿它当尺子量出硬差距，然后**只借工艺、不借配色**——

| 从参照中学到的工艺 | 我原来的问题 | 现在 |
|---|---|---|
| 底板**恒为深色玻璃**，不随主题反白 | 浅色主题下白底 + 青色图标 + 青色描边 = 一片青，看着费劲 | 深海军蓝玻璃（`#061024→#0c2144`），两个主题同一块板，白字在上 |
| 描边用**宽度无关**的画法 | 112° 线性渐变在 66px 宽的按钮上只走到前 1/4（紫、洋红根本没出现——这条是对着参照实测出来的） | `conic-gradient` 环绕，任何宽度都完整呈现本方案的青→电蓝→金 |
| **内含 aurora**，而不是外发光 | 光跑到药丸外面 → 糊行 | 四个径向光池 `inset:0`，被 `overflow:hidden` 关在药丸里 |
| 图标**有颜色** | 苍白小星 | 星芒 SVG 自带青→金渐变填充（底板恒深，固定亮渐变是安全的） |

**配色是自己的**：青（`#22d3ee`）→ 电光蓝（`#2b6cff`）→ 金（`#f5c542`），与插件 banner 同源；**明确不用**参照插件的紫/洋红（有一条测试断言守住这件事）。

为了让玻璃"像玻璃"，还补了三个材质细节：**顶部镜面高光带**、**下缘被暖金打亮**、**光池之间保留暗底**。最后一条是拿生成的美术基准图对照出来的——光池太大太饱和时，芯片会读成"蓝色果冻"而不是玻璃。

| 状态 | 表现 |
|---|---|
| **闲置** | 深色玻璃芯片 + 完整渐变描边 + 图标处一枚青色光池 |
| **悬停** | 上浮 1.5px、放大 1.04、描边提亮、光池增亮、外沿窄光晕变强 |
| **点按** | 回落到 `scale(.94)`、亮度回收、描边光加速 |
| **进行中** | 描边光成跑环 + 图标自转 + 光池呼吸 |
| **禁用 / 焦点** | 去饱和 + 压暗、描边熄灭；`focus-visible` 保留键盘焦点环 |
| **降低动效** | `prefers-reduced-motion` 下所有动画停止，**只停动效、不动清晰度** |

### 硬性约束：文字必须始终清晰可读（像素实测）

1. **没有任何光源在文字底下**：图标火花只占图标位（与文字盒留 9px 净空）；旋转描边用 `mask-composite` 只占 1px 边框带；药丸 `overflow:hidden`，内含光层出不去。
2. **底板永不半透明**：所以对比度在**两个主题、所有状态**下都成立，不需要"亮态才切实色"的特例。
3. **实测**——对比度由 **3x 截图的像素**算出（底板是渐变，计算色值回答不了它）：

| 状态 | 暗色主题 | 浅色主题 |
|---|---|---|
| 闲置 | 11.07:1 | 11.07:1 |
| 悬停 | 9.89:1 | 15.28:1 |
| 点按 | 8.77:1 | 14.53:1 |
| 进行中 | 9.13:1 | 15.43:1 |

最差 **8.77:1**（WCAG AA 正文要求 ≥4.5:1）。禁用态同样受测：WCAG 豁免非活性控件，本插件的约束不豁免。

### 美术自检方法（可复现）

1. `npm run harness:button` 生成对照页：**我的按钮 | dsh-plan-board 真实按钮**（其 CSS 与 DOM 从源码逐字提取），并排、同背景、同缩放；
2. 用 image-prompt 风格库（`product-commerce-visual`）写材质基准提示词，dsh-image-gen 生成一张**本方案配色**的玻璃芯片特写，作为"工艺应该到什么程度"的尺子；
3. 三方对照后逐条补工艺（顶部镜面 / 下缘金光 / 光池收紧 / 保暗底），再复测像素对比度。

这套流程当场抓出两个问题：**线性渐变在窄按钮上只显示前 1/4**、**光池过大导致读成蓝色果冻**。

## 典型场景

1. **口语化需求一次说清** —— 「帮我看看能不能把那个登录接口改得快一点，就是感觉有点慢」→ 去掉口水词，保留你的判断（"感觉有点慢"），不替你决定优化手段。
2. **带路径与标识符的改动请求** —— 保真闸价值最大的场景。草稿里的文件路径、函数名、版本号、URL、反引号代码在改写后逐字保留，不会被同义替换吃掉。
3. **英文长句去废话** —— 轻档把 "I was kind of wondering if you could maybe..." 压成一句可执行的英文请求。
4. **续写式草稿** —— 上一轮刚讨论完某个接口，本轮只写「把那个接口加上限流」；智能上下文把最近几轮带上，改写结果能接上刚才的方案。
5. **点错了 / 结果不满意** —— 8 秒内点「撤回」恢复原文；你一旦手动编辑过，撤回条自动消失，绝不覆盖你的新输入。
6. **空泛草稿** —— 「加个功能」这类输入不会被硬编成一份虚构需求书：模型被纪律层要求"宁可不改也不编"，你看到的是原样返回。

## 你会看到什么

- **质量凭证** —— 状态条：`已增强 · 保真 5/5 · 1.0x · 2.2s`
- **撤回入口** —— 同一条上的「撤回」按钮，8 秒自动消失
- **回灌提示** —— 只剩确定性兜底时才出现：`已增强 · 保真 5/5 · 1.4x · 3.1s · 已回灌 src/a.ts`
- **原文保留块** —— 回灌时正文末尾追加 `保留原始细节 / Preserved original details:` 加逐条硬事实
- **失败提示（原文不动）** —— 「增强超时（60000ms），原文未改动」/「未找到可用模型：请先在设置里选默认模型」/「增强结果超出长度上限（…），已保留原文」
- **档位标签** —— 按钮上直接显示当前档位（轻 / 标准），**⌄** 一键切换

## 真实实测对照

以下四组都是本机对真实模型跑出来的结果，不是构造的演示。

**① 中文 + 硬事实（标准档）**

```text
输入：就是那个 帮我把 src/host/config.ts 里的 maxRatioFor 改成 2.5 呗，顺便看看 https://example.com/a?b=1 那个文档，用 `pnpm build` 验证一下
输出：把 `src/host/config.ts` 里的 `maxRatioFor` 改成 `2.5`，同时看一下 https://example.com/a?b=1 这个文档，然后用 `pnpm build` 验证一下。
凭证：保真 5/5 · 1.0x · 2.2s
```

要点：路径、标识符、版本号、URL、反引号代码逐字保留；只删掉"就是那个""呗"这类噪声。

**② 英文口语（轻档）**

```text
输入：I was kind of wondering if you could maybe take a look at the login flow and see if there is any way we could possibly make it a bit faster, it feels slow to me
输出：Take a look at the login flow and see if there's any way we can make it faster — it feels slow to me.
凭证：0.6x
```

**③ 空泛输入（标准档）—— 不硬编**

```text
输入：加个功能
输出：加个功能
凭证：1.0x
```

要点：模型被要求"信息不足时不要发明需求"，原样返回是正确行为。

**④ 不确定处显式标注（标准档）**

```text
输入：把那个接口加上限流
输出：给那个接口加上限流。

- 目标接口：(TBD: 具体是哪个接口/路由)
- 限流规则（阈值与时间窗口）：(TBD: 例如每秒/每分钟允许多少次)
- 超限后的行为：(TBD: 例如返回 429 还是拒绝/排队)
- 除新增限流外，原有逻辑保持不变。
```

要点：**结构补上了，事实一个没编。** 信息缺口用 `(TBD: …)` 显式留给你，而不是猜一个填进去。

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
   ├─ 本地守卫（空 / 只有斜杠命令没正文 / 超长）──────► 拒绝，零模型流量
   ├─ 斜杠命令前缀切分（/bugfix 正文 → 前缀原样保留，只改写正文）
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

发布前跑过的验证，逐条都是实跑结果：

1. **88 个单测全绿** —— 纯函数（硬事实抽取 / 保真校验 / 长度判定 / 上下文判定 / 输出规范化 / 会话历史 / 斜杠命令切分）＋ 用 stub 模型驱动的**完整编排**（修复轮、回灌、拒绝、超时、取消、上游异常、注入防护）＋ **加载真实 client bundle** 的界面行为（注册契约 / 禁用态 / 点击回填 / 失败不动草稿 / 撤回 / 档位记忆 / 本地化与回退）。
2. **host / client 双 TypeScript 严格检查**通过（`npm run typecheck` 与 `typecheck:client`）。
3. **冷启动三故障静态检测全绿**：link 依赖 junction、bundle manifest、disabled 状态矛盾；外加 `dsh --dump-config` 组合复检无错误。
4. **卸载即净实测**：路由注销、junction 删除、profile 清单零残留、loader entry 与 client 模块表清理。
5. **重装幂等实测**：二次注入返回「已激活运行，跳过注入」，不产生重复条目。
6. **反向安装验收**：在隔离 staging home 里分别用 `dsh plugin add dsh-improve-prompt`（npm）与 `dsh plugin add github:hoyyang/dsh-improve-prompt` 各装一次，产物完整、配置组合正确。
7. **真实模型端到端**：含路径 + 标识符 + 版本号 + URL + 反引号代码的草稿 → 保真 `5/5`、`1.0x`（见上方实测对照①）。
8. **轻档去废话实测**：英文口语长句 → `0.6x`（对照②）；空泛输入 → 原样返回（对照③）。
9. **智能上下文实测**：同一句「把那个接口加上限流」带 sessionId 时报 `contextUsed: anaphora` 并真的引用了会话内容；不带 sessionId 时报 `none` 并改用 TBD 标注。
10. **实机修掉一个真实设计缺陷**：9 字草稿按 2.5x 只允许 22 字，被长度闸误杀——正是最需要增强的那类输入。改为 `max(200, 字数 × 比例)`，并补 4 个测试锁死语义。

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
npm test               # 88 个单测
npm run typecheck && npm run typecheck:client
```

## 许可证

[MIT](LICENSE)