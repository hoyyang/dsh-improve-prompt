# dsh-improve-prompt

![banner](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/banner.jpg)

**The ✦ button in your composer rewrites the draft into a prompt an agent can actually act on — replaced in place, undoable, and guaranteed to lose nothing.**

[**简体中文**](README.md) · [Releases](https://github.com/hoyyang/dsh-improve-prompt/releases) · [Changelog](CHANGELOG.md)

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="npm" src="https://img.shields.io/npm/v/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="downloads" src="https://img.shields.io/npm/dm/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://github.com/hoyyang/dsh-improve-prompt/releases"><img alt="release" src="https://img.shields.io/github/v/release/hoyyang/dsh-improve-prompt?color=38bdf8"></a>
  <img alt="dsh" src="https://img.shields.io/badge/dsh-%3E%3D0.1.1--rc.2-38bdf8">
  <a href="https://github.com/hoyyang/dsh-improve-prompt/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/hoyyang/dsh-improve-prompt/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green"></a>
  <a href="https://github.com/hoyyang/dsh-improve-prompt/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/hoyyang/dsh-improve-prompt?color=f5c542"></a>
</p>

## Install

```sh
dsh plugin --profile web add dsh-improve-prompt
# or straight from GitHub (prebuilt lib/ is committed — no local build needed)
dsh plugin --profile web add github:hoyyang/dsh-improve-prompt
```

Restart `dsh web`; a **✦** appears in the composer tool row, left of the submit action. **Zero configuration** — no API key; it uses the harness's own model service and credential store. Requires `dsh >= 0.1.1-rc.2` (verified on `0.1.5-rc.1`).

```sh
dsh plugin --profile web remove dsh-improve-prompt   # uninstall
```

## What it does

![the button in four states](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/button-states.png)

- **One-click replace** — press ✦, and 1–3 seconds later the draft has become a sharper, agent-ready prompt. No preview dialog, no interruption (the WorkBuddy shape).
- **One-click undo** — a status bar appears above the composer; press Undo within 8 seconds to restore the original. The moment you edit by hand the bar disappears, so your new input is never overwritten.
- **Fidelity gate (the real difference)** — it mechanically extracts the draft's **hard facts**: file paths, file names, identifiers, numbers and versions, URLs, `backticked` code, @references. Each one is then verified to have literally survived the rewrite. A missing fact triggers one **repair call** naming those exact strings; if the model still drops it, a **deterministic re-append** adds a "Preserved original details" block. **Every other enhancer in the ecosystem just asks the model, in its system prompt, to "preserve the original details" — none of them checks.**
- **Length gate** — a rewrite over budget (2.5x in Standard, **never below a 200-character absolute floor**) gets one convergence call carrying an explicit character budget; if it is still over, nothing is written back and the reason is shown. This kills the runner-up failure mode: a one-line request returned as a thirty-line specification.
- **Quality certificate** — the status bar tells you whether to trust the result: `Improved · fidelity 5/5 · 1.0x · 2.2s`.
- **Two modes** — **Light** (de-filler and disambiguate, ≤1.2x — WorkBuddy's own "fewer tokens" positioning) / **Standard** (restructure, ≤2.5x). Remembered locally.
- **Slash commands work too** — with `/bugfix ISS-202607-00090605A 用户反馈填充后密码框被清空…` the command prefix is **kept verbatim** and only the text after it is rewritten. The button is disabled only when a command has no body yet, which is genuinely nothing to rewrite.
- **Cancellable** — press ✦ again while it runs to genuinely abort the upstream request (`AbortSignal`).
- **Failure keeps your draft** — no model, timeout, empty output, network error: your input is **never touched**, you just get one readable message.
- **Smart session context** — history is attached only when the draft cannot stand alone (an anaphoric marker like it / this / the same way, or a ≤12-character draft with no concrete fact). The decision is a local regex, zero extra calls. What travels: **your own words + the tail of the assistant's prose** (600 characters per turn). Tool results, plugin-injected context, images, reasoning, and project source never do.

### How it differs from the five existing enhancers

No preview-and-compare panel, no voice input, no self-updater, no multi-stage LLM pipeline, no model chain or watchdog, no memory chain, no project-source scanning, no clarifying-question loop. **It does one thing: press once, get a better prompt, and know it did not break your meaning.**

**At most two model calls per click** (one generation + one repair). Never a pipeline.

## 30-second tour

1. Type a draft — one line, colloquial, typos and all:
   > 就是那个 帮我把 src/host/config.ts 里的 maxRatioFor 改成 2.5 呗，用 `pnpm build` 验证一下
2. Press **✦** (press the **⌄** beside it first to switch mode)
3. Wait 1–3 seconds; the draft becomes:
   > 把 `src/host/config.ts` 里的 `maxRatioFor` 改成 `2.5`；用 `pnpm build` 验证一下。
4. Read the certificate: `已增强 · 保真 5/5 · 1.0x · 2.2s`
5. Not happy? **Undo** (within 8 seconds)



## Button design and interaction

![four states × both themes, rendered from the real CSS and the real DOM](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/button-states.png)

The button uses layered light: two sprites (a four-point star and a thin ring) were prompted through the image-prompt style library (`brand-identity-package` / `ui-screenshot-system`) and rendered by dsh-image-gen (gpt-image-2) with prompts that **forbid any text**. The label is always drawn by code.

| State | Treatment |
|---|---|
| **Idle** | Ghost pill plus a soft breathing star at the icon — quiet next to its neighbours |
| **Hover** | Opaque plate, a **rotating cyan-to-gold gradient border**, the star scales and turns, the icon glows |
| **Press** | The whole control drops to `.955`, the border spins faster, the star contracts |
| **Busy** | An energy ring pulses around the pill while the border rotates, the star breathes and the icon spins |
| **Disabled / focus** | Star extinguished, border removed; `focus-visible` keeps a keyboard ring |
| **Reduced motion** | Every animation stops under `prefers-reduced-motion` — motion only, never legibility |

### The hard requirement: the label is always crisp

Not "it looks fine at 60% opacity" — **structural guarantees plus machine measurement**:

1. **Every glow lives outside the label's box.** The ring and the star are painted behind the pill's own background (`.dip-fx` inside `.dip-seat`, pill at `z-index:1`) and the label is the topmost element in that seat (`z-index:2`). The rotating border is masked to the 1px border band, so it cannot reach the padding box.
2. **A bright halo implies an opaque plate.** Whenever the ring is visible (busy), the pill switches to the theme's solid surface; idle keeps the ghost look precisely because its halo is off.
3. **Measured** — `node scripts/button-harness.mjs` builds a self-checking page that asserts, per state:

| State | Contrast | Plate | Halo | Star over text | Label inside padding box |
|---|---|---|---|---|---|
| dark idle | 8.67:1 | clear | off | no | yes |
| dark hover | 13.74:1 | **opaque** | off | no | yes |
| dark press | 13.74:1 | **opaque** | off | no | yes |
| dark busy | 13.74:1 | **opaque** | **on** | no | yes |
| dark disabled | 6.15:1 | clear | off | no | yes |
| light idle | 7.86:1 | clear | off | no | yes |
| light hover / press | 13.74:1 | **opaque** | off | no | yes |
| light busy | 16.74:1 | **opaque** | **on** | no | yes |
| light disabled | 4.90:1 | clear | off | no | yes |

Worst case **4.90:1** (WCAG AA wants ≥ 4.5:1 for body text) — every state passes. Disabled is measured too: WCAG exempts inactive controls, this plugin's requirement does not, so the disabled colour moved from `label-dimmed` to `label-secondary` with `opacity:.82` (it was 2.63:1 before).

The self-check computes the **effective foreground** — folding in group opacity up the ancestor chain, otherwise the disabled `.82` would be silently ignored and the reported ratio would be optimistic — then applies the WCAG relative-luminance formula, and asserts that the star's box never intersects the label's box, that the label stays inside the pill's padding box, and that a visible halo implies an opaque plate.

## Typical scenes

1. **A colloquial request, said clearly once** — "帮我看看能不能把那个登录接口改得快一点，就是感觉有点慢" loses the verbal filler but keeps your own judgement ("feels slow") and does not pick an optimisation technique for you.
2. **A request carrying paths and identifiers** — where the fidelity gate earns its keep. File paths, function names, version numbers, URLs and backticked code survive the rewrite verbatim instead of being paraphrased away.
3. **A wordy English sentence** — Light mode compresses "I was kind of wondering if you could maybe…" into one executable English request.
4. **A continuation draft** — you discussed an endpoint last turn and now type only "把那个接口加上限流". Smart context carries the recent turns, so the rewrite connects to the plan you already agreed on.
5. **A mis-click or a result you dislike** — press Undo within 8 seconds. The moment you edit by hand the bar disappears, so your new input is never overwritten.
6. **A vague draft** — something like "加个功能" is never padded into a fabricated spec: the discipline layer tells the model to leave it alone rather than invent, so you get it back unchanged.

## What you will see

- **Quality certificate** — the status bar: `已增强 · 保真 5/5 · 1.0x · 2.2s`
- **Undo affordance** — the 撤回 button on the same bar, gone after 8 seconds
- **Re-append notice** — only when the deterministic fallback fired: `已增强 · 保真 5/5 · 1.4x · 3.1s · 已回灌 src/a.ts`
- **Preserved-details block** — appended to the rewrite on re-append: `保留原始细节 / Preserved original details:` followed by the exact strings
- **Failure copy (draft untouched)** — "增强超时（60000ms），原文未改动" / "未找到可用模型：请先在设置里选默认模型" / "增强结果超出长度上限（…），已保留原文"
- **Mode label** — the button shows the active mode (轻 / 标准); **⌄** switches it

## Real measured examples

All four were produced on a real model on this machine — none of them is a constructed demo.

**① Chinese + hard facts (Standard)**

```text
in : 就是那个 帮我把 src/host/config.ts 里的 maxRatioFor 改成 2.5 呗，顺便看看 https://example.com/a?b=1 那个文档，用 `pnpm build` 验证一下
out: 把 `src/host/config.ts` 里的 `maxRatioFor` 改成 `2.5`，同时看一下 https://example.com/a?b=1 这个文档，然后用 `pnpm build` 验证一下。
certificate: fidelity 5/5 · 1.0x · 2.2s
```

The path, the identifier, the version, the URL and the backticked command all survive verbatim; only the noise ("就是那个", "呗") is gone.

**② Wordy English (Light)**

```text
in : I was kind of wondering if you could maybe take a look at the login flow and see if there is any way we could possibly make it a bit faster, it feels slow to me
out: Take a look at the login flow and see if there's any way we can make it faster — it feels slow to me.
certificate: 0.6x
```

**③ Vague input (Standard) — it refuses to invent**

```text
in : 加个功能
out: 加个功能
certificate: 1.0x
```

The model is told not to invent requirements when the draft carries none; returning it unchanged is the correct outcome.

**④ Explicit uncertainty (Standard)**

```text
in : 把那个接口加上限流
out: 给那个接口加上限流。

- 目标接口：(TBD: 具体是哪个接口/路由)
- 限流规则（阈值与时间窗口）：(TBD: 例如每秒/每分钟允许多少次)
- 超限后的行为：(TBD: 例如返回 429 还是拒绝/排队)
- 除新增限流外，原有逻辑保持不变。
```

**Structure added, zero facts invented.** Gaps are marked `(TBD: …)` for you to fill, instead of guessed at.

## Advanced

### Configuration

Everything is optional; set it in the profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-improve-prompt
      name: 'dsh-improve-prompt'
      config:
        defaultMode: standard      # light | standard
        lightMaxRatio: 1.2
        standardMaxRatio: 2.5
        acceptanceCriteria: false  # append a verifiable acceptance clause in Standard
        temperature: 0.3
        maxTokens: 2000
        timeoutMs: 60000
        maxInputChars: 20000
        contextTurns: 3            # 0 disables history
        contextChars: 6000
        smartContext: true
        fidelityGate: true
        lengthGate: true
        provider: ''               # set together with model to override the session model
        model: ''
        reasoningEffort: ''        # empty = do not send the parameter at all
        logFailures: true
```

**Model routing**: explicit `provider` + `model` → `agentDefaultModel`'s current selection → the last route seen on the live `llm/stream` waterfall. If none resolves, it fails loudly and the draft is untouched.

### Retune the prompts without touching code

All behaviour lives in `prompts/*.md`: `discipline.md` (the global discipline layer) plus `light.md` / `standard.md`. Override by dropping same-named files into `$DSH_HOME/dsh-improve-prompt/prompts/`.

### Local HTTP surface

`GET /dsh-improve-prompt/api/config` reports the active mode and ceilings; `POST /dsh-improve-prompt/api/improve` (body `{text, sessionId?, mode?}`) performs one enhancement. Loopback only.

## How it works

```
composer draft
   │
   ├─ local guards (empty / command-without-body / too long) ──► refuse, zero model traffic
   ├─ slash-command split (/bugfix body → prefix kept verbatim, only the body rewritten)
   │
   ├─ smart-context decision (local regex) ──hit──► read the last N turns (human + assistant prose only)
   │
   ├─ fidelity gate: extract hard facts (local, zero calls)
   │
   ├─ model call 1 (system = prompts/discipline.md + prompts/<mode>.md)
   │
   ├─ both gates judged together
   │     ├─ missing facts or over budget ──► call 2 (both complaints at once)
   │     └─ both clean ──────────────────► done
   │
   ├─ still missing a fact ──► deterministic re-append (guarantees zero loss)
   │
   └─ final length judgement (a re-appended fact outranks the ceiling) ──► write back or refuse
```

The host half is one loopback route plus the orchestrator; the browser half registers exactly two entries — a button on `conversation.input.right` and a status bar on `conversation.input.dock`. **Zero runtime dependencies** (`@deepseek-ai/dsh-llm` is a type-only import, erased at build).

## Reliability and verification

Everything below was actually run before publishing:

1. **88 tests, all green** — pure functions (hard-fact extraction / fidelity checking / length judgement / context trigger / output normalization / session history / slash-command splitting) plus **full orchestration against a stub model** (repair pass, re-append, refusal, timeout, cancellation, upstream failure, injection defence) plus the **built client bundle** (registration contract, disabled states, click-to-write-back, failure leaving the draft untouched, undo, mode memory, localization and fallback).
2. **Strict TypeScript checks** pass for both halves (`npm run typecheck` and `typecheck:client`).
3. **Cold-start three-failure static check green**: link-dependency junction, bundle manifest, disabled-state contradiction — plus a clean `dsh --dump-config` composition check.
4. **Uninstall verified clean**: route unregistered, junction removed, zero profile-manifest residue, loader entry and client module table cleared.
5. **Reinstall is idempotent**: a second inject reports "already active, skipping" and creates no duplicate entry.
6. **Reverse-install acceptance**: installed from both `dsh plugin add dsh-improve-prompt` (npm) and `dsh plugin add github:hoyyang/dsh-improve-prompt` inside an isolated staging home; artifacts complete, config composition correct.
7. **Live end-to-end against a real model**: a draft carrying a path, an identifier, a version, a URL and backticked code came back at fidelity `5/5`, `1.0x` (example ① above).
8. **Light mode measured**: a wordy English sentence came back at `0.6x` (example ②); a vague draft came back unchanged (example ③).
9. **Smart context measured**: the same draft reports `contextUsed: anaphora` with a session id and genuinely references the conversation; without one it reports `none` and falls back to TBD markers.
10. **A real design flaw was found and fixed during live testing**: a nine-character draft would have been allowed only 22 characters under a bare 2.5x ratio — refusing exactly the rewrite it needs most. Now `max(200, length × ratio)`, locked down by four tests.

## FAQ

**Nothing changed after enhancing?** When the draft is already precise, the discipline layer requires light cleanup only — an unchanged result is a correct outcome.

**The status bar says "re-appended …"?** The model dropped a hard fact twice, so the plugin put it back deterministically at the end. Nothing was lost; the cost is a small extra block.

**Why can a short draft grow several times over?** For short drafts the length gate uses a 200-character absolute budget instead of a ratio — otherwise it would refuse the three-line structure they need most.

**Was session context used?** The status bar shows `context used` when it was. By default it is attached only for anaphoric or very short drafts; `contextTurns: 0` disables it entirely.

**Which model does it use?** Your current session's default. To pin a cheaper one, set `provider` + `model`.

## Local build

```sh
pnpm install
npm run build          # host: tsc → lib/
npm run build:client   # client: tsdown → lib/client.js (window.__ModuleLoader__ format)
npm test               # 88 tests
npm run typecheck && npm run typecheck:client
```

## License

[MIT](LICENSE)