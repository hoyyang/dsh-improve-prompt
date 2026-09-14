/**
 * Plugin-owned CSS, scoped by a data attribute and torn down with the fiber.
 *
 * @module dsh-improve-prompt/client/styles
 */

export const STYLE_ATTR = 'dsh-improve-prompt'

export const css = [
  '.dip-root{display:inline-flex;align-items:center;gap:2px;flex:none}',
  '.dip-btn{height:28px;min-width:28px;padding:0 6px;display:inline-flex;align-items:center;gap:4px;',
  'cursor:pointer;background:0 0;border:1px solid transparent;border-radius:24px;outline:none;',
  'color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:20px;',
  'transition:background-color .12s ease,color .12s ease,border-color .12s ease}',
  '.dip-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
  '.dip-btn:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}',
  '.dip-btn:disabled{color:var(--dsw-alias-label-dimmed);cursor:default;opacity:.55}',
  '.dip-btn[data-busy="true"]{color:var(--dsw-alias-label-primary)}',
  '.dip-icon{width:14px;height:14px;flex:none;display:block}',
  '.dip-btn[data-busy="true"] .dip-icon{animation:dip-spin 1s linear infinite}',
  '@keyframes dip-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
  '.dip-chevron{height:22px;width:16px;padding:0;display:inline-flex;align-items:center;justify-content:center;',
  'cursor:pointer;background:0 0;border:0;border-radius:6px;outline:none;color:var(--dsw-alias-label-dimmed);font-size:9px}',
  '.dip-chevron:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
  '.dip-bar{display:flex;align-items:center;gap:8px;margin:0 auto 6px;max-width:100%;padding:5px 10px;',
  'border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));',
  'font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);box-shadow:0 1px 3px rgba(0,0,0,.06)}',
  '.dip-bar[data-kind="error"]{border-color:rgba(220,90,70,.5);color:var(--dsw-alias-label-primary)}',
  '.dip-bar-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dip-sep{opacity:.4}',
  '.dip-undo{margin-left:2px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;',
  'background:0 0;color:inherit;font-size:12px;cursor:pointer;outline:none;font-weight:500}',
  '.dip-undo:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
].join('\n')
