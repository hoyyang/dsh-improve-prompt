/**
 * The two visible pieces: the composer button and the status/undo bar.
 *
 * @module dsh-improve-prompt/client/components
 */

import React from 'react'
import { splitCommand } from '../command.js'
import { clear, getMode, notify, setMode, storeFor, subscribe, type InputActionsFace, type Meta, type Mode } from './store.js'

/** Localized copy lookup bound to the plugin namespace. */
export type TFn = (key: string) => string

/** Props the conversation renderer injects into a session-scoped slot entry. */
export interface SeatProps {
  sessionId?: string
  /** Snapshot selector hook over the Session input machine (current renderers). */
  useInput?: (selector: (state: unknown) => unknown) => unknown
  /** Stable public input actions for this session. */
  inputActions?: InputActionsFace
  /** Older-host fallback: a point-in-time input snapshot. */
  input?: { draft?: unknown; phase?: unknown }
  t: TFn
}

const API = '/dsh-improve-prompt/api/improve'

/**
 * Four-point sparkle — the same affordance WorkBuddy puts at the composer's corner.
 *
 * Filled with the plugin's own cyan-to-gold gradient rather than a flat colour. The
 * gradient is defined inside the SVG (browsers resolve the first matching id for every
 * instance, and every instance wants the same gradient), and it is only safe to use a
 * fixed bright gradient because the chip's plate is always dark in both themes.
 */
function Sparkle(): React.ReactElement {
  return React.createElement('svg', { className: 'dip-icon', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
    React.createElement('defs', null,
      React.createElement('linearGradient', { id: 'dip-spark-grad', x1: '0', y1: '0', x2: '1', y2: '1' },
        React.createElement('stop', { offset: '0', stopColor: '#e8f6ff' }),
        React.createElement('stop', { offset: '.55', stopColor: '#38bdf8' }),
        React.createElement('stop', { offset: '1', stopColor: '#f5c542' }),
      ),
    ),
    React.createElement('path', {
      d: 'M8 1.2l1.35 3.9a2 2 0 001.25 1.25l3.9 1.35-3.9 1.35a2 2 0 00-1.25 1.25L8 14.8l-1.35-3.9a2 2 0 00-1.25-1.25L1.5 8.3l3.9-1.35A2 2 0 006.65 5.7L8 1.2z',
      fill: 'url(#dip-spark-grad)',
    }),
  )
}

/** Read the live draft, preferring the injected hook and falling back to a snapshot prop. */
function readDraft(props: SeatProps): string {
  if (typeof props.useInput === 'function') {
    const value = props.useInput((state: unknown) => {
      const s = state as { draft?: unknown } | null
      return s !== null && s !== undefined && typeof s.draft === 'string' ? s.draft : ''
    })
    if (typeof value === 'string') return value
  }
  const fallback = props.input !== undefined ? props.input.draft : undefined
  return typeof fallback === 'string' ? fallback : ''
}

/** Force a re-render whenever this session's store entry changes. */
function useSessionState(sessionId: string | undefined): number {
  const [version, setVersion] = React.useState(0)
  React.useEffect(() => {
    if (sessionId === undefined) return undefined
    return subscribe(sessionId, () => { setVersion((v: number) => v + 1) })
  }, [sessionId])
  return version
}

/**
 * Composer button: one click replaces the draft in place; a second click while
 * busy cancels. Disabled on an empty composer or a slash command.
 */
export function ImproveButton(props: SeatProps): React.ReactElement | null {
  const t = props.t
  const sessionId = props.sessionId
  useSessionState(sessionId)
  const draft = readDraft(props)
  // A leading slash token belongs to the harness; only the text after it is ours.
  // A command with no body therefore has nothing to enhance — but a command WITH a
  // body is exactly the case worth enhancing.
  const split = splitCommand(draft)
  const commandOnly = split.command !== '' && split.body === ''
  const blocked = split.body === ''
  const state = sessionId !== undefined ? storeFor(sessionId) : null
  const busy = state !== null && state.phase === 'busy'
  const actions = props.inputActions !== undefined ? props.inputActions : (state !== null ? state.actions : null)
  const mode: Mode = getMode()

  // Keep the store's action face fresh so the status bar can undo without props.
  if (state !== null && props.inputActions !== undefined && state.actions !== props.inputActions) {
    state.actions = props.inputActions
  }

  const onClick = React.useCallback(() => {
    if (sessionId === undefined || actions === null) return
    const current = storeFor(sessionId)
    if (current.phase === 'busy') {
      if (current.controller !== null) current.controller.abort()
      return
    }
    const text = draft
    if (splitCommand(text).body === '') return
    const controller = new AbortController()
    current.controller = controller
    current.phase = 'busy'
    current.error = null
    current.backup = text
    current.meta = null
    current.enhanced = ''
    notify(sessionId)

    void (async () => {
      try {
        const response = await fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, text, mode: getMode() }),
          signal: controller.signal,
        })
        const data = (await response.json()) as {
          ok?: boolean; code?: string; message?: string; text?: string; meta?: Meta
        }
        const latest = storeFor(sessionId)
        if (data.ok === true && typeof data.text === 'string' && data.text !== '') {
          latest.enhanced = data.text
          latest.meta = data.meta !== undefined ? data.meta : null
          latest.phase = 'done'
          latest.controller = null
          actions.setDraft(data.text)
          notify(sessionId)
          return
        }
        const code = typeof data.code === 'string' ? data.code : 'UNKNOWN'
        const key = 'err_' + code
        const localized = t(key)
        latest.phase = 'error'
        latest.error = localized !== key ? localized : (typeof data.message === 'string' && data.message !== '' ? data.message : t('err_UNKNOWN'))
        latest.controller = null
        notify(sessionId)
      } catch (error) {
        const latest = storeFor(sessionId)
        latest.controller = null
        const aborted = error instanceof DOMException && error.name === 'AbortError'
        latest.phase = 'error'
        latest.error = aborted ? t('err_ABORTED') : t('err_UPSTREAM')
        notify(sessionId)
      }
    })()
  }, [sessionId, actions, draft, t])

  const onCycleMode = React.useCallback(() => {
    setMode(getMode() === 'light' ? 'standard' : 'light')
    if (sessionId !== undefined) notify(sessionId)
  }, [sessionId])

  const title = busy
    ? t('buttonTitleBusy')
    : commandOnly ? t('commandOnlyTitle') : split.command !== '' ? t('buttonTitleCommand') : t('buttonTitle')
  const modeLabel = mode === 'light' ? t('modeLight') : t('modeStandard')

  const isDisabled = !busy && (blocked || actions === null)

  // Layer order matters and is documented in styles.ts. There is deliberately NO light
  // layer outside the pill: every light source is contained inside it, and the label is
  // the topmost element in the seat.
  return React.createElement('div', { className: 'dip-root' },
    React.createElement('span', {
      className: 'dip-seat',
      'data-busy': busy ? 'true' : 'false',
    },
    React.createElement('button', {
      type: 'button',
      className: 'dip-btn',
      disabled: isDisabled,
      'data-busy': busy ? 'true' : 'false',
      'aria-label': t('buttonAria'),
      title,
      onClick,
    },
    React.createElement('span', { className: 'dip-aurora', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'dip-ring', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'dip-spark', 'aria-hidden': 'true' }),
    Sparkle(),
    React.createElement('span', { className: 'dip-label' }, modeLabel),
    ),
    ),
    React.createElement('button', {
      type: 'button',
      className: 'dip-chevron',
      'aria-label': t('modeSwitchTitle'),
      title: (mode === 'light' ? t('modeLightHint') : t('modeStandardHint')) + ' · ' + t('modeSwitchTitle'),
      onClick: onCycleMode,
    }, '\u25BE'),
  )
}

/** Human-readable certificate: "保真 12/12 · 1.4x · 2.1s". */
function certificate(meta: Meta, t: TFn): string {
  const parts: string[] = []
  if (meta.anchors.total > 0) {
    parts.push(t('fidelity') + ' ' + String(meta.anchors.kept) + '/' + String(meta.anchors.total))
  }
  parts.push(meta.ratioLabel)
  parts.push((Math.round(meta.elapsedMs / 100) / 10).toFixed(1) + 's')
  if (meta.contextUsed !== 'none') parts.push(t('contextTag'))
  return parts.join(' \u00b7 ')
}

/**
 * Status and undo bar, rendered above the composer card. Reads the store directly,
 * so it needs no slot props beyond the session id.
 */
export function StatusBar(props: { sessionId?: string; t: TFn }): React.ReactElement | null {
  const { sessionId, t } = props
  useSessionState(sessionId)
  const state = sessionId !== undefined ? storeFor(sessionId) : null
  const phase = state !== null ? state.phase : 'idle'
  const token = state !== null ? [state.enhanced.length, state.error ?? '', state.meta !== null ? state.meta.elapsedMs : 0].join(':') : ''

  React.useEffect(() => {
    if (sessionId === undefined) return undefined
    if (phase !== 'done' && phase !== 'error') return undefined
    const ms = phase === 'done' ? 8000 : 6000
    const timer = window.setTimeout(() => { clear(sessionId) }, ms)
    return () => { window.clearTimeout(timer) }
  }, [sessionId, phase, token])

  if (sessionId === undefined || state === null || phase === 'idle' || phase === 'busy') return null

  if (phase === 'error') {
    return React.createElement('div', { className: 'dip-bar', 'data-kind': 'error' },
      React.createElement('span', { className: 'dip-bar-text' }, state.error !== null ? state.error : t('err_UNKNOWN')),
    )
  }

  const meta = state.meta
  const onUndo = (): void => {
    const actions = state.actions
    const backup = state.backup
    clear(sessionId)
    if (actions !== null) actions.setDraft(backup)
  }

  const note = meta !== null && meta.note !== '' ? t('preserved') + ' ' + meta.note : ''

  return React.createElement('div', { className: 'dip-bar' },
    React.createElement('span', { className: 'dip-bar-text' },
      t('done') + (meta !== null ? ' \u00b7 ' + certificate(meta, t) : '') + (note !== '' ? ' \u00b7 ' + note : '')),
    React.createElement('button', { type: 'button', className: 'dip-undo', title: t('undoTitle'), onClick: onUndo }, t('undo')),
  )
}
