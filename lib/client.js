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
		//#region src/command.ts
		/** `/name` — letters, digits, underscore, hyphen; the shape the composer claims. */
		const COMMAND_RE = /^(\s*)\/([A-Za-z0-9_][A-Za-z0-9_-]*)([ \t]*)([\s\S]*)$/;
		/**
		* Split a draft into its command prefix and its body.
		*
		* A bare `/`, a command with no body, and a non-command draft all resolve to a body
		* of `''` or the whole text respectively, so callers can treat `body === ''` as
		* "nothing to enhance" without re-deriving the rule.
		*
		* @param draft - the raw composer text.
		* @returns the prefix, the command token, and the body.
		*/
		function splitCommand(draft) {
			const text = typeof draft === "string" ? draft : "";
			const match = COMMAND_RE.exec(text);
			if (match === null) {
				const bare = text.trim();
				if (/^\/+$/.test(bare)) return {
					prefix: bare,
					command: bare,
					body: ""
				};
				return {
					prefix: "",
					command: "",
					body: bare
				};
			}
			const lead = match[1] ?? "";
			const name = match[2] ?? "";
			const gap = match[3] ?? "";
			const rest = match[4] ?? "";
			const restLead = /^\s*/.exec(rest)?.[0] ?? "";
			const body = rest.trim();
			if (body === "" || /^\/+$/.test(body)) return {
				prefix: lead + "/" + name,
				command: "/" + name,
				body: ""
			};
			const separator = gap + restLead === "" ? " " : gap + restLead;
			return {
				prefix: lead + "/" + name + separator,
				command: "/" + name,
				body
			};
		}
		//#endregion
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
			const split = splitCommand(draft);
			const commandOnly = split.command !== "" && split.body === "";
			const blocked = split.body === "";
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
				if (splitCommand(text).body === "") return;
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
			const title = busy ? t("buttonTitleBusy") : commandOnly ? t("commandOnlyTitle") : split.command !== "" ? t("buttonTitleCommand") : t("buttonTitle");
			const modeLabel = mode === "light" ? t("modeLight") : t("modeStandard");
			const isDisabled = !busy && (blocked || actions === null);
			return react.default.createElement("div", { className: "dip-root" }, react.default.createElement("span", {
				className: "dip-seat",
				"data-busy": busy ? "true" : "false"
			}, react.default.createElement("span", {
				className: "dip-fx",
				"aria-hidden": "true"
			}, react.default.createElement("span", { className: "dip-halo" })), react.default.createElement("button", {
				type: "button",
				className: "dip-btn",
				disabled: isDisabled,
				"data-busy": busy ? "true" : "false",
				"aria-label": t("buttonAria"),
				title,
				onClick
			}, react.default.createElement("span", {
				className: "dip-spark",
				"aria-hidden": "true"
			}), Sparkle(), react.default.createElement("span", { className: "dip-label" }, modeLabel))), react.default.createElement("button", {
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
			buttonTitleCommand: "一键增强提示词（保留斜杠命令前缀，只改写正文）",
			commandOnlyTitle: "斜杠命令后还没有正文，无可改写内容",
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
			err_COMMAND: "斜杠命令后没有可改写的正文",
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
			buttonTitleCommand: "Improve prompt (keeps the slash-command prefix, rewrites only the body)",
			commandOnlyTitle: "Nothing to rewrite yet — this is only a slash command",
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
			err_COMMAND: "A slash command with no body has nothing to rewrite",
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
		const STYLE_ATTR = "dsh-improve-prompt";
		/** Durations in one place, so the reduced-motion block can neutralise them together. */
		const D = {
			breathe: "7s",
			haloSpin: "2.4s",
			ringSpin: "1.9s",
			borderSpin: "2.6s",
			iconSpin: "1s"
		};
		const css = [
			"@property --dip-a{syntax:\"<angle>\";initial-value:0deg;inherits:false}",
			".dip-root{display:inline-flex;align-items:center;gap:2px;flex:none}",
			".dip-seat{position:relative;display:inline-flex;isolation:isolate}",
			".dip-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:visible}",
			".dip-halo{position:absolute;inset:-6px;background:url(data:image/png;base64,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) center/100% 100% no-repeat;",
			"opacity:0;transition:opacity .3s ease;will-change:opacity}",
			".dip-seat[data-busy=\"true\"] .dip-halo{animation:dip-halo-pulse 1.6s ease-in-out infinite}",
			".dip-spark{position:absolute;left:1px;top:50%;width:24px;height:24px;transform:translateY(-50%);z-index:1;",
			"background:url(data:image/png;base64,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) center/contain no-repeat;opacity:.4;pointer-events:none;",
			"transition:opacity .26s ease,transform .3s cubic-bezier(.22,1,.36,1)}",
			".dip-btn{position:relative;z-index:1;height:28px;min-width:28px;padding:0 8px;display:inline-flex;",
			"align-items:center;gap:5px;cursor:pointer;background:0 0;border:1px solid transparent;border-radius:24px;",
			"outline:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:20px;",
			"transition:background-color .18s ease,color .18s ease,border-color .18s ease,transform .12s cubic-bezier(.22,1,.36,1);",
			"will-change:transform}",
			".dip-label{position:relative;z-index:2;white-space:nowrap}",
			".dip-btn:hover:not(:disabled){background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));",
			"color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}",
			".dip-btn:hover:not(:disabled) .dip-label{text-shadow:0 1px 1px rgba(0,0,0,.26)}",
			".dip-seat:hover .dip-spark{opacity:.95;transform:translateY(-50%) scale(1.12) rotate(90deg)}",
			".dip-seat:hover .dip-btn:not(:disabled) .dip-icon{filter:drop-shadow(0 0 5px rgba(56,189,248,.85));transform:scale(1.08)}",
			".dip-btn::after{content:\"\";position:absolute;inset:-1px;border-radius:inherit;padding:1px;opacity:0;",
			"background:conic-gradient(from var(--dip-a,0deg),rgba(56,189,248,0),rgba(56,189,248,.95),rgba(245,197,66,.9),rgba(43,108,255,.95),rgba(56,189,248,0));",
			"-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);",
			"mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);",
			"-webkit-mask-composite:xor;mask-composite:exclude;",
			"transition:opacity .22s ease;pointer-events:none}",
			".dip-btn:hover:not(:disabled)::after{opacity:.95;animation:dip-border-spin " + D.borderSpin + " linear infinite}",
			".dip-btn:active:not(:disabled){transform:scale(.955)}",
			".dip-seat:active .dip-spark{opacity:1;transform:translateY(-50%) scale(.9)}",
			".dip-btn:active:not(:disabled)::after{opacity:1;animation-duration:1.1s}",
			".dip-btn[data-busy=\"true\"]{color:var(--dsw-alias-label-primary);",
			"background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));border-color:transparent}",
			".dip-btn[data-busy=\"true\"]::after{opacity:1;animation:dip-border-spin 1.4s linear infinite}",
			".dip-btn[data-busy=\"true\"] .dip-label{text-shadow:0 1px 1px rgba(0,0,0,.3)}",
			".dip-btn[data-busy=\"true\"] .dip-icon{animation:dip-icon-spin " + D.iconSpin + " linear infinite;",
			"filter:drop-shadow(0 0 5px rgba(56,189,248,.8))}",
			".dip-seat[data-busy=\"true\"] .dip-spark{opacity:.9;animation:dip-spark-breathe 1.5s ease-in-out infinite}",
			".dip-btn:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}",
			".dip-btn:disabled{color:var(--dsw-alias-label-secondary);cursor:default;opacity:.82}",
			".dip-btn:disabled::after{content:none}",
			".dip-seat:has(.dip-btn:disabled) .dip-halo{opacity:0;animation:none}",
			".dip-seat:has(.dip-btn:disabled) .dip-spark{opacity:.12;animation:none}",
			".dip-icon{width:14px;height:14px;flex:none;display:block;position:relative;z-index:2;",
			"transition:transform .2s cubic-bezier(.22,1,.36,1),filter .2s ease}",
			".dip-chevron{position:relative;z-index:1;height:22px;width:16px;padding:0;display:inline-flex;align-items:center;",
			"justify-content:center;cursor:pointer;background:0 0;border:0;border-radius:6px;outline:none;",
			"color:var(--dsw-alias-label-dimmed);font-size:9px;transition:background-color .15s ease,color .15s ease,transform .12s ease}",
			".dip-chevron:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dip-chevron:active{transform:scale(.92)}",
			".dip-bar{display:flex;align-items:center;gap:8px;margin:0 auto 6px;max-width:100%;padding:5px 10px;",
			"border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base));",
			"font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);box-shadow:0 1px 3px rgba(0,0,0,.06)}",
			".dip-bar[data-kind=\"error\"]{border-color:rgba(220,90,70,.5);color:var(--dsw-alias-label-primary)}",
			".dip-bar-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dip-sep{opacity:.4}",
			".dip-undo{margin-left:2px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;",
			"background:0 0;color:inherit;font-size:12px;cursor:pointer;outline:none;font-weight:500;",
			"transition:background-color .15s ease,color .15s ease,transform .12s ease}",
			".dip-undo:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dip-undo:active{transform:scale(.95)}",
			"@keyframes dip-icon-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}",
			"@keyframes dip-halo-pulse{0%,100%{opacity:.55}50%{opacity:.95}}",
			"@keyframes dip-spark-breathe{0%,100%{opacity:.55;transform:translateY(-50%) scale(.94)}50%{opacity:1;transform:translateY(-50%) scale(1.16)}}",
			"@keyframes dip-border-spin{from{--dip-a:0deg}to{--dip-a:360deg}}",
			"@media (prefers-reduced-motion: reduce){",
			".dip-halo,.dip-btn,.dip-btn::after,.dip-icon,.dip-spark,.dip-chevron,.dip-undo{animation:none!important;",
			"transition-duration:.01ms!important}",
			".dip-seat:hover .dip-spark{opacity:.95;transform:translateY(-50%) scale(1.12) rotate(90deg)}",
			".dip-seat[data-busy=\"true\"] .dip-halo{opacity:.85}",
			".dip-seat[data-busy=\"true\"] .dip-spark{opacity:.9}",
			".dip-btn:hover:not(:disabled)::after{opacity:.95}",
			"}"
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