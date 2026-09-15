/**
 * Plugin-owned CSS, scoped by a data attribute and torn down with the fiber.
 *
 * ## Material: ONE split glass chip (v6 — the mode switch is fused into the plate)
 *
 * Through v5 the chip and the mode chevron were two disjoint elements: a crafted glass
 * pill next to a bare glyph on the composer's own background. On a light theme that glyph
 * was a dim dot on light grey — unreadable, and visually a foreign body beside the chip.
 * The fix is structural, not cosmetic: the chip IS the component now, one plate carrying
 * two zones —
 *
 *   ╔══════════════╗
 *   ║ ✦ 标准 │ ▾ ║   main zone | hairline | switch zone
 *   ╚══════════════╝
 *
 * - **the plate is always dark** — `#061024 -> #0c2144` glass, in both themes. It is not
 *   inverted on a light theme; a dark chip simply reads as a chip there, and it is the only
 *   way one set of accent colours can stay legible on both backgrounds.
 * - **the border is a conic gradient** — cyan -> sky -> electric blue -> gold, painted with
 *   the `padding-box / border-box` double-background trick. Conic, because a linear ramp
 *   only shows its first quarter on a narrow chip (measured in v4).
 * - **the aurora lives inside the chip** — soft radial washes at `inset:0`, one pool per
 *   zone: cyan over the main action, electric blue over the switch, gold catching the
 *   lower edge. The switch zone carrying its own pool is what makes the fusion read as
 *   one deliberate object instead of a pill with a bump.
 * - **the divider is a hairline of glass** — 1px, fading at both ends, with a faint glow.
 *   It separates hit targets, never crosses a glyph.
 * - **both zones speak the same ink** — near-white on the dark plate plus a dark
 *   text-shadow; the caret gets the same treatment as the label. No light source ever
 *   sits under a glyph: the spark owns the icon slot, the rim is masked to the 1px
 *   border band, the energy bar occupies only the bottom 2px.
 *
 * ## Layer order (the legibility guarantee)
 *
 * `.dip-root` — the chip; `overflow:hidden`, so nothing inside can escape it
 *   `.dip-aurora`  — contained washes, `z-index:0`, `pointer-events:none`
 *   `.dip-ring`    — conic gradient masked to the 1px border band, `z-index:1`
 *   `.dip-arc`     — busy-only energy bar on the bottom 2px, `z-index:1`
 *   `.dip-btn`     — main zone, `z-index:2`; spark (icon slot) + icon + label inside
 *   `.dip-divider` — hairline, `z-index:2`
 *   `.dip-chevron` — switch zone, `z-index:2`; `.dip-caret` glyph inside
 *
 * Because the plate never turns translucent and no layer brightens under the glyphs, the
 * measured contrast is the same in every state and both themes — for the label AND the
 * caret. `npm run harness:button` renders every state from this file plus the real
 * component and the boxes needed to measure it from pixels.
 *
 * @module dsh-improve-prompt/client/styles
 */

import { AURA_URI } from './assets.js'

export const STYLE_ATTR = 'dsh-improve-prompt'

/**
 * The plugin's own palette — cyan -> electric blue with a single gold accent, the same
 * family as the project banner. Deliberately NOT the reference plugin's violet/magenta
 * ramp: what is borrowed from dsh-plan-board is the craft, not the colours.
 */
const INK = '#f2f7ff'
/** The caret's own ink — light glass cyan; measured against the plate, never assumed. */
const CARET = '#cfe4ff'
/** Deep navy glass. It never inverts per theme — that is what lets one accent set read on both. */
const PLATE = 'linear-gradient(135deg,#061024 0%,#08182e 52%,#0c2144 100%)'
/**
 * The rim. A LINEAR ramp only shows its first quarter on a narrow chip — measured against
 * the reference: cyan appeared and everything after it never did. A conic ramp is
 * width-independent, so every hue of this palette is always on the rim.
 */
const RIM = 'conic-gradient(from 200deg at 50% 50%,#22d3ee 0%,#38bdf8 15%,#2b6cff 38%,#1d4ed8 52%,#f5c542 80%,#ffe9a8 90%,#22d3ee 100%)'
/** Contained light: a pool per zone plus the gold lower edge, all inside the chip. */
const AURORA = [
  'radial-gradient(30% 62% at 16% 48%,rgba(34,211,238,.42),transparent 70%)',
  'radial-gradient(28% 62% at 62% 42%,rgba(37,99,235,.42),transparent 72%)',
  // the switch zone carries its own pool: the divider is not the end of the glass
  'radial-gradient(30% 64% at 96% 46%,rgba(43,108,255,.44),transparent 74%)',
  'radial-gradient(34% 70% at 62% 116%,rgba(245,197,66,.26),transparent 74%)',
  // the body stays dark between the pools: that contrast is what reads as glass, not jelly
  'radial-gradient(130% 160% at 50% 50%,rgba(6,20,48,.66),transparent 80%)',
].join(',')

/** Idle shadow stack (also the base the hover stack is written against). */
const SHADOW_IDLE = [
  '0 0 0 1px rgba(56,189,248,.22)',
  '0 2px 12px rgba(43,108,255,.34)',
  '0 2px 18px rgba(245,197,66,.18)',
  'inset 0 1px 0 rgba(255,255,255,.26)',
  'inset 0 2px 5px rgba(226,244,255,.10)',
  'inset 0 -1px 0 rgba(245,197,66,.18)',
  'inset 0 0 14px rgba(43,108,255,.28)',
  '0 2px 6px rgba(0,0,0,.34)',
].join(',')

/** Hover: lifted, brighter, wider glow. */
const SHADOW_HOVER = [
  '0 0 0 1px rgba(125,211,252,.55)',
  '0 6px 26px rgba(43,108,255,.6)',
  '0 0 24px rgba(56,189,248,.45)',
  '0 0 28px rgba(245,197,66,.26)',
  'inset 0 1px 0 rgba(255,255,255,.34)',
  'inset 0 2px 6px rgba(226,244,255,.14)',
  'inset 0 -1px 0 rgba(245,197,66,.26)',
  'inset 0 0 18px rgba(43,108,255,.4)',
  '0 3px 8px rgba(0,0,0,.38)',
].join(',')

/** Disabled: same dark glass, the light gone quiet. */
const SHADOW_QUIET = [
  '0 0 0 1px rgba(56,189,248,.14)',
  '0 2px 8px rgba(43,108,255,.18)',
  'inset 0 1px 0 rgba(255,255,255,.14)',
  'inset 0 -1px 0 rgba(245,197,66,.10)',
  'inset 0 0 10px rgba(43,108,255,.16)',
  '0 2px 5px rgba(0,0,0,.3)',
].join(',')

export const css = [
  /* ---------- the chip: one plate, two zones ---------- */
  '.dip-root{position:relative;display:inline-flex;align-items:stretch;isolation:isolate;',
  'height:28px;border-radius:999px;overflow:hidden;user-select:none;vertical-align:middle;flex:none;',
  'border:1px solid transparent;box-sizing:border-box;cursor:default;',
  'background:' + PLATE + ' padding-box,' + RIM + ' border-box;',
  'box-shadow:' + SHADOW_IDLE + ';',
  'transition:transform .16s cubic-bezier(.34,1.56,.64,1),box-shadow .28s,filter .28s}',

  /* contained light: the aurora never leaves the chip */
  '.dip-aurora{position:absolute;inset:0;border-radius:999px;pointer-events:none;z-index:0;',
  'opacity:.85;transition:opacity .3s;background:' + AURORA + '}',

  /* indeterminate progress: an energy bar sweeping the bottom inner edge, busy only.
     It occupies y25..27 of a 28px chip while both glyph boxes live at y8..20, so it can
     never pass under a glyph — a geometric guarantee the harness asserts. */
  '.dip-arc{position:absolute;left:0;right:0;bottom:1px;height:2px;border-radius:2px;opacity:0;',
  'pointer-events:none;z-index:1;background-repeat:no-repeat;background-size:42% 100%;background-position:-60% 0;',
  'background-image:linear-gradient(90deg,transparent,rgba(125,211,252,.95),rgba(245,197,66,.9),transparent);',
  'transition:opacity .25s ease}',
  '.dip-root[data-busy="true"] .dip-arc{opacity:1;animation:dip-sweep 1.5s cubic-bezier(.55,.05,.35,.95) infinite}',

  /* travelling rim light, masked to the 1px band */
  '.dip-ring{position:absolute;inset:0;border-radius:999px;padding:1px;opacity:0;pointer-events:none;z-index:1;',
  'background:conic-gradient(from 0deg,transparent 0 38%,rgba(34,211,238,.95) 56%,rgba(245,197,66,1) 72%,rgba(125,211,252,.95) 86%,transparent 100%);',
  '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  '-webkit-mask-composite:xor;mask-composite:exclude;transition:opacity .25s ease}',

  /* ---------- the main zone ---------- */
  '.dip-btn{position:relative;z-index:2;display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;',
  'height:28px;padding:0 8px 0 9px;border:0;background:transparent;cursor:pointer;outline:none;',
  'line-height:1;font-size:12px;font-weight:600;letter-spacing:.15px;color:' + INK + '}',
  '.dip-btn:focus-visible{box-shadow:inset 0 0 0 2px rgba(125,211,252,.8)}',

  // The label is the topmost of its zone; the dark shadow is what keeps light glyphs crisp
  // on the glass, the exact opposite of the mistake made for light glyphs on a light plate.
  '.dip-label{position:relative;z-index:2;white-space:nowrap;',
  'text-shadow:0 1px 6px rgba(4,8,18,.8),0 0 12px rgba(43,108,255,.35)}',

  /* ---------- the hairline divider ---------- */
  '.dip-divider{position:relative;z-index:2;width:1px;align-self:stretch;margin:7px 0;pointer-events:none;',
  'background:linear-gradient(180deg,transparent 0%,rgba(125,211,252,.55) 32%,rgba(207,228,255,.5) 55%,rgba(245,197,66,.32) 80%,transparent 100%);',
  'box-shadow:0 0 4px rgba(56,189,248,.3)}',

  /* ---------- the switch zone ---------- */
  '.dip-chevron{position:relative;z-index:2;flex:none;width:24px;height:28px;box-sizing:border-box;padding:0;',
  'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;background:transparent;',
  'border:0;outline:none;color:' + CARET + ';transition:background-color .18s ease}',
  '.dip-chevron:focus-visible{box-shadow:inset 0 0 0 2px rgba(125,211,252,.8)}',
  '.dip-caret{display:block;font-size:10px;font-weight:600;line-height:1;',
  'text-shadow:0 1px 5px rgba(4,8,18,.85),0 0 8px rgba(43,108,255,.45);',
  'transition:transform .18s cubic-bezier(.34,1.56,.64,1)}',
  '.dip-chevron:hover{background:linear-gradient(180deg,rgba(125,211,252,.12),rgba(43,108,255,.10))}',
  '.dip-chevron:hover .dip-caret{transform:translateY(1px)}',
  '.dip-chevron:active .dip-caret{transform:translateY(1px) scale(.88)}',

  /* ---------- hover: the whole chip lifts, brightens, and starts the rim ---------- */
  '.dip-root:hover{transform:translateY(-1.5px) scale(1.04);filter:brightness(1.1);box-shadow:' + SHADOW_HOVER + '}',
  '.dip-root:hover .dip-ring{opacity:.85;animation:dip-rim 3.4s linear infinite}',
  '.dip-root:hover .dip-aurora{opacity:1}',
  '.dip-root:hover .dip-spark{opacity:.9;transform:translateY(-50%) scale(1.12) rotate(90deg)}',
  '.dip-root:hover .dip-icon{transform:scale(1.18) rotate(-6deg)}',

  /* ---------- press ---------- */
  '.dip-root:active{transform:translateY(0) scale(.94);transition-duration:.06s;filter:brightness(.98)}',
  '.dip-root:active .dip-icon{transform:scale(.9)}',
  '.dip-root:active .dip-ring{opacity:1;animation-duration:1.1s}',

  /* ---------- busy: the rim runs continuously across the WHOLE chip ---------- */
  // Busy is a different animal from hover, not a faster hover: the chip charges (a slow
  // breath), the rim becomes a thick comet with a long tail, and the bottom edge carries
  // a moving energy bar. Hover keeps only the lift, the brightening and a slow rim.
  '.dip-root[data-busy="true"]{animation:dip-charge 2.1s ease-in-out infinite}',
  '.dip-root[data-busy="true"] .dip-btn{cursor:progress}',
  '.dip-root[data-busy="true"] .dip-ring{opacity:1;padding:2px;animation:dip-rim 1s linear infinite;',
  'background:conic-gradient(from 0deg,transparent 0 8%,rgba(34,211,238,.45) 22%,rgba(125,211,252,1) 40%,',
  'rgba(245,197,66,1) 54%,transparent 70%)}',
  '.dip-root[data-busy="true"] .dip-icon{animation:dip-icon-spin .8s linear infinite}',
  '.dip-root[data-busy="true"] .dip-aurora{opacity:1;animation:dip-aurora 1.1s ease-in-out infinite}',
  '.dip-root[data-busy="true"] .dip-spark{opacity:1;animation:dip-spark-pulse 1.1s ease-in-out infinite}',

  /* ---------- quiet states ---------- */
  // Disabled keeps readable ink: the plate is unchanged dark glass, only the light is gone.
  // The switch stays alive on a disabled main action — the caret is never dimmed into it.
  '.dip-btn:disabled{cursor:default;color:rgba(243,247,255,.66)}',
  '.dip-root:has(.dip-btn:disabled){filter:saturate(.5);box-shadow:' + SHADOW_QUIET + '}',
  '.dip-root:has(.dip-btn:disabled) .dip-ring{opacity:0}',
  '.dip-root:has(.dip-btn:disabled) .dip-aurora{opacity:.2}',
  '.dip-root:has(.dip-btn:disabled) .dip-spark{opacity:.14;animation:none;transform:translateY(-50%) scale(.82)}',
  '.dip-root:has(.dip-btn:disabled) .dip-icon{opacity:.55}',
  '.dip-root:has(.dip-btn:disabled) .dip-chevron{cursor:pointer}',

  // Generated spark, icon slot only: 3px + 18px = 21px, the label box starts at 9 + 15 + 6 = 30px
  '.dip-spark{position:absolute;left:3px;top:50%;width:18px;height:18px;transform:translateY(-50%) scale(.95);',
  'z-index:1;background:url(' + AURA_URI + ') center/contain no-repeat;opacity:.5;pointer-events:none;',
  'transition:opacity .26s ease,transform .4s cubic-bezier(.22,1,.36,1)}',
  '.dip-icon{width:15px;height:15px;flex:none;display:block;position:relative;z-index:2;color:#eaf6ff;',
  'filter:drop-shadow(0 0 5px rgba(56,189,248,.9)) drop-shadow(0 0 10px rgba(43,108,255,.45));',
  // the gradient itself lives inside the SVG (see components.ts); this colour is the fallback
  'transition:transform .2s cubic-bezier(.34,1.56,.64,1),filter .24s ease}',
  '.dip-root:hover .dip-icon{filter:drop-shadow(0 0 6px rgba(125,211,252,.95)) drop-shadow(0 0 12px rgba(245,197,66,.4))}',
  '.dip-root[data-busy="true"] .dip-icon{filter:drop-shadow(0 0 6px rgba(125,211,252,.95)) drop-shadow(0 0 12px rgba(245,197,66,.45))}',

  /* ---------- status / undo bar ---------- */
  '.dip-bar{display:flex;align-items:center;gap:8px;margin:0 auto 6px;max-width:100%;padding:5px 10px;',
  'border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));',
  'font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);box-shadow:0 1px 3px rgba(0,0,0,.06)}',
  '.dip-bar[data-kind="error"]{border-color:rgba(220,90,70,.5);color:var(--dsw-alias-label-primary)}',
  '.dip-bar-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dip-sep{opacity:.4}',
  '.dip-undo{margin-left:2px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;',
  'background:0 0;color:inherit;font-size:12px;cursor:pointer;outline:none;font-weight:500;',
  'transition:background-color .15s ease,color .15s ease,transform .12s ease}',
  '.dip-undo:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
  '.dip-undo:active{transform:scale(.95)}',

  /* ---------- keyframes ---------- */
  '@keyframes dip-rim{to{transform:rotate(360deg)}}',
  '@keyframes dip-sweep{from{background-position:-60% 0}to{background-position:160% 0}}',
  '@keyframes dip-charge{0%,100%{transform:scale(1)}50%{transform:scale(1.028)}}',
  '@keyframes dip-icon-spin{to{transform:rotate(360deg)}}',
  '@keyframes dip-aurora{0%,100%{opacity:.7}50%{opacity:1}}',
  '@keyframes dip-spark-pulse{0%,100%{opacity:.5;transform:translateY(-50%) scale(.95)}50%{opacity:1;transform:translateY(-50%) scale(1.15)}}',

  /* ---------- motion preferences: light freezes, legibility is untouched ---------- */
  '@media (prefers-reduced-motion: reduce){',
  '.dip-root,.dip-ring,.dip-aurora,.dip-spark,.dip-icon,.dip-caret,.dip-chevron,.dip-undo{animation:none!important;',
  'transition-duration:.01ms!important}',
  '.dip-root:hover .dip-ring,.dip-root[data-busy="true"] .dip-ring{opacity:1}',
  // busy must still read as busy with motion off: a full-width static bar instead
  '.dip-root[data-busy="true"] .dip-arc{opacity:1;background-size:100% 100%;background-position:0 0}',
  '.dip-root[data-busy="true"] .dip-aurora{opacity:1}',
  '}',
].join('\n')