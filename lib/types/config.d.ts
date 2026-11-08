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
/** Enhancement mode. */
export type Mode = 'light' | 'standard';
/** Runtime configuration after defaults are applied. */
export interface ResolvedConfig {
    readonly defaultMode: Mode;
    readonly lightMaxRatio: number;
    readonly standardMaxRatio: number;
    readonly acceptanceCriteria: boolean;
    readonly temperature: number;
    readonly maxTokens: number;
    readonly timeoutMs: number;
    readonly maxInputChars: number;
    readonly contextTurns: number;
    readonly contextChars: number;
    readonly smartContext: boolean;
    readonly fidelityGate: boolean;
    readonly lengthGate: boolean;
    readonly provider: string;
    readonly model: string;
    readonly reasoningEffort: string;
    readonly logFailures: boolean;
}
/**
 * Apply defaults and reject nonsense without ever throwing at the user.
 *
 * A misconfigured plugin must still load: every field falls back independently.
 *
 * @param raw - config as handed to `apply` by the loader (possibly undefined).
 * @returns a complete, safe configuration.
 */
export declare function resolveConfig(raw: unknown): ResolvedConfig;
/** Ceiling for one mode. */
export declare function maxRatioFor(config: ResolvedConfig, mode: Mode): number;
/** `$DSH_HOME` (honouring an explicit env var) — web processes can disagree with homedir(). */
export declare function dshHome(): string;
