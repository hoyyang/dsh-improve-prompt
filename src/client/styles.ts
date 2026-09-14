/**
 * Plugin-owned CSS, scoped by a data attribute and torn down with the fiber.
 *
 * ## Design principle: crisp geometry first, light second
 *
 * A 28px control lives in a dense toolbar. Two earlier revisions of this button failed
 * the same way — once with a hairline border and no material, once with a wide bloom
 * that fogged the whole row. The lesson is in the shape of this file: **the pill is a
 * precision object, and every light source is contained inside it.**
 *
 * - **plate** — idle is a ghost like its neighbours; hover and beyond switch to a solid
 *   theme surface with a top sheen, a crisp 1px border and a tight coloured shadow.
 *   Nothing outside the pill is ever blurred.
 * - **border light** — a 1px conic arc that travels around the border band, with only a
 *   2px drop-shadow. It reads as light on the edge, not as an outline and not as fog.
 * - **icon** — the accent. Inline SVG in `currentColor` with a tight 3px glow, plus a
 *   generated spark sprite at its own size for the aura. It scales and turns on hover
 *   and spins while busy.
 *
 * ## Layer order (this is what guarantees the label stays legible)
 *
 * `.dip-seat` — positioning context, `isolation:isolate`
 *   `.dip-btn`  — `z-index:1`, owns its own background
 *     `.dip-spark` — `z-index:1`, a compact sprite in the icon slot, entirely
 *                     left of the label (3px + 18px ends well before the label at 29px)
 *     `.dip-icon`  — inline SVG, crisp at any DPI
 *     `.dip-label` — `z-index:2`, the topmost element in the seat
 *
 * The border arc is masked to the 1px band, which the label's padding box never reaches,
 * and a lit pill is always an opaque pill — so no light source can sit under a glyph.
 *
 * Measured, not asserted: `npm run harness:button` renders every state from this file and
 * the real component, then asserts the geometry and the WCAG contrast of the label.
 *
 * @module dsh-improve-prompt/client/styles
 */

import { AURA_URI } from './assets.js'

export const STYLE_ATTR = 'dsh-improve-prompt'

/** Durations in one place, so the reduced-motion block can neutralise them together. */
const D = {
  arcSlow: '3.2s',
  arcFast: '1.2s',
  iconSpin: '1.1s',
  sparkPulse: '1.6s',
} as const

/** Registered so the conic arc angle can interpolate; without @property it renders static. */
const AT_PROPERTY = '@property --dip-a{syntax:"<angle>";initial-value:0deg;inherits:false}'

export const css = [
  AT_PROPERTY,

  '.dip-root{display:inline-flex;align-items:center;gap:2px;flex:none}',
  '.dip-seat{position:relative;display:inline-flex;isolation:isolate}',

  /* ---------- the pill: a crisp object, never a glow ---------- */
  '.dip-btn{position:relative;z-index:1;height:28px;min-width:28px;padding:0 10px;display:inline-flex;',
  'align-items:center;gap:6px;cursor:pointer;background:0 0;border:1px solid transparent;border-radius:24px;',
  'outline:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:20px;',
  // only cheap, compositor-friendly properties animate; nothing here blurs the outline
  'transition:background-color .18s ease,color .18s ease,border-color .18s ease,box-shadow .24s ease,',
  'transform .13s cubic-bezier(.22,1,.36,1);will-change:transform}',

  /* the label is the topmost layer and owns its own contrast insurance */
  '.dip-label{position:relative;z-index:2;white-space:nowrap}',

  /* ---------- idle -> hover: solid plate, crisp border, tight shadow ---------- */
  '.dip-btn:hover:not(:disabled){',
  'background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));',
  'border-color:var(--dsw-alias-border-l3);color:var(--dsw-alias-label-primary);',
  // a 1px top sheen + a 10px coloured shadow: light without fog
  'box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 4px 10px -6px rgba(43,108,255,.55);',
  'transform:translateY(-1px)}',

  '.dip-seat:hover .dip-spark{opacity:.95;transform:translateY(-50%) scale(1.08) rotate(90deg)}',
  '.dip-seat:hover .dip-btn:not(:disabled) .dip-icon{transform:scale(1.14) rotate(90deg);',
  'filter:drop-shadow(0 0 3px rgba(56,189,248,.9))}',

  /* travelling arc on the border band: 1px, crisp, with a 2px glow so it reads as light */
  '.dip-btn::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;opacity:0;',
  'background:conic-gradient(from var(--dip-a,0deg),rgba(56,189,248,0) 0deg,rgba(186,230,253,1) 40deg,',
  'rgba(125,211,252,.95) 90deg,rgba(56,189,248,0) 170deg,rgba(56,189,248,0) 190deg,rgba(251,191,36,.8) 250deg,',
  'rgba(56,189,248,0) 320deg);',
  '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  '-webkit-mask-composite:xor;mask-composite:exclude;',
  'filter:drop-shadow(0 0 2px rgba(56,189,248,.75));',
  'transition:opacity .25s ease;pointer-events:none}',
  '.dip-btn:hover:not(:disabled)::after{opacity:1;animation:dip-arc ' + D.arcSlow + ' linear infinite}',

  /* ---------- press: it settles ---------- */
  '.dip-btn:active:not(:disabled){transform:translateY(0) scale(.96);',
  'box-shadow:inset 0 2px 5px rgba(0,0,0,.3),0 2px 6px -5px rgba(43,108,255,.7)}',
  '.dip-seat:active .dip-spark{opacity:1;transform:translateY(-50%) scale(.86);transition-duration:.12s}',
  '.dip-btn:active:not(:disabled)::after{opacity:1;animation-duration:1.4s}',

  /* ---------- busy: the arc becomes a running ring, the icon spins ---------- */
  '.dip-btn[data-busy="true"]{color:var(--dsw-alias-label-primary);',
  'background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));',
  'border-color:rgba(56,189,248,.55);',
  'box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 4px 12px -6px rgba(43,108,255,.7)}',

  '.dip-btn[data-busy="true"]::after{opacity:1;animation:dip-arc ' + D.arcFast + ' linear infinite}',
  '.dip-btn[data-busy="true"] .dip-icon{animation:dip-icon-spin ' + D.iconSpin + ' linear infinite;',
  'filter:drop-shadow(0 0 3px rgba(56,189,248,.9))}',
  '.dip-seat[data-busy="true"] .dip-spark{opacity:1;animation:dip-spark-pulse ' + D.sparkPulse + ' ease-in-out infinite}',

  /* ---------- states that must stay quiet ---------- */
  '.dip-btn:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}',
  // Disabled still has to be readable: WCAG exempts inactive controls, this plugin's hard
  // requirement does not, so the text stays on label-secondary with a light dim (measured
  // 6.15:1 dark / 4.90:1 light) while the missing light carries the signal.
  '.dip-btn:disabled{color:var(--dsw-alias-label-secondary);cursor:default;opacity:.82}',
  '.dip-btn:disabled::after{content:none}',
  '.dip-seat:has(.dip-btn:disabled) .dip-spark{opacity:.2;animation:none;transform:translateY(-50%) scale(.82)}',

  // A compact aura behind the icon only. 18px wide at left 3px ends at x=21; the label box
  // starts at 10px padding + 14px icon + 6px gap = x=30. Nine pixels of clearance.
  '.dip-spark{position:absolute;left:3px;top:50%;width:18px;height:18px;transform:translateY(-50%) scale(.95);',
  'z-index:1;background:url(' + AURA_URI + ') center/contain no-repeat;opacity:.42;pointer-events:none;',
  'transition:opacity .26s ease,transform .4s cubic-bezier(.22,1,.36,1)}',
  '.dip-icon{width:14px;height:14px;flex:none;display:block;position:relative;z-index:2;',
  // The icon is decoration, not text, so it does not follow the label colour: a fixed
  // cyan reads on both themes, whereas currentColor turned it near-black on the light
  // theme and fought the generated spark behind it.
  'color:#38bdf8;',
  'transition:transform .26s cubic-bezier(.22,1,.36,1),filter .24s ease}',
  '.dip-seat:hover .dip-btn:not(:disabled) .dip-icon{color:#7dd3fc}',
  '.dip-btn[data-busy="true"] .dip-icon{color:#7dd3fc}',
  '.dip-seat:has(.dip-btn:disabled) .dip-icon{color:var(--dsw-alias-label-dimmed)}',

  /* ---------- the mode chevron: same language, far less of it ---------- */
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
  '@keyframes dip-arc{from{--dip-a:0deg}to{--dip-a:360deg}}',
  '@keyframes dip-icon-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
  '@keyframes dip-spark-pulse{0%,100%{opacity:.55;transform:translateY(-50%) scale(.95)}50%{opacity:1;transform:translateY(-50%) scale(1.12)}}',

  /* ---------- motion preferences: light freezes, legibility is untouched ---------- */
  '@media (prefers-reduced-motion: reduce){',
  '.dip-spark,.dip-btn,.dip-btn::after,.dip-icon,.dip-chevron,.dip-undo{animation:none!important;',
  'transition-duration:.01ms!important}',
  '.dip-btn:hover:not(:disabled)::after,.dip-btn[data-busy="true"]::after{opacity:1}',
  '.dip-seat:hover .dip-spark{opacity:.95;transform:translateY(-50%) scale(1.08) rotate(90deg)}',
  '.dip-seat[data-busy="true"] .dip-spark{opacity:.9}',
  '}',
].join('\n')
