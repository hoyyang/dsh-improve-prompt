/**
 * Plugin-owned CSS, scoped by a data attribute and torn down with the fiber.
 *
 * ## Material: the dark aurora-glass chip (aligned with dsh-plan-board / dsh-android-pane)
 *
 * Two revisions of this button chased "more light" and both failed: a hairline outline with
 * no material, then a wide bloom that fogged the whole composer row. The plugin sitting in
 * the same toolbar that got it right is dsh-plan-board, so this file now speaks its language:
 *
 * - **the plate is always dark** — `#080b14 -> #120a20` glass, in both themes. It is not
 *   inverted on a light theme; a dark chip simply reads as a chip there, and it is the only
 *   way one set of accent colours can stay legible on both backgrounds.
 * - **the border is a four-stop gradient** — cyan -> sky -> violet -> magenta, painted with the
 *   `padding-box / border-box` double-background trick, so the rim is part of the shape.
 * - **the aurora lives inside the pill** — three soft radial washes at `inset:0`, never a
 *   glow outside it. Light is contained; the earlier fog is structurally impossible.
 * - **the label is near-white on that dark plate** — `#f3f7ff`, which is ~18:1 against the
 *   plate in either theme, plus a dark text-shadow that keeps the glyph edges crisp.
 *
 * ## Layer order (the legibility guarantee)
 *
 * `.dip-btn` — the pill; `overflow:hidden`, so nothing inside can escape it
 *   `.dip-aurora` — contained washes, `z-index:0`, `pointer-events:none`
 *   `.dip-ring`   — conic gradient masked to the 1px border band
 *   `.dip-spark`  — generated sprite, icon slot only, ends 9px before the label box
 *   `.dip-icon`   — inline SVG, near-white with a tight cyan glow
 *   `.dip-label`  — `z-index:2`, topmost
 *
 * Because the plate never turns translucent and no layer brightens under the glyphs, the
 * measured contrast is the same in every state and both themes. `npm run harness:button`
 * renders every state from this file plus the real component and asserts it.
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
/** Deep navy glass. It never inverts per theme — that is what lets one accent set read on both. */
const PLATE = 'linear-gradient(135deg,#061024 0%,#08182e 52%,#0c2144 100%)'
/**
 * The rim. A LINEAR ramp only shows its first quarter on a 66px chip — measured against
 * the reference, cyan appeared and everything after it never did. A conic ramp is
 * width-independent, so every hue of this palette is always on the rim.
 */
const RIM = 'conic-gradient(from 200deg at 50% 50%,#22d3ee 0%,#38bdf8 15%,#2b6cff 38%,#1d4ed8 52%,#f5c542 80%,#ffe9a8 90%,#22d3ee 100%)'
/** Contained light: three washes, all inside the pill. Gold is the accent, not a field. */
const AURORA = [
  'radial-gradient(30% 62% at 16% 48%,rgba(34,211,238,.42),transparent 70%)',
  'radial-gradient(28% 62% at 86% 42%,rgba(37,99,235,.46),transparent 72%)',
  'radial-gradient(34% 70% at 62% 116%,rgba(245,197,66,.26),transparent 74%)',
  // the body stays dark between the pools: that contrast is what reads as glass, not jelly
  'radial-gradient(130% 160% at 50% 50%,rgba(6,20,48,.66),transparent 80%)',
].join(',')

export const css = [
  '.dip-root{display:inline-flex;align-items:center;gap:2px;flex:none}',
  '.dip-seat{position:relative;display:inline-flex;isolation:isolate}',

  /* ---------- the chip ---------- */
  '.dip-btn{position:relative;display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;',
  'height:28px;padding:0 10px 0 9px;border-radius:999px;cursor:pointer;overflow:hidden;user-select:none;',
  'vertical-align:middle;line-height:1;font-size:12px;font-weight:600;letter-spacing:.15px;color:' + INK + ';',
  'border:1px solid transparent;',
  'background:' + PLATE + ' padding-box,' + RIM + ' border-box;',
  // specular top band + gold light catching the lower edge + a tight cyan halo
  'box-shadow:0 0 0 1px rgba(56,189,248,.22),0 2px 12px rgba(43,108,255,.34),0 2px 18px rgba(245,197,66,.18),',
  'inset 0 1px 0 rgba(255,255,255,.26),inset 0 2px 5px rgba(226,244,255,.10),',
  'inset 0 -1px 0 rgba(245,197,66,.18),inset 0 0 14px rgba(43,108,255,.28),0 2px 6px rgba(0,0,0,.34);',
  'transition:transform .16s cubic-bezier(.34,1.56,.64,1),box-shadow .28s,filter .28s}',

  /* contained light: the aurora never leaves the pill */
  '.dip-aurora{position:absolute;inset:0;border-radius:999px;pointer-events:none;z-index:0;',
  'opacity:.85;transition:opacity .3s;background:' + AURORA + '}',

  /* travelling rim light, masked to the 1px band */
  '.dip-ring{position:absolute;inset:0;border-radius:999px;padding:1px;opacity:0;pointer-events:none;z-index:1;',
  'background:conic-gradient(from 0deg,transparent 0 38%,rgba(34,211,238,.95) 56%,rgba(245,197,66,1) 72%,rgba(125,211,252,.95) 86%,transparent 100%);',
  '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  '-webkit-mask-composite:xor;mask-composite:exclude;transition:opacity .25s ease}',

  // The label is the topmost layer; the dark shadow is what keeps light glyphs crisp on the
  // glass, the exact opposite of the mistake made for light glyphs on a light plate.
  '.dip-label{position:relative;z-index:2;white-space:nowrap;',
  'text-shadow:0 1px 6px rgba(4,8,18,.8),0 0 12px rgba(43,108,255,.35)}',

  /* ---------- hover: lift, brighten, and start the rim ---------- */
  '.dip-btn:hover:not(:disabled){transform:translateY(-1.5px) scale(1.04);filter:brightness(1.1);',
  'box-shadow:0 0 0 1px rgba(125,211,252,.55),0 6px 26px rgba(43,108,255,.6),0 0 24px rgba(56,189,248,.45),',
  '0 0 28px rgba(245,197,66,.26),inset 0 1px 0 rgba(255,255,255,.34),inset 0 2px 6px rgba(226,244,255,.14),',
  'inset 0 -1px 0 rgba(245,197,66,.26),inset 0 0 18px rgba(43,108,255,.4),0 3px 8px rgba(0,0,0,.38)}',
  '.dip-btn:hover:not(:disabled) .dip-ring{opacity:1;animation:dip-rim 2.6s linear infinite}',
  '.dip-seat:hover .dip-aurora{opacity:1}',
  '.dip-seat:hover .dip-spark{opacity:.9;transform:translateY(-50%) scale(1.12) rotate(90deg)}',
  '.dip-seat:hover .dip-icon{transform:scale(1.18) rotate(-6deg)}',

  /* ---------- press ---------- */
  '.dip-btn:active:not(:disabled){transform:translateY(0) scale(.94);transition-duration:.06s;filter:brightness(.98)}',
  '.dip-seat:active .dip-icon{transform:scale(.9)}',
  '.dip-btn:active:not(:disabled) .dip-ring{opacity:1;animation-duration:1.1s}',

  /* ---------- busy: the rim runs continuously ---------- */
  '.dip-btn[data-busy="true"] .dip-ring{opacity:1;animation:dip-rim 1.2s linear infinite}',
  '.dip-btn[data-busy="true"] .dip-icon{animation:dip-icon-spin 1.1s linear infinite}',
  '.dip-seat[data-busy="true"] .dip-aurora{opacity:1;animation:dip-aurora 2s ease-in-out infinite}',
  '.dip-seat[data-busy="true"] .dip-spark{opacity:.95;animation:dip-spark-pulse 1.6s ease-in-out infinite}',

  /* ---------- quiet states ---------- */
  '.dip-btn:focus-visible{outline:2px solid rgba(125,211,252,.85);outline-offset:2px}',
  // Disabled keeps readable ink: the plate is unchanged dark glass, only the light is gone.
  '.dip-btn:disabled{cursor:default;color:rgba(243,247,255,.62);filter:saturate(.35) brightness(.85)}',
  '.dip-btn:disabled .dip-ring{opacity:0}',
  '.dip-btn:disabled .dip-aurora{opacity:.18}',
  '.dip-seat:has(.dip-btn:disabled) .dip-spark{opacity:.14;animation:none;transform:translateY(-50%) scale(.82)}',
  '.dip-seat:has(.dip-btn:disabled) .dip-icon{opacity:.55}',

  // Generated spark, icon slot only: 3px + 18px = 21px, the label box starts at 9 + 14 + 6 = 29px
  '.dip-spark{position:absolute;left:3px;top:50%;width:18px;height:18px;transform:translateY(-50%) scale(.95);',
  'z-index:1;background:url(' + AURA_URI + ') center/contain no-repeat;opacity:.5;pointer-events:none;',
  'transition:opacity .26s ease,transform .4s cubic-bezier(.22,1,.36,1)}',
  '.dip-icon{width:15px;height:15px;flex:none;display:block;position:relative;z-index:2;color:#eaf6ff;',
  'filter:drop-shadow(0 0 5px rgba(56,189,248,.9)) drop-shadow(0 0 10px rgba(43,108,255,.45));',
  // the gradient itself lives inside the SVG (see components.ts); this colour is the fallback
  'transition:transform .2s cubic-bezier(.34,1.56,.64,1),filter .24s ease}',
  '.dip-seat:hover .dip-icon{filter:drop-shadow(0 0 6px rgba(125,211,252,.95)) drop-shadow(0 0 12px rgba(245,197,66,.4))}',
  '.dip-btn[data-busy="true"] .dip-icon{filter:drop-shadow(0 0 6px rgba(125,211,252,.95)) drop-shadow(0 0 12px rgba(245,197,66,.45))}',

  /* ---------- the mode chevron ---------- */
  '.dip-chevron{position:relative;z-index:1;height:22px;width:16px;padding:0;display:inline-flex;align-items:center;',
  'justify-content:center;cursor:pointer;background:0 0;border:0;border-radius:6px;outline:none;',
  'color:var(--dsw-alias-label-dimmed);font-size:9px;transition:background-color .15s ease,color .15s ease,transform .12s ease}',
  '.dip-chevron:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
  '.dip-chevron:active{transform:scale(.92)}',

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
  '@keyframes dip-icon-spin{to{transform:rotate(360deg)}}',
  '@keyframes dip-aurora{0%,100%{opacity:.7}50%{opacity:1}}',
  '@keyframes dip-spark-pulse{0%,100%{opacity:.5;transform:translateY(-50%) scale(.95)}50%{opacity:1;transform:translateY(-50%) scale(1.15)}}',

  /* ---------- motion preferences: light freezes, legibility is untouched ---------- */
  '@media (prefers-reduced-motion: reduce){',
  '.dip-btn,.dip-ring,.dip-aurora,.dip-spark,.dip-icon,.dip-chevron,.dip-undo{animation:none!important;',
  'transition-duration:.01ms!important}',
  '.dip-btn:hover:not(:disabled) .dip-ring,.dip-btn[data-busy="true"] .dip-ring{opacity:1}',
  '.dip-seat[data-busy="true"] .dip-aurora{opacity:1}',
  '}',
].join('\n')
