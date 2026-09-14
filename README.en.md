# dsh-improve-prompt

![banner](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/banner.jpg)

**The ✦ button in your composer rewrites the draft into a prompt an agent can actually act on — replaced in place, undoable, and guaranteed to lose nothing.**

[**简体中文**](README.md) · [Releases](https://github.com/hoyyang/dsh-improve-prompt/releases) · [Changelog](CHANGELOG.md)

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="npm" src="https://img.shields.io/npm/v/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://www.npmjs.com/package/dsh-improve-prompt"><img alt="downloads" src="https://img.shields.io/npm/dm/dsh-improve-prompt?color=2b6cff"></a>
  <a href="https://github.com/hoyyang/dsh-improve-prompt/releases"><img alt="release" src="https://img.shields.io/github/v/release/hoyyang/dsh-improve-prompt?color=38bdf8"></a>
  <img alt="dsh" src="https://img.shields.io/badge/dsh-%3E%3D0.1.1--rc.2-38bdf8">
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

![component styling, rendered from the plugin's real CSS](https://raw.githubusercontent.com/hoyyang/dsh-improve-prompt/main/assets/components.png)

- **One-click replace** — press ✦, and 1–3 seconds later the draft has become a sharper, agent-ready prompt. No preview dialog, no interruption (the WorkBuddy shape).
- **One-click undo** — a status bar appears above the composer; press Undo within 8 seconds to restore the original. The moment you edit by hand the bar disappears, so your new input is never overwritten.
- **Fidelity gate (the real difference)** — it mechanically extracts the draft's **hard facts**: file paths, file names, identifiers, numbers and versions, URLs, `backticked` code, @references. Each one is then verified to have literally survived the rewrite. A missing fact triggers one **repair call** naming those exact strings; if the model still drops it, a **deterministic re-append** adds a "Preserved original details" block. **Every other enhancer in the ecosystem just asks the model, in its system prompt, to "preserve the original details" — none of them checks.**
- **Length gate** — a rewrite over budget (2.5x in Standard, **never below a 200-character absolute floor**) gets one convergence call carrying an explicit character budget; if it is still over, nothing is written back and the reason is shown. This kills the runner-up failure mode: a one-line request returned as a thirty-line specification.
- **Quality certificate** — the status bar tells you whether to trust the result: `Improved · fidelity 5/5 · 1.0x · 2.2s`.
- **Two modes** — **Light** (de-filler and disambiguate, ≤1.2x — WorkBuddy's own "fewer tokens" positioning) / **Standard** (restructure, ≤2.5x). Remembered locally.
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
   ├─ local guards (empty / slash command / too long) ──► refuse, zero model traffic
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

- **71 tests, all green**: pure functions (hard-fact extraction / fidelity checking / length judgement / context trigger / output normalization / session history), **full orchestration against a stub model** (repair pass, re-append, refusal, timeout, cancellation, upstream failure, injection defence), and the **built client bundle** (registration contract, disabled states, click-to-write-back, failure leaving the draft untouched, undo, mode memory, localization and fallback).
- **Strict TypeScript checks** pass for both halves.
- **Cold-start three-failure static check green** (link junction / bundle manifest / disabled contradiction) plus a clean `dsh --dump-config` composition check.
- **Uninstall verified clean**: route unregistered, junction removed, zero profile-manifest residue, loader entry and client module table cleared; reinstalling is idempotent.
- **Live end-to-end against a real model**: a draft carrying a path, an identifier, a version, a URL and backticked code came back at fidelity `5/5`, ratio `1.0x`; a wordy English draft in Light mode came back at `0.6x`; a vague draft ("加个功能") was returned unchanged rather than padded with invented requirements.
- **A real design flaw was found and fixed during live testing**: a nine-character draft would have been allowed only 22 characters under a bare 2.5x ratio — refusing exactly the rewrite it needs most. Now `max(200, length × ratio)`, locked down by tests.

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
npm test               # 71 tests
npm run typecheck && npm run typecheck:client
```

## License

[MIT](LICENSE)
