/**
 * Plugin-owned CSS, scoped by a data attribute and torn down with the fiber.
 *
 * ## Layer order (this is what guarantees the label stays legible)
 *
 * `.dip-seat` — positioning context, `isolation:isolate` so nothing below escapes it
 *   `.dip-fx`   — the FX layer, `z-index:0`, `pointer-events:none`, holds NO text
 *     `.dip-halo` — the generated aura, centred on the pill, bleeding ~20px outside it
 *     `.dip-halo` — the generated ring, a static envelope shown only while busy
 *   `.dip-btn`  — the pill itself, `z-index:1`, with its OWN background
 *     `.dip-icon`  — inline SVG, `currentColor`, crisp at any DPI
 *     `.dip-label` — the text, `z-index:2`, the topmost thing in the seat
 *
 * Two rules follow from that order, and neither is a stylistic preference:
 *
 * 1. **Every glow lives outside the label's box.** The aura and the ring are painted
 *    behind the pill's own background, so they can only appear AROUND the text, never
 *    through it. The rotating border is drawn with a `mask-composite` ring, so it
 *    occupies the 1px border band only.
 * 2. **A bright halo implies an opaque plate.** While the aura is strong (hover, press,
 *    busy) the pill switches to the theme's solid surface colour, so the label always
 *    sits on an opaque background. Idle keeps the transparent ghost look its
 *    neighbouring composer controls use, because the idle halo is at 10% opacity.
 *
 * Measured, not asserted: `node scripts/verify-button.mjs` screenshots every state on both
 * themes and computes the rendered text-versus-background contrast ratio.
 *
 * @module dsh-improve-prompt/client/styles
 */

import { AURA_URI, RING_URI } from './assets.js'

export const STYLE_ATTR = 'dsh-improve-prompt'

/** Durations in one place, so the reduced-motion block can neutralise them together. */
const D = {
  breathe: '7s',
  haloSpin: '2.4s',
  ringSpin: '1.9s',
  borderSpin: '2.6s',
  iconSpin: '1s',
} as const

/**
 * Registered so the conic border angle can interpolate. On an engine without
 * @property support the ring still renders — it simply does not spin.
 */
const AT_PROPERTY = '@property --dip-a{syntax:"<angle>";initial-value:0deg;inherits:false}'

export const css = [
  AT_PROPERTY,

  /* ---------- seat + FX layer ---------- */
  '.dip-root{display:inline-flex;align-items:center;gap:2px;flex:none}',
  '.dip-seat{position:relative;display:inline-flex;isolation:isolate}',
  '.dip-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:visible}',
  // The halo is the generated RING stretched to hug the pill: a thin luminous outline
  // reads as premium, whereas the star sprite at this size threw filaments across the
  // whole composer row. Plain alpha compositing, deliberately — the seat is an
  // isolated stacking context, so a blend mode would composite against an empty group
  // instead of the page and wash the glow to grey.
  // The halo is the generated RING, stretched to hug the pill, and it is shown ONLY
  // while busy. Rotating a wide ellipse is what made an earlier revision balloon its
  // bounding box to ~231px and hang below the composer row, so the rotation lives on
  // the pill-shaped conic border instead and this stays a static envelope.
  '.dip-halo{position:absolute;inset:-6px;background:url(' + RING_URI + ') center/100% 100% no-repeat;',
  'opacity:0;transition:opacity .3s ease;will-change:opacity}',
  '.dip-seat[data-busy="true"] .dip-halo{animation:dip-halo-pulse 1.6s ease-in-out infinite}',
  // The spark is the generated STAR, sized to the icon slot. It lives inside the pill
  // but entirely to the LEFT of the label, so it cannot sit under any glyph.
  '.dip-spark{position:absolute;left:1px;top:50%;width:24px;height:24px;transform:translateY(-50%);z-index:1;',
  'background:url(' + AURA_URI + ') center/contain no-repeat;opacity:.4;pointer-events:none;',
  'transition:opacity .26s ease,transform .3s cubic-bezier(.22,1,.36,1)}',

  /* ---------- the pill ---------- */
  '.dip-btn{position:relative;z-index:1;height:28px;min-width:28px;padding:0 8px;display:inline-flex;',
  'align-items:center;gap:5px;cursor:pointer;background:0 0;border:1px solid transparent;border-radius:24px;',
  'outline:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:20px;',
  'transition:background-color .18s ease,color .18s ease,border-color .18s ease,transform .12s cubic-bezier(.22,1,.36,1);',
  'will-change:transform}',

  /* the label is the topmost layer and owns its own contrast insurance */
  '.dip-label{position:relative;z-index:2;white-space:nowrap}',

  /* ---------- idle -> hover ---------- */
  '.dip-btn:hover:not(:disabled){background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));',
  'color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}',
  '.dip-btn:hover:not(:disabled) .dip-label{text-shadow:0 1px 1px rgba(0,0,0,.26)}',
  '.dip-seat:hover .dip-spark{opacity:.95;transform:translateY(-50%) scale(1.12) rotate(90deg)}',
  '.dip-seat:hover .dip-btn:not(:disabled) .dip-icon{filter:drop-shadow(0 0 5px rgba(56,189,248,.85));transform:scale(1.08)}',

  /* rotating gradient border: the 1px band only, never over the text */
  '.dip-btn::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;opacity:0;',
  'background:conic-gradient(from var(--dip-a,0deg),rgba(56,189,248,0),rgba(56,189,248,.95),rgba(245,197,66,.9),rgba(43,108,255,.95),rgba(56,189,248,0));',
  '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
  '-webkit-mask-composite:xor;mask-composite:exclude;',
  'transition:opacity .22s ease;pointer-events:none}',
  '.dip-btn:hover:not(:disabled)::after{opacity:.95;animation:dip-border-spin ' + D.borderSpin + ' linear infinite}',

  /* ---------- press ---------- */
  '.dip-btn:active:not(:disabled){transform:scale(.955)}',
  '.dip-seat:active .dip-spark{opacity:1;transform:translateY(-50%) scale(.9)}',
  '.dip-btn:active:not(:disabled)::after{opacity:1;animation-duration:1.1s}',

  /* ---------- busy ---------- */
  '.dip-btn[data-busy="true"]{color:var(--dsw-alias-label-primary);',
  'background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));border-color:transparent}',
  '.dip-btn[data-busy="true"]::after{opacity:1;animation:dip-border-spin 1.4s linear infinite}',
  '.dip-btn[data-busy="true"] .dip-label{text-shadow:0 1px 1px rgba(0,0,0,.3)}',
  '.dip-btn[data-busy="true"] .dip-icon{animation:dip-icon-spin ' + D.iconSpin + ' linear infinite;',
  'filter:drop-shadow(0 0 5px rgba(56,189,248,.8))}',
  '.dip-seat[data-busy="true"] .dip-spark{opacity:.9;animation:dip-spark-breathe 1.5s ease-in-out infinite}',

  /* ---------- states that must stay quiet ---------- */
  '.dip-btn:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}',
  // Disabled still has to be readable: WCAG exempts inactive controls, but this
  // plugin's hard requirement does not. A light dim over the normal label colour
  // keeps the text well above 4.5:1 on both themes while the missing spark glow and
  // the default cursor carry the "not available" signal.
  '.dip-btn:disabled{color:var(--dsw-alias-label-secondary);cursor:default;opacity:.82}',
  '.dip-btn:disabled::after{content:none}',
  '.dip-seat:has(.dip-btn:disabled) .dip-halo{opacity:0;animation:none}',
  '.dip-seat:has(.dip-btn:disabled) .dip-spark{opacity:.12;animation:none}',
  '.dip-icon{width:14px;height:14px;flex:none;display:block;position:relative;z-index:2;',
  'transition:transform .2s cubic-bezier(.22,1,.36,1),filter .2s ease}',

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
  '@keyframes dip-icon-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
  '@keyframes dip-halo-pulse{0%,100%{opacity:.55}50%{opacity:.95}}',
  '@keyframes dip-spark-breathe{0%,100%{opacity:.55;transform:translateY(-50%) scale(.94)}50%{opacity:1;transform:translateY(-50%) scale(1.16)}}',

  '@keyframes dip-border-spin{from{--dip-a:0deg}to{--dip-a:360deg}}',


  /* ---------- motion preferences: effects become static, legibility is untouched ---------- */
  '@media (prefers-reduced-motion: reduce){',
  '.dip-halo,.dip-btn,.dip-btn::after,.dip-icon,.dip-spark,.dip-chevron,.dip-undo{animation:none!important;',
  'transition-duration:.01ms!important}',
  '.dip-seat:hover .dip-spark{opacity:.95;transform:translateY(-50%) scale(1.12) rotate(90deg)}',
  '.dip-seat[data-busy="true"] .dip-halo{opacity:.85}',
  '.dip-seat[data-busy="true"] .dip-spark{opacity:.9}',
  '.dip-btn:hover:not(:disabled)::after{opacity:.95}',
  '}',
].join('\n')
