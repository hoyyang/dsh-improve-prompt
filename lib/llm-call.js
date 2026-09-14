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
/** Reason a route could not be resolved. */
export class NoRouteError extends Error {
    constructor() {
        super('dsh-improve-prompt: no provider/model route available (set config.provider+config.model, or send one message in this session first)');
        this.name = 'NoRouteError';
    }
}
let messageSeq = 0;
/**
 * Build the one user message for a one-shot call, shape-complete for the host's
 * `Message` contract without importing the constructor.
 *
 * @param text - the full user-message body.
 * @returns a frozen user message.
 */
function userMessage(text) {
    messageSeq += 1;
    return Object.freeze({
        id: 'dsh-improve-prompt-' + String(messageSeq),
        role: 'user',
        content: [Object.freeze({ type: 'text', text })],
        source: Object.freeze({ kind: 'user' }),
    });
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
export function resolveRoute(config, defaults, lastSeen) {
    if (config.provider !== '' && config.model !== '')
        return { provider: config.provider, model: config.model };
    const provider = defaults !== undefined && typeof defaults.provider === 'string' ? defaults.provider.trim() : '';
    const model = defaults !== undefined && typeof defaults.model === 'string' ? defaults.model.trim() : '';
    if (provider !== '' && model !== '')
        return { provider, model };
    if (lastSeen !== null)
        return lastSeen;
    throw new NoRouteError();
}
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
export async function callModel(llm, request) {
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => { controller.abort(); };
    request.signal.addEventListener('abort', onAbort, { once: true });
    const timer = request.config.timeoutMs > 0
        ? setTimeout(() => { timedOut = true; controller.abort(); }, request.config.timeoutMs)
        : null;
    let text = '';
    let sawToolCall = false;
    try {
        const options = {
            provider: request.route.provider,
            model: request.route.model,
            system: request.system,
            messages: [userMessage(request.userMessage)],
            temperature: request.config.temperature,
            maxTokens: request.config.maxTokens,
            signal: controller.signal,
        };
        // Only send a reasoning effort when the user asked for one: gateways disagree
        // on whether they accept the parameter at all.
        if (request.config.reasoningEffort !== '') {
            ;
            options.reasoningEffort = request.config.reasoningEffort;
        }
        const iterator = llm.stream(options)[Symbol.asyncIterator]();
        let finished = false;
        try {
            while (finished === false) {
                const step = await iterator.next();
                if (step.done === true)
                    break;
                const chunk = step.value;
                if (chunk.type === 'text-delta')
                    text += chunk.text;
                else if (chunk.type === 'tool-call-delta')
                    sawToolCall = true;
                else if (chunk.type === 'finish')
                    finished = true;
            }
        }
        finally {
            // Release the upstream stream on every exit path, including cancellation.
            if (typeof iterator.return === 'function') {
                try {
                    await iterator.return(undefined);
                }
                catch { /* the stream is already settling */ }
            }
        }
    }
    catch (error) {
        if (timedOut)
            return { ok: false, failure: { code: 'TIMEOUT' } };
        if (request.signal.aborted)
            return { ok: false, failure: { code: 'ABORTED' } };
        return { ok: false, failure: { code: 'UPSTREAM', message: error instanceof Error ? error.message : String(error) } };
    }
    finally {
        if (timer !== null)
            clearTimeout(timer);
        request.signal.removeEventListener('abort', onAbort);
    }
    if (timedOut)
        return { ok: false, failure: { code: 'TIMEOUT' } };
    if (request.signal.aborted)
        return { ok: false, failure: { code: 'ABORTED' } };
    if (sawToolCall && text.trim() === '')
        return { ok: false, failure: { code: 'TOOL_CALL' } };
    if (text.trim() === '')
        return { ok: false, failure: { code: 'EMPTY' } };
    return { ok: true, text };
}
//# sourceMappingURL=llm-call.js.map