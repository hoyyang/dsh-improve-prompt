/**
 * dsh-improve-prompt — client half.
 *
 * Two slot entries and nothing else:
 * - `conversation.input.right` — the sparkle button in the composer tool row.
 * - `conversation.input.dock` — the "improved · certificate · undo" bar.
 *
 * Slot contract verified against @deepseek-ai/dsh-client-ui-conversation 0.1.5-rc.1:
 * a session-scoped entry receives `useInput` + `inputActions` (the standard session
 * props) plus whatever `inject` adds — here the `sessionId`.
 *
 * @module dsh-improve-prompt/client
 */

import React from 'react'
import { ImproveButton, StatusBar, type TFn } from './components.js'
import { NS, en, zh } from './locales.js'
import { STYLE_ATTR, css } from './styles.js'

/** Required client services. */
export const inject = ['slots', 'locale']

interface LocaleFace {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): () => void
  bind(namespace: string): TFn
}

interface SlotsFace {
  inject(seat: string, fn: () => unknown): unknown
  register(options: {
    name: string
    id?: string
    priority?: number
    order?: number
    locale?: string
    inject?: (sessionId: string) => unknown
  }, component: unknown): unknown
}

interface ClientContext {
  slots: SlotsFace
  locale?: LocaleFace
  effect(fn: () => unknown | (() => void), label?: string): void
}

type SlotProps = Record<string, unknown> & { sessionId?: string }

/**
 * Attach the client half.
 *
 * @param ctx - client context carrying `slots` and `locale`.
 */
export function apply(ctx: ClientContext): void {
  // Fallback lookup: the UI must render something even if locale registration failed.
  let t: TFn = (key: string) => (en[key] !== undefined ? en[key]! : key)

  ctx.effect(() => {
    if (typeof document === 'undefined') return undefined
    document.querySelectorAll('style[data-plugin="' + STYLE_ATTR + '"]').forEach((node) => { node.remove() })
    const style = document.createElement('style')
    style.dataset.plugin = STYLE_ATTR
    style.textContent = css
    document.head.appendChild(style)
    return () => { style.remove() }
  }, 'dsh-improve-prompt: styles')

  if (ctx.locale !== undefined) {
    ctx.effect(() => ctx.locale!.register(NS, { zh, en }), 'dsh-improve-prompt: locale')
    try {
      t = ctx.locale.bind(NS)
    } catch (error) {
      console.error('[dsh-improve-prompt] locale bind failed; using the built-in English copy', error)
    }
  } else {
    console.error('[dsh-improve-prompt] no locale service; using the built-in English copy')
  }

  if (ctx.slots === undefined) {
    console.error('[dsh-improve-prompt] no slots service; composer entries not registered')
    return
  }

  // Composer tool row: the sparkle button, immediately before the submit action.
  ctx.effect(() => {
    try {
      return ctx.slots.inject('conversation.input.right', function* () {
        yield ctx.slots.register({
          name: 'conversation.input.right',
          id: 'dsh-improve-prompt-button',
          order: 40,
          locale: NS,
          inject: (sessionId: string) => ({ sessionId }),
        }, (slotProps: SlotProps) => React.createElement(ImproveButton, Object.assign({}, slotProps, { t }) as never))
      })
    } catch (error) {
      console.error('[dsh-improve-prompt] button slot registration failed', error)
      return () => {}
    }
  }, 'dsh-improve-prompt: composer button')

  // Above the composer card: the certificate and the undo affordance.
  ctx.effect(() => {
    try {
      return ctx.slots.inject('conversation.input.dock', function* () {
        yield ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'dsh-improve-prompt-bar',
          order: 40,
          locale: NS,
          inject: (sessionId: string) => ({ sessionId }),
        }, (slotProps: SlotProps) => React.createElement(StatusBar, {
          sessionId: slotProps !== undefined && typeof slotProps.sessionId === 'string' ? slotProps.sessionId : undefined,
          t,
        } as never))
      })
    } catch (error) {
      console.error('[dsh-improve-prompt] status bar slot registration failed', error)
      return () => {}
    }
  }, 'dsh-improve-prompt: status bar')
}
