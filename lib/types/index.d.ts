/**
 * dsh-improve-prompt — host half.
 *
 * One loopback route that rewrites a composer draft into a sharper, agent-ready
 * prompt, wrapped in two deterministic gates that no other prompt enhancer in the
 * ecosystem has:
 *
 * - **fidelity gate** — extracts the draft's hard facts (paths, identifiers,
 *   numbers, URLs, code, @references) and verifies each one literally survived the
 *   rewrite; a dropped fact triggers exactly one repair call, then a deterministic
 *   re-append, so nothing is ever silently lost.
 * - **length gate** — refuses to let a one-line request become a specification,
 *   matching WorkBuddy's own "less filler, fewer tokens" positioning.
 *
 * At most TWO model calls per click (one generation + one repair), never a pipeline.
 *
 * @module dsh-improve-prompt
 */
import type { Context } from 'cordis';
/** Cordis plugin name. */
export declare const name = "dsh-improve-prompt";
/** Required services: the model registry and the HTTP carrier. */
export declare const inject: string[];
export { Config } from './config.js';
/**
 * Attach the plugin.
 *
 * @param ctx - cordis context carrying `llm` and `webServer`.
 * @param rawConfig - loader-supplied configuration (all keys optional).
 */
export declare function apply(ctx: Context, rawConfig: unknown): void;
