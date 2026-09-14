/**
 * One streaming model call: route resolution, cancellation, timeout, and text
 * assembly. Deliberately NOT a pipeline — a single call, optionally followed by at
 * most one repair call driven by the deterministic gates.
 *
 * The llm service is addressed STRUCTURALLY (type-only import + an inline message
 * object) rather than through a runtime import of `@deepseek-ai/dsh-llm`. A plugin
 * installed with its own copy of that package would otherwise resolve a different
 * version than the running host, and the two copies need not agree on the message
 * object. Type-only imports are erased at emit, so the built plugin carries no
 * runtime dependency on the harness at all.
 *
 * @module dsh-improve-prompt/llm-call
 */
import type { GenerateOptions, StreamChunk } from '@deepseek-ai/dsh-llm';
import type { ResolvedConfig } from './config.js';
/** The slice of `ctx.llm` this plugin uses. */
export interface LlmFace {
    stream(options: GenerateOptions): AsyncIterable<StreamChunk>;
}
/** One resolved provider/model route. */
export interface Route {
    readonly provider: string;
    readonly model: string;
}
/** Why a call produced no usable text. */
export type CallFailure = {
    readonly code: 'ABORTED';
} | {
    readonly code: 'TIMEOUT';
} | {
    readonly code: 'EMPTY';
} | {
    readonly code: 'TOOL_CALL';
} | {
    readonly code: 'UPSTREAM';
    readonly message: string;
};
/** Outcome of one call. */
export type CallResult = {
    readonly ok: true;
    readonly text: string;
} | {
    readonly ok: false;
    readonly failure: CallFailure;
};
/** What to ask the model for. */
export interface CallRequest {
    readonly route: Route;
    readonly system: string;
    readonly userMessage: string;
    readonly config: ResolvedConfig;
    readonly signal: AbortSignal;
}
/** Reason a route could not be resolved. */
export declare class NoRouteError extends Error {
    constructor();
}
/**
 * Resolve the route for one call, in precedence order: explicit config pair, then
 * the harness default-model selection, then the last route seen on the live
 * `llm/stream` waterfall.
 *
 * @param config - resolved configuration.
 * @param defaults - the `agentDefaultModel` selection, or undefined.
 * @param lastSeen - route captured from the most recent real model call, or null.
 * @returns the route to use.
 * @throws {NoRouteError} when nothing is available.
 */
export declare function resolveRoute(config: ResolvedConfig, defaults: {
    provider?: unknown;
    model?: unknown;
} | undefined, lastSeen: Route | null): Route;
/**
 * Run one model call and assemble its text.
 *
 * Cancellation and timeout both abort the underlying stream, and an aborted call
 * yields no text at all — so a cancelled enhancement can never half-replace the
 * user's draft.
 *
 * @param llm - the llm service.
 * @param request - route, prompts, config, and caller signal.
 * @returns the assembled text or a typed failure.
 */
export declare function callModel(llm: LlmFace, request: CallRequest): Promise<CallResult>;
