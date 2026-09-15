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
		/**
		* Four-point sparkle — the same affordance WorkBuddy puts at the composer's corner.
		*
		* Filled with the plugin's own cyan-to-gold gradient rather than a flat colour. The
		* gradient is defined inside the SVG (browsers resolve the first matching id for every
		* instance, and every instance wants the same gradient), and it is only safe to use a
		* fixed bright gradient because the chip's plate is always dark in both themes.
		*/
		function Sparkle() {
			return react.default.createElement("svg", {
				className: "dip-icon",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				focusable: "false"
			}, react.default.createElement("defs", null, react.default.createElement("linearGradient", {
				id: "dip-spark-grad",
				x1: "0",
				y1: "0",
				x2: "1",
				y2: "1"
			}, react.default.createElement("stop", {
				offset: "0",
				stopColor: "#e8f6ff"
			}), react.default.createElement("stop", {
				offset: ".55",
				stopColor: "#38bdf8"
			}), react.default.createElement("stop", {
				offset: "1",
				stopColor: "#f5c542"
			}))), react.default.createElement("path", {
				d: "M8 1.2l1.35 3.9a2 2 0 001.25 1.25l3.9 1.35-3.9 1.35a2 2 0 00-1.25 1.25L8 14.8l-1.35-3.9a2 2 0 00-1.25-1.25L1.5 8.3l3.9-1.35A2 2 0 006.65 5.7L8 1.2z",
				fill: "url(#dip-spark-grad)"
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
			return react.default.createElement("div", {
				className: "dip-root",
				"data-busy": busy ? "true" : "false"
			}, react.default.createElement("span", {
				className: "dip-aurora",
				"aria-hidden": "true"
			}), react.default.createElement("span", {
				className: "dip-ring",
				"aria-hidden": "true"
			}), react.default.createElement("span", {
				className: "dip-arc",
				"aria-hidden": "true"
			}), react.default.createElement("button", {
				type: "button",
				className: "dip-btn",
				disabled: isDisabled,
				"aria-label": t("buttonAria") + " · " + modeLabel,
				title,
				onClick
			}, react.default.createElement("span", {
				className: "dip-spark",
				"aria-hidden": "true"
			}), Sparkle(), react.default.createElement("span", { className: "dip-label" }, modeLabel)), react.default.createElement("span", {
				className: "dip-divider",
				"aria-hidden": "true"
			}), react.default.createElement("button", {
				type: "button",
				className: "dip-chevron",
				"aria-label": t("modeSwitchTitle"),
				title: (mode === "light" ? t("modeLightHint") : t("modeStandardHint")) + " · " + t("modeSwitchTitle"),
				onClick: onCycleMode
			}, react.default.createElement("svg", {
				className: "dip-caret",
				viewBox: "0 0 12 10",
				width: "12",
				height: "10",
				"aria-hidden": "true",
				focusable: "false"
			}, react.default.createElement("path", {
				d: "M1.2 2.7H10.8M8.9 0.9L10.8 2.7L8.9 4.5M10.8 7.3H1.2M3.1 5.5L1.2 7.3L3.1 9.1",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}))), react.default.createElement("span", {
				className: "dip-burst",
				"aria-hidden": "true"
			}));
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
		* ## Material: ONE split glass chip that collapses to a star circle (v7)
		*
		* v6 fused the mode switch into the plate (one chip, two zones, hairline divider).
		* v7 makes the whole chip collapse to its 28px star circle when idle and expand back
		* to the full split pill on hover / keyboard focus / busy — with the RIGHT edge
		* pinned. Measured host fact (dsh-client-ui-conversation client.js:15757):
		* `.trailing{flex:none;gap:12px;margin-left:auto}` — the cluster's right edge is
		* anchored, so a real width change here shifts ONLY dsh-concise on the left by the
		* same delta and keeps the 12px gaps. dsh-concise needs no change; no overlay tricks.
		*
		* - **the plate is always dark** — `#061024 -> #0c2144` glass, in both themes.
		* - **the border is a conic gradient** — width-independent, every hue always on the rim.
		* - **the aurora lives inside the chip** — a cyan pool over the main action, an
		*   electric-blue pool over the switch zone, gold catching the lower edge.
		* - **collapse = content technique, not squish** — the label, divider and switch
		*   zone animate `max-width`/`opacity` (the dsh-concise label craft), the main
		*   zone animates `gap`/`padding`; the pill radius morphs circle <-> pill for free.
		*   No transform scaling anywhere on the chip: expansion IS the hover response.
		* - **the collapsed circle is state-aware** — a slow breathing glow plays while a
		*   draft is enhanceable (the disabled star stays dark and quiet).
		* - **press = energy, not geometry** — a shockwave ring expands from the star, the
		*   rim does one fast lap, the aurora pulses; the chip itself never scales.
		*
		* ## Layer order (the legibility guarantee)
		*
		* `.dip-root` — the chip; `overflow:hidden`, so nothing inside can escape it
		*   `.dip-aurora`  — contained washes, `z-index:0`, `pointer-events:none`
		*   `.dip-ring`    — conic gradient masked to the 1px border band, `z-index:1`
		*   `.dip-arc`     — busy-only energy bar on the bottom 2px, `z-index:1`
		*   `.dip-btn`     — main zone, `z-index:2`; spark (icon slot) + icon + label inside
		*   `.dip-divider` — hairline, `z-index:2`
		*   `.dip-chevron` — switch zone, `z-index:2`; `.dip-caret` glyph inside
		*   `.dip-burst`   — press shockwave, `z-index:1`, one-shot on `:active`
		*
		* No light source ever sits under a glyph: the spark owns the icon slot, the rim is
		* masked to the 1px border band, the energy bar occupies only the bottom 2px. The
		* plate never turns translucent, so label and caret contrast hold in both themes and
		* every state. `npm run harness:button` renders every state plus the boxes needed
		* to measure it from pixels, and a trailing-row simulation that proves the neighbor
		* reflow (dsh-concise shifts, our right edge stays).
		*
		* @module dsh-improve-prompt/client/styles
		*/
		const STYLE_ATTR = "dsh-improve-prompt";
		/** Contained light: a pool per zone plus the gold lower edge, all inside the chip. */
		const AURORA = [
			"radial-gradient(30% 62% at 16% 48%,rgba(34,211,238,.42),transparent 70%)",
			"radial-gradient(28% 62% at 62% 42%,rgba(37,99,235,.42),transparent 72%)",
			"radial-gradient(30% 64% at 96% 46%,rgba(43,108,255,.44),transparent 74%)",
			"radial-gradient(34% 70% at 62% 116%,rgba(245,197,66,.26),transparent 74%)",
			"radial-gradient(130% 160% at 50% 50%,rgba(6,20,48,.66),transparent 80%)"
		].join(",");
		/** Idle shadow stack (also the base the hover stack is written against). */
		const SHADOW_IDLE = [
			"0 0 0 1px rgba(56,189,248,.22)",
			"0 2px 12px rgba(43,108,255,.34)",
			"0 2px 18px rgba(245,197,66,.18)",
			"inset 0 1px 0 rgba(255,255,255,.26)",
			"inset 0 2px 5px rgba(226,244,255,.10)",
			"inset 0 -1px 0 rgba(245,197,66,.18)",
			"inset 0 0 14px rgba(43,108,255,.28)",
			"0 2px 6px rgba(0,0,0,.34)"
		].join(",");
		/** Hover: brighter, wider glow — no transform, expansion IS the hover response. */
		const SHADOW_HOVER = [
			"0 0 0 1px rgba(125,211,252,.55)",
			"0 6px 26px rgba(43,108,255,.6)",
			"0 0 24px rgba(56,189,248,.45)",
			"0 0 28px rgba(245,197,66,.26)",
			"inset 0 1px 0 rgba(255,255,255,.34)",
			"inset 0 2px 6px rgba(226,244,255,.14)",
			"inset 0 -1px 0 rgba(245,197,66,.26)",
			"inset 0 0 18px rgba(43,108,255,.4)",
			"0 3px 8px rgba(0,0,0,.38)"
		].join(",");
		/** Disabled: same dark glass, the light gone quiet. */
		const SHADOW_QUIET = [
			"0 0 0 1px rgba(56,189,248,.14)",
			"0 2px 8px rgba(43,108,255,.18)",
			"inset 0 1px 0 rgba(255,255,255,.14)",
			"inset 0 -1px 0 rgba(245,197,66,.10)",
			"inset 0 0 10px rgba(43,108,255,.16)",
			"0 2px 5px rgba(0,0,0,.3)"
		].join(",");
		/** The breathing attract glow: idle stack plus one soft cyan halo at the peak. */
		const SHADOW_ATTRACT = SHADOW_IDLE + ",0 0 16px rgba(56,189,248,.4)";
		/**
		* Expansion applies on hover, keyboard focus (focus-VISIBLE only — a mouse click on
		* the switch must not keep the chip expanded after the pointer leaves; measured user
		* report 0.7.0), and busy.
		*/
		const EXPANDED = ".dip-root:is(:hover,:has(:focus-visible),[data-busy=\"true\"])";
		const css = [
			".dip-root{position:relative;display:inline-flex;align-items:stretch;isolation:isolate;",
			"height:30px;border-radius:999px;overflow:hidden;user-select:none;vertical-align:middle;flex:none;",
			"border:1px solid transparent;box-sizing:border-box;cursor:default;",
			"background:linear-gradient(135deg,#061024 0%,#08182e 52%,#0c2144 100%) padding-box,conic-gradient(from 200deg at 50% 50%,#22d3ee 0%,#38bdf8 15%,#2b6cff 38%,#1d4ed8 52%,#f5c542 80%,#ffe9a8 90%,#22d3ee 100%) border-box;",
			"box-shadow:" + SHADOW_IDLE + ";",
			"transition:box-shadow .28s,filter .28s}",
			".dip-aurora{position:absolute;inset:0;border-radius:999px;pointer-events:none;z-index:0;",
			"opacity:.85;transition:opacity .3s,filter .2s ease;background:" + AURORA + "}",
			".dip-arc{position:absolute;left:0;right:0;bottom:1px;height:2px;border-radius:2px;opacity:0;",
			"pointer-events:none;z-index:1;background-repeat:no-repeat;background-size:42% 100%;background-position:-60% 0;",
			"background-image:linear-gradient(90deg,transparent,rgba(125,211,252,.95),rgba(245,197,66,.9),transparent);",
			"transition:opacity .25s ease}",
			".dip-root[data-busy=\"true\"] .dip-arc{opacity:1;animation:dip-sweep 1.5s cubic-bezier(.55,.05,.35,.95) infinite}",
			".dip-ring{position:absolute;inset:0;border-radius:999px;padding:1px;opacity:0;pointer-events:none;z-index:1;",
			"background:conic-gradient(from 0deg,transparent 0 38%,rgba(34,211,238,.95) 56%,rgba(245,197,66,1) 72%,rgba(125,211,252,.95) 86%,transparent 100%);",
			"-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);",
			"mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);",
			"-webkit-mask-composite:xor;mask-composite:exclude;transition:opacity .25s ease}",
			".dip-btn{position:relative;z-index:2;display:inline-flex;align-items:center;box-sizing:border-box;",
			"height:28px;padding:0 6.5px;gap:0;border:0;background:transparent;cursor:pointer;outline:none;",
			"line-height:1;font-size:12px;font-weight:600;letter-spacing:.15px;color:#f2f7ff;",
			"transition:gap .28s cubic-bezier(.34,1.3,.5,1),padding .28s cubic-bezier(.34,1.3,.5,1)}",
			EXPANDED + " .dip-btn{padding:0 8px 0 9px;gap:6px}",
			".dip-btn:focus-visible{box-shadow:inset 0 0 0 2px rgba(125,211,252,.8)}",
			".dip-label{position:relative;z-index:2;white-space:nowrap;overflow:hidden;",
			"max-width:0;opacity:0;transform:translateX(-6px);",
			"text-shadow:0 1px 6px rgba(4,8,18,.8),0 0 12px rgba(43,108,255,.35);",
			"transition:max-width .3s cubic-bezier(.4,0,.2,1),opacity .22s ease,transform .3s cubic-bezier(.4,0,.2,1)}",
			EXPANDED + " .dip-label{max-width:64px;opacity:1;transform:none}",
			".dip-divider{position:relative;z-index:2;width:1px;max-width:0;opacity:0;align-self:stretch;margin:7px 0;pointer-events:none;",
			"background:linear-gradient(180deg,transparent 0%,rgba(125,211,252,.55) 32%,rgba(207,228,255,.5) 55%,rgba(245,197,66,.32) 80%,transparent 100%);",
			"box-shadow:0 0 4px rgba(56,189,248,.3);",
			"transition:max-width .3s cubic-bezier(.4,0,.2,1),opacity .22s ease}",
			EXPANDED + " .dip-divider{max-width:1px;opacity:1}",
			".dip-chevron{position:relative;z-index:2;flex:none;width:24px;height:28px;box-sizing:border-box;padding:0;",
			"display:inline-flex;align-items:center;justify-content:center;cursor:pointer;background:transparent;",
			"border:0;outline:none;color:#cfe4ff;overflow:hidden;max-width:0;opacity:0;",
			"transition:max-width .3s cubic-bezier(.4,0,.2,1),opacity .22s ease,background-color .18s ease}",
			EXPANDED + " .dip-chevron{max-width:24px;opacity:1}",
			".dip-chevron:focus-visible{box-shadow:inset 0 0 0 2px rgba(125,211,252,.8)}",
			".dip-caret{display:block;flex:none;",
			"filter:drop-shadow(0 1px 3px rgba(4,8,18,.85)) drop-shadow(0 0 6px rgba(43,108,255,.45));",
			"transition:transform .18s cubic-bezier(.34,1.56,.64,1)}",
			".dip-chevron:hover{background:linear-gradient(180deg,rgba(125,211,252,.12),rgba(43,108,255,.10))}",
			".dip-chevron:hover .dip-caret{transform:translateY(1px)}",
			".dip-chevron:active .dip-caret{transform:translateY(1px) scale(.88)}",
			".dip-burst{position:absolute;left:16px;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;",
			"border-radius:999px;pointer-events:none;z-index:1;opacity:0;",
			"border:2px solid rgba(125,211,252,.85);transform:scale(.4)}",
			".dip-root:active .dip-burst{animation:dip-burst .5s cubic-bezier(.2,.6,.35,1)}",
			".dip-root:hover{filter:brightness(1.1);box-shadow:" + SHADOW_HOVER + "}",
			".dip-root:hover .dip-ring{opacity:.85;animation:dip-rim 3.4s linear infinite}",
			".dip-root:hover .dip-aurora{opacity:1}",
			".dip-root:hover .dip-spark{opacity:.9;transform:translateY(-50%) scale(1.12) rotate(90deg)}",
			".dip-root:hover .dip-icon{transform:scale(1.18) rotate(-6deg)}",
			".dip-root:active{filter:brightness(.98)}",
			".dip-root:active .dip-ring{opacity:1;animation:dip-rim .35s linear 1}",
			".dip-root:active .dip-aurora{opacity:1;filter:brightness(1.4)}",
			".dip-root:active .dip-icon{transform:scale(.9)}",
			".dip-root[data-busy=\"true\"]{animation:dip-charge 2.1s ease-in-out infinite}",
			".dip-root[data-busy=\"true\"] .dip-btn{cursor:progress}",
			".dip-root[data-busy=\"true\"] .dip-ring{opacity:1;padding:2px;animation:dip-rim 1s linear infinite;",
			"background:conic-gradient(from 0deg,transparent 0 8%,rgba(34,211,238,.45) 22%,rgba(125,211,252,1) 40%,",
			"rgba(245,197,66,1) 54%,transparent 70%)}",
			".dip-root[data-busy=\"true\"] .dip-icon{animation:dip-icon-spin .8s linear infinite}",
			".dip-root[data-busy=\"true\"] .dip-aurora{opacity:1;animation:dip-aurora 1.1s ease-in-out infinite}",
			".dip-root[data-busy=\"true\"] .dip-spark{opacity:1;animation:dip-spark-pulse 1.1s ease-in-out infinite}",
			".dip-root:has(.dip-btn:not(:disabled)):not(:hover):not(:focus-within):not([data-busy=\"true\"])",
			"{animation:dip-attract 3.2s ease-in-out infinite}",
			".dip-btn:disabled{cursor:default;color:rgba(243,247,255,.66)}",
			".dip-root:has(.dip-btn:disabled){filter:saturate(.5);box-shadow:" + SHADOW_QUIET + "}",
			".dip-root:has(.dip-btn:disabled) .dip-ring{opacity:0}",
			".dip-root:has(.dip-btn:disabled) .dip-aurora{opacity:.2}",
			".dip-root:has(.dip-btn:disabled) .dip-spark{opacity:.14;animation:none;transform:translateY(-50%) scale(.82)}",
			".dip-root:has(.dip-btn:disabled) .dip-icon{opacity:.55}",
			".dip-root:has(.dip-btn:disabled) .dip-chevron{cursor:pointer}",
			".dip-spark{position:absolute;left:2px;top:50%;width:18px;height:18px;transform:translateY(-50%) scale(.95);",
			"z-index:1;background:url(data:image/png;base64,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) center/contain no-repeat;opacity:.5;pointer-events:none;",
			"transition:opacity .26s ease,transform .4s cubic-bezier(.22,1,.36,1)}",
			".dip-icon{width:15px;height:15px;flex:none;display:block;position:relative;z-index:2;color:#eaf6ff;",
			"filter:drop-shadow(0 0 5px rgba(56,189,248,.9)) drop-shadow(0 0 10px rgba(43,108,255,.45));",
			"transition:transform .2s cubic-bezier(.34,1.56,.64,1),filter .24s ease}",
			".dip-root:hover .dip-icon{filter:drop-shadow(0 0 6px rgba(125,211,252,.95)) drop-shadow(0 0 12px rgba(245,197,66,.4))}",
			".dip-root[data-busy=\"true\"] .dip-icon{filter:drop-shadow(0 0 6px rgba(125,211,252,.95)) drop-shadow(0 0 12px rgba(245,197,66,.45))}",
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
			"@keyframes dip-rim{to{transform:rotate(360deg)}}",
			"@keyframes dip-sweep{from{background-position:-60% 0}to{background-position:160% 0}}",
			"@keyframes dip-charge{0%,100%{transform:scale(1)}50%{transform:scale(1.028)}}",
			"@keyframes dip-icon-spin{to{transform:rotate(360deg)}}",
			"@keyframes dip-aurora{0%,100%{opacity:.7}50%{opacity:1}}",
			"@keyframes dip-spark-pulse{0%,100%{opacity:.5;transform:translateY(-50%) scale(.95)}50%{opacity:1;transform:translateY(-50%) scale(1.15)}}",
			"@keyframes dip-attract{0%,100%{box-shadow:" + SHADOW_IDLE + "}50%{box-shadow:" + SHADOW_ATTRACT + "}}",
			"@keyframes dip-burst{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(3.4)}}",
			"@media (prefers-reduced-motion: reduce){",
			".dip-root,.dip-ring,.dip-aurora,.dip-spark,.dip-icon,.dip-caret,.dip-chevron,.dip-burst,.dip-undo{animation:none!important;",
			"transition-duration:.01ms!important}",
			".dip-root:hover .dip-ring,.dip-root[data-busy=\"true\"] .dip-ring{opacity:1}",
			".dip-root[data-busy=\"true\"] .dip-arc{opacity:1;background-size:100% 100%;background-position:0 0}",
			".dip-root[data-busy=\"true\"] .dip-aurora{opacity:1}",
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