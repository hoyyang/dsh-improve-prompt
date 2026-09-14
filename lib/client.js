window.__ModuleLoader__.load({
	id: "dsh-improve-prompt",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		//#region src/client/store.ts
		const states = /* @__PURE__ */ new Map();
		const listeners = /* @__PURE__ */ new Map();
		const MODE_KEY = "dsh-improve-prompt:mode";
		let cachedMode = null;
		/** Current mode, persisted across reloads. */
		function getMode() {
			if (cachedMode !== null) return cachedMode;
			let stored = null;
			try {
				stored = window.localStorage.getItem(MODE_KEY);
			} catch {
				stored = null;
			}
			cachedMode = stored === "light" ? "light" : "standard";
			return cachedMode;
		}
		/** Persist a new mode. */
		function setMode(mode) {
			cachedMode = mode;
			try {
				window.localStorage.setItem(MODE_KEY, mode);
			} catch {}
		}
		function fresh() {
			return {
				phase: "idle",
				backup: "",
				enhanced: "",
				meta: null,
				error: null,
				controller: null,
				actions: null
			};
		}
		/** State for one session, created on first use. */
		function storeFor(sessionId) {
			let state = states.get(sessionId);
			if (state === void 0) {
				state = fresh();
				states.set(sessionId, state);
			}
			return state;
		}
		/** Subscribe to changes for one session. */
		function subscribe(sessionId, listener) {
			let set = listeners.get(sessionId);
			if (set === void 0) {
				set = /* @__PURE__ */ new Set();
				listeners.set(sessionId, set);
			}
			set.add(listener);
			return () => {
				set?.delete(listener);
			};
		}
		/** Publish a change for one session. */
		function notify(sessionId) {
			const set = listeners.get(sessionId);
			if (set === void 0) return;
			for (const listener of set) try {
				listener();
			} catch {}
		}
		/**
		* Reset one session to idle, dropping any stale undo information.
		*
		* @param sessionId - the session to reset.
		* @param phase - the phase to land on.
		* @param error - message for the error phase.
		*/
		function clear(sessionId, phase = "idle", error = null) {
			const state = storeFor(sessionId);
			const actions = state.actions;
			state.phase = phase;
			state.error = error;
			state.backup = "";
			state.enhanced = "";
			state.meta = null;
			state.controller = null;
			state.actions = actions;
			notify(sessionId);
		}
		//#endregion
		//#region src/client/components.ts
		/**
		* The two visible pieces: the composer button and the status/undo bar.
		*
		* @module dsh-improve-prompt/client/components
		*/
		const API = "/dsh-improve-prompt/api/improve";
		/** Four-point sparkle — the same affordance WorkBuddy puts at the composer's corner. */
		function Sparkle() {
			return react.default.createElement("svg", {
				className: "dip-icon",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false"
			}, react.default.createElement("path", {
				d: "M8 1.2l1.35 3.9a2 2 0 001.25 1.25l3.9 1.35-3.9 1.35a2 2 0 00-1.25 1.25L8 14.8l-1.35-3.9a2 2 0 00-1.25-1.25L1.5 8.3l3.9-1.35A2 2 0 006.65 5.7L8 1.2z",
				fill: "currentColor"
			}));
		}
		/** Read the live draft, preferring the injected hook and falling back to a snapshot prop. */
		function readDraft(props) {
			if (typeof props.useInput === "function") {
				const value = props.useInput((state) => {
					const s = state;
					return s !== null && s !== void 0 && typeof s.draft === "string" ? s.draft : "";
				});
				if (typeof value === "string") return value;
			}
			const fallback = props.input !== void 0 ? props.input.draft : void 0;
			return typeof fallback === "string" ? fallback : "";
		}
		/** Force a re-render whenever this session's store entry changes. */
		function useSessionState(sessionId) {
			const [version, setVersion] = react.default.useState(0);
			react.default.useEffect(() => {
				if (sessionId === void 0) return void 0;
				return subscribe(sessionId, () => {
					setVersion((v) => v + 1);
				});
			}, [sessionId]);
			return version;
		}
		/**
		* Composer button: one click replaces the draft in place; a second click while
		* busy cancels. Disabled on an empty composer or a slash command.
		*/
		function ImproveButton(props) {
			const t = props.t;
			const sessionId = props.sessionId;
			useSessionState(sessionId);
			const draft = readDraft(props);
			const trimmed = draft.trim();
			const blocked = trimmed === "" || trimmed.startsWith("/");
			const state = sessionId !== void 0 ? storeFor(sessionId) : null;
			const busy = state !== null && state.phase === "busy";
			const actions = props.inputActions !== void 0 ? props.inputActions : state !== null ? state.actions : null;
			const mode = getMode();
			if (state !== null && props.inputActions !== void 0 && state.actions !== props.inputActions) state.actions = props.inputActions;
			const onClick = react.default.useCallback(() => {
				if (sessionId === void 0 || actions === null) return;
				const current = storeFor(sessionId);
				if (current.phase === "busy") {
					if (current.controller !== null) current.controller.abort();
					return;
				}
				const text = draft;
				if (text.trim() === "" || text.trimStart().startsWith("/")) return;
				const controller = new AbortController();
				current.controller = controller;
				current.phase = "busy";
				current.error = null;
				current.backup = text;
				current.meta = null;
				current.enhanced = "";
				notify(sessionId);
				(async () => {
					try {
						const data = await (await fetch(API, {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: JSON.stringify({
								sessionId,
								text,
								mode: getMode()
							}),
							signal: controller.signal
						})).json();
						const latest = storeFor(sessionId);
						if (data.ok === true && typeof data.text === "string" && data.text !== "") {
							latest.enhanced = data.text;
							latest.meta = data.meta !== void 0 ? data.meta : null;
							latest.phase = "done";
							latest.controller = null;
							actions.setDraft(data.text);
							notify(sessionId);
							return;
						}
						const key = "err_" + (typeof data.code === "string" ? data.code : "UNKNOWN");
						const localized = t(key);
						latest.phase = "error";
						latest.error = localized !== key ? localized : typeof data.message === "string" && data.message !== "" ? data.message : t("err_UNKNOWN");
						latest.controller = null;
						notify(sessionId);
					} catch (error) {
						const latest = storeFor(sessionId);
						latest.controller = null;
						const aborted = error instanceof DOMException && error.name === "AbortError";
						latest.phase = "error";
						latest.error = aborted ? t("err_ABORTED") : t("err_UPSTREAM");
						notify(sessionId);
					}
				})();
			}, [
				sessionId,
				actions,
				draft,
				t
			]);
			const onCycleMode = react.default.useCallback(() => {
				setMode(getMode() === "light" ? "standard" : "light");
				if (sessionId !== void 0) notify(sessionId);
			}, [sessionId]);
			const title = busy ? t("buttonTitleBusy") : t("buttonTitle");
			const modeLabel = mode === "light" ? t("modeLight") : t("modeStandard");
			return react.default.createElement("div", { className: "dip-root" }, react.default.createElement("button", {
				type: "button",
				className: "dip-btn",
				disabled: !busy && (blocked || actions === null),
				"data-busy": busy ? "true" : "false",
				"aria-label": t("buttonAria"),
				title,
				onClick
			}, Sparkle(), react.default.createElement("span", null, modeLabel)), react.default.createElement("button", {
				type: "button",
				className: "dip-chevron",
				"aria-label": t("modeSwitchTitle"),
				title: (mode === "light" ? t("modeLightHint") : t("modeStandardHint")) + " · " + t("modeSwitchTitle"),
				onClick: onCycleMode
			}, "▾"));
		}
		/** Human-readable certificate: "保真 12/12 · 1.4x · 2.1s". */
		function certificate(meta, t) {
			const parts = [];
			if (meta.anchors.total > 0) parts.push(t("fidelity") + " " + String(meta.anchors.kept) + "/" + String(meta.anchors.total));
			parts.push(meta.ratioLabel);
			parts.push((Math.round(meta.elapsedMs / 100) / 10).toFixed(1) + "s");
			if (meta.contextUsed !== "none") parts.push(t("contextTag"));
			return parts.join(" · ");
		}
		/**
		* Status and undo bar, rendered above the composer card. Reads the store directly,
		* so it needs no slot props beyond the session id.
		*/
		function StatusBar(props) {
			const { sessionId, t } = props;
			useSessionState(sessionId);
			const state = sessionId !== void 0 ? storeFor(sessionId) : null;
			const phase = state !== null ? state.phase : "idle";
			const token = state !== null ? [
				state.enhanced.length,
				state.error ?? "",
				state.meta !== null ? state.meta.elapsedMs : 0
			].join(":") : "";
			react.default.useEffect(() => {
				if (sessionId === void 0) return void 0;
				if (phase !== "done" && phase !== "error") return void 0;
				const ms = phase === "done" ? 8e3 : 6e3;
				const timer = window.setTimeout(() => {
					clear(sessionId);
				}, ms);
				return () => {
					window.clearTimeout(timer);
				};
			}, [
				sessionId,
				phase,
				token
			]);
			if (sessionId === void 0 || state === null || phase === "idle" || phase === "busy") return null;
			if (phase === "error") return react.default.createElement("div", {
				className: "dip-bar",
				"data-kind": "error"
			}, react.default.createElement("span", { className: "dip-bar-text" }, state.error !== null ? state.error : t("err_UNKNOWN")));
			const meta = state.meta;
			const onUndo = () => {
				const actions = state.actions;
				const backup = state.backup;
				clear(sessionId);
				if (actions !== null) actions.setDraft(backup);
			};
			const note = meta !== null && meta.note !== "" ? t("preserved") + " " + meta.note : "";
			return react.default.createElement("div", { className: "dip-bar" }, react.default.createElement("span", { className: "dip-bar-text" }, t("done") + (meta !== null ? " · " + certificate(meta, t) : "") + (note !== "" ? " · " + note : "")), react.default.createElement("button", {
				type: "button",
				className: "dip-undo",
				title: t("undoTitle"),
				onClick: onUndo
			}, t("undo")));
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Client-side copy (zh / en) registered through the harness locale service.
		* Host errors carry stable codes; the codes are translated here so the message
		* matches the interface language rather than the host's.
		*
		* @module dsh-improve-prompt/client/locales
		*/
		/** Locale namespace. */
		const NS = "dsh-improve-prompt";
		const zh = {
			buttonAria: "把草稿改写为更清晰、更贴 Agent 执行的提示词",
			buttonTitle: "一键增强提示词（直接替换，可撤回）",
			buttonTitleBusy: "正在增强…点击取消",
			modeLight: "轻",
			modeStandard: "标准",
			modeSwitchTitle: "切换档位",
			modeLightHint: "轻档：只去废话、消歧义，几乎不改结构",
			modeStandardHint: "标准档：结构化重述，让 Agent 能直接执行",
			undo: "撤回",
			undoTitle: "恢复增强前的原文",
			done: "已增强",
			canceled: "已取消，原文未改动",
			fidelity: "保真",
			contextTag: "已参考会话",
			preserved: "已回灌",
			err_EMPTY: "输入框为空",
			err_COMMAND: "斜杠命令不参与改写",
			err_TOO_LONG: "草稿过长",
			err_BAD_BODY: "请求格式错误",
			err_NO_ROUTE: "未找到可用模型：请先在设置里选默认模型",
			err_TIMEOUT: "增强超时，原文未改动",
			err_ABORTED: "已取消，原文未改动",
			err_EMPTY_OUTPUT: "模型没有返回内容，原文未改动",
			err_TOOL_CALL: "模型返回了工具调用而非提示词，原文未改动",
			err_LENGTH_EXCEEDED: "增强结果超出长度上限，已保留原文（可切「轻」档或调高上限）",
			err_UPSTREAM: "模型调用失败，原文未改动",
			err_UNKNOWN: "增强失败，原文未改动"
		};
		const en = {
			buttonAria: "Rewrite the draft into a sharper, agent-ready prompt",
			buttonTitle: "Improve prompt (replaces in place, undoable)",
			buttonTitleBusy: "Improving… click to cancel",
			modeLight: "Light",
			modeStandard: "Standard",
			modeSwitchTitle: "Switch mode",
			modeLightHint: "Light: remove filler and ambiguity, keep the structure",
			modeStandardHint: "Standard: restructure so an agent can execute it directly",
			undo: "Undo",
			undoTitle: "Restore the draft from before the enhancement",
			done: "Improved",
			canceled: "Cancelled — draft untouched",
			fidelity: "fidelity",
			contextTag: "context used",
			preserved: "re-appended",
			err_EMPTY: "The composer is empty",
			err_COMMAND: "Slash commands are not rewritten",
			err_TOO_LONG: "Draft is too long",
			err_BAD_BODY: "Malformed request",
			err_NO_ROUTE: "No model available — pick a default model in settings first",
			err_TIMEOUT: "Enhancement timed out — draft untouched",
			err_ABORTED: "Cancelled — draft untouched",
			err_EMPTY_OUTPUT: "The model returned nothing — draft untouched",
			err_TOOL_CALL: "The model returned a tool call instead of a prompt — draft untouched",
			err_LENGTH_EXCEEDED: "Result exceeded the length ceiling — draft kept (try Light mode or raise the ceiling)",
			err_UPSTREAM: "Model call failed — draft untouched",
			err_UNKNOWN: "Enhancement failed — draft untouched"
		};
		//#endregion
		//#region src/client/styles.ts
		/**
		* Plugin-owned CSS, scoped by a data attribute and torn down with the fiber.
		*
		* @module dsh-improve-prompt/client/styles
		*/
		const STYLE_ATTR = "dsh-improve-prompt";
		const css = [
			".dip-root{display:inline-flex;align-items:center;gap:2px;flex:none}",
			".dip-btn{height:28px;min-width:28px;padding:0 6px;display:inline-flex;align-items:center;gap:4px;",
			"cursor:pointer;background:0 0;border:1px solid transparent;border-radius:24px;outline:none;",
			"color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:20px;",
			"transition:background-color .12s ease,color .12s ease,border-color .12s ease}",
			".dip-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dip-btn:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}",
			".dip-btn:disabled{color:var(--dsw-alias-label-dimmed);cursor:default;opacity:.55}",
			".dip-btn[data-busy=\"true\"]{color:var(--dsw-alias-label-primary)}",
			".dip-icon{width:14px;height:14px;flex:none;display:block}",
			".dip-btn[data-busy=\"true\"] .dip-icon{animation:dip-spin 1s linear infinite}",
			"@keyframes dip-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}",
			".dip-chevron{height:22px;width:16px;padding:0;display:inline-flex;align-items:center;justify-content:center;",
			"cursor:pointer;background:0 0;border:0;border-radius:6px;outline:none;color:var(--dsw-alias-label-dimmed);font-size:9px}",
			".dip-chevron:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dip-bar{display:flex;align-items:center;gap:8px;margin:0 auto 6px;max-width:100%;padding:5px 10px;",
			"border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));",
			"font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);box-shadow:0 1px 3px rgba(0,0,0,.06)}",
			".dip-bar[data-kind=\"error\"]{border-color:rgba(220,90,70,.5);color:var(--dsw-alias-label-primary)}",
			".dip-bar-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dip-sep{opacity:.4}",
			".dip-undo{margin-left:2px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;",
			"background:0 0;color:inherit;font-size:12px;cursor:pointer;outline:none;font-weight:500}",
			".dip-undo:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}"
		].join("\n");
		//#endregion
		//#region src/client/index.ts
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
		/** Required client services. */
		const inject = ["slots", "locale"];
		/**
		* Attach the client half.
		*
		* @param ctx - client context carrying `slots` and `locale`.
		*/
		function apply(ctx) {
			let t = (key) => en[key] !== void 0 ? en[key] : key;
			ctx.effect(() => {
				if (typeof document === "undefined") return void 0;
				document.querySelectorAll("style[data-plugin=\"" + STYLE_ATTR + "\"]").forEach((node) => {
					node.remove();
				});
				const style = document.createElement("style");
				style.dataset.plugin = STYLE_ATTR;
				style.textContent = css;
				document.head.appendChild(style);
				return () => {
					style.remove();
				};
			}, "dsh-improve-prompt: styles");
			if (ctx.locale !== void 0) {
				ctx.effect(() => ctx.locale.register(NS, {
					zh,
					en
				}), "dsh-improve-prompt: locale");
				try {
					t = ctx.locale.bind(NS);
				} catch (error) {
					console.error("[dsh-improve-prompt] locale bind failed; using the built-in English copy", error);
				}
			} else console.error("[dsh-improve-prompt] no locale service; using the built-in English copy");
			if (ctx.slots === void 0) {
				console.error("[dsh-improve-prompt] no slots service; composer entries not registered");
				return;
			}
			ctx.effect(() => {
				try {
					return ctx.slots.inject("conversation.input.right", function* () {
						yield ctx.slots.register({
							name: "conversation.input.right",
							id: "dsh-improve-prompt-button",
							order: 40,
							locale: NS,
							inject: (sessionId) => ({ sessionId })
						}, (slotProps) => react.default.createElement(ImproveButton, Object.assign({}, slotProps, { t })));
					});
				} catch (error) {
					console.error("[dsh-improve-prompt] button slot registration failed", error);
					return () => {};
				}
			}, "dsh-improve-prompt: composer button");
			ctx.effect(() => {
				try {
					return ctx.slots.inject("conversation.input.dock", function* () {
						yield ctx.slots.register({
							name: "conversation.input.dock",
							id: "dsh-improve-prompt-bar",
							order: 40,
							locale: NS,
							inject: (sessionId) => ({ sessionId })
						}, (slotProps) => react.default.createElement(StatusBar, {
							sessionId: slotProps !== void 0 && typeof slotProps.sessionId === "string" ? slotProps.sessionId : void 0,
							t
						}));
					});
				} catch (error) {
					console.error("[dsh-improve-prompt] status bar slot registration failed", error);
					return () => {};
				}
			}, "dsh-improve-prompt: status bar");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map