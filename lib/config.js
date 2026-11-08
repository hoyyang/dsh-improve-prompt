/**
 * Plugin configuration: defaults and defensive resolution.
 *
 * Deliberately no runtime dependency: the published host half must import with
 * nothing but Node builtins, because a DSH profile installs bundles through
 * pnpm with `autoInstallPeers: false`, so a peer package is simply absent at
 * boot (that exact failure — `Cannot find package 'schemastery'` — stopped
 * dsh-improve-prompt 0.7.2 from loading in market installs). Every key below is
 * coerced here instead of by a loader schema; invalid values fall back to the
 * default rather than failing startup.
 *
 * @module dsh-improve-prompt/config
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
function pickMode(value, fallback) {
    return value === 'light' || value === 'standard' ? value : fallback;
}
function positive(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}
function nonNegative(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}
function flag(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}
/**
 * Apply defaults and reject nonsense without ever throwing at the user.
 *
 * A misconfigured plugin must still load: every field falls back independently.
 *
 * @param raw - config as handed to `apply` by the loader (possibly undefined).
 * @returns a complete, safe configuration.
 */
export function resolveConfig(raw) {
    const c = (raw !== null && typeof raw === 'object' ? raw : {});
    return {
        defaultMode: pickMode(c.defaultMode, 'standard'),
        lightMaxRatio: positive(c.lightMaxRatio, 1.2),
        standardMaxRatio: positive(c.standardMaxRatio, 2.5),
        acceptanceCriteria: flag(c.acceptanceCriteria, false),
        temperature: nonNegative(c.temperature, 0.3),
        maxTokens: positive(c.maxTokens, 8192),
        timeoutMs: positive(c.timeoutMs, 180000),
        maxInputChars: positive(c.maxInputChars, 20000),
        contextTurns: nonNegative(c.contextTurns, 3),
        contextChars: nonNegative(c.contextChars, 6000),
        smartContext: flag(c.smartContext, true),
        fidelityGate: flag(c.fidelityGate, true),
        lengthGate: flag(c.lengthGate, true),
        provider: text(c.provider),
        model: text(c.model),
        reasoningEffort: text(c.reasoningEffort) !== '' ? text(c.reasoningEffort) : 'low',
        logFailures: flag(c.logFailures, true),
    };
}
/** Ceiling for one mode. */
export function maxRatioFor(config, mode) {
    return mode === 'light' ? config.lightMaxRatio : config.standardMaxRatio;
}
/** `$DSH_HOME` (honouring an explicit env var) — web processes can disagree with homedir(). */
export function dshHome() {
    const fromEnv = process.env.DSH_HOME;
    return fromEnv !== undefined && fromEnv !== '' ? fromEnv : join(homedir(), '.dsh');
}
//# sourceMappingURL=config.js.map