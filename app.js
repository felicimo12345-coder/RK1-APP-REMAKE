(() => {
  "use strict";

  const DEVICE = { width: 402, height: 874 };
  const SESSION_KEY = "rk1.demo.session.v2";
  const MEMORY_KEY = "rk1.demo.rag.v1";
  const TRANSITIONS = {
    none: {
      duration: 0,
      enter: ["0", "0"],
      exit: ["0", "0"]
    },
    fade: {
      duration: 380,
      enter: ["0", "0"],
      exit: ["0", "0"]
    },
    left: {
      duration: 620,
      enter: ["100%", "0"],
      exit: ["-100%", "0"]
    },
    right: {
      duration: 620,
      enter: ["-100%", "0"],
      exit: ["100%", "0"]
    },
    up: {
      duration: 620,
      enter: ["0", "100%"],
      exit: ["0", "-100%"]
    },
    down: {
      duration: 620,
      enter: ["0", "-100%"],
      exit: ["0", "100%"]
    },
    expand: {
      duration: 500,
      enter: ["0", "0"],
      exit: ["0", "0"],
      expand: true
    },
    locked: {
      duration: 500,
      enter: ["0", "12px"],
      exit: ["0", "0"],
      locked: true
    },
    tab: {
      duration: 2000,
      enter: ["0", "100%"],
      exit: ["0", "100%"],
      tab: true
    }
  };
  const TAB_PHASE_MS = 1000;
  const NAV_FADE_MS = 300;

  /*
   * ==================== DeepSeek API 配置区 ====================
   *
   * 这里只放 Worker 地址，绝对不要填写 DeepSeek API Key。
   * Key 应在 Cloudflare Worker 后台保存为 Secret：
   * DEEPSEEK_API_KEY
   *
   * 地址留空或仍包含 YOUR-WORKER 时，Demo 会自动使用本地上下文回复，
   * 页面切换、对话记录和最近两次病症记忆仍然可以正常演示。
   */
  const AI_API_BASE =
    "https://rk1-deepseek-worker.felicimo12345.workers.dev";

  const CONDITIONS = {
    vomit: {
      code: "vomit",
      branch: "a",
      symptom: "呕吐、食欲下降",
      diagnosis: "饮食不当",
      diagnosisLong: "可能与饮食不当有关",
      department: "内科",
      risk: "LOW RISK",
      medicine: "Omeprazole 10 mg"
    },
    cough: {
      code: "cough",
      branch: "b",
      symptom: "间歇性咳嗽、活动量下降",
      diagnosis: "轻度上呼吸道感染",
      diagnosisLong: "轻度上呼吸道感染",
      department: "呼吸内科",
      risk: "MID RISK",
      medicine: "Doxycycline"
    }
  };

  const DEFAULT_RECORDS = [
    {
      condition: "vomit",
      diagnosis: "饮食不当",
      at: "2026-07-25T10:00:00+09:00"
    },
    {
      condition: "cough",
      diagnosis: "轻度上呼吸道感染",
      at: "2026-07-18T10:00:00+09:00"
    }
  ];

  const SCREENS = {
    "health-a": screen("46-3686", "001-A0"),
    "health-a-history": screen("46-3610", "001-A1"),
    "health-a-emotion": screen("46-3574", "001-A2"),
    "health-a-sleep": screen("46-3661", "001-A3"),
    "health-b": screen("52-5912", "001-B0"),
    "health-b-history": screen("52-5825", "001-B1"),
    "health-b-emotion": screen("52-5789", "001-B2"),
    "health-b-sleep": screen("52-5876", "001-B3"),

    "health-a-updated": screen("52-6163", "001-a0"),
    "health-a-updated-history": screen("52-6076", "001-a1"),
    "health-a-updated-emotion": screen("52-6040", "001-a2"),
    "health-a-updated-sleep": screen("52-6127", "001-a3"),
    "health-b-updated": screen("56-6997", "001-b0"),
    "health-b-updated-history": screen("56-6908", "001-b1"),
    "health-b-updated-emotion": screen("56-6870", "001-b2"),
    "health-b-updated-sleep": screen("56-6959", "001-b3"),

    "triage-a1": screen("39-1333", "002-A1"),
    "triage-a2": screen("52-6658", "002-A2"),
    "triage-a3": screen("52-6737", "002-A3"),
    "triage-a4": screen("57-7765", "002-A4"),
    "triage-a5": screen("57-7844", "002-A5"),
    "triage-a6": screen("57-7299", "002-A6"),
    "plan-a7": screen("40-1451", "002-A7"),
    "plan-a8": screen("57-8158", "002-A8"),
    "plan-a9": screen("57-8219", "002-A9"),
    "plan-a10": screen("57-8280", "002-A10"),
    "journey-a11": screen("57-8642", "002-A11"),
    "journey-a12": screen("57-8671", "002-A12"),
    "journey-a13": screen("57-8700", "002-A13"),
    "journey-a14": screen("57-8792", "002-A14"),
    "report-a15": screen("40-1475", "002-A15"),

    "triage-b1": screen("57-7359", "002-B1"),
    "triage-b2": screen("57-7385", "002-B2"),
    "triage-b3": screen("57-7419", "002-B3"),
    "triage-b4": screen("57-7938", "002-B4"),
    "triage-b5": screen("57-8017", "002-B5"),
    "triage-b6": screen("57-7458", "002-B6"),
    "plan-b7": screen("57-8353", "002-B7"),
    "plan-b8": screen("57-8392", "002-B8"),
    "plan-b9": screen("57-8431", "002-B9"),
    "plan-b10": screen("57-8470", "002-B10"),
    "journey-b11": screen("57-8864", "002-B11"),
    "journey-b12": screen("57-8915", "002-B12"),
    "journey-b13": screen("57-8936", "002-B13"),
    "journey-b14": screen("57-8957", "002-B14"),
    "report-b15": screen("57-8886", "002-B15"),

    "agent-chat": screen("57-7670", "002-C1"),

    remote: screen("20-673", "003-A1"),
    "remote-off": screen("62-2745", "003-A1-1"),
    "remote-tracking": screen("20-799", "003-A2"),
    "remote-controls": screen("20-844", "003-A3"),
    "remote-controls-vent-off": screen("62-2836", "003-A3-1"),
    "remote-controls-vent-off-alt": screen("82-4265", "003-A3-3"),
    "remote-controls-both-off": screen("62-3132", "003-A3-2"),
    "remote-mechanics": screen("20-722", "003-A4"),
    "remote-mechanics-off": screen("62-2793", "003-A4-1"),
    "remote-location": screen("20-767", "003-A5"),

    profile: screen("20-895", "004-A1"),
    "profile-pet": screen("20-1041", "004-A2"),
    "profile-owner": screen("20-934", "004-A3"),
    "profile-history-ab": screen("20-981", "004-A4"),
    "profile-history-ba": screen("62-3311", "004-A4-1"),
    "profile-history-aa": screen("62-3385", "004-A4-2"),
    "profile-history-bb": screen("62-3459", "004-A4-3"),
    "profile-address": screen("20-1017", "004-A5")
  };

  const NAV_RECTS = {
    health: [37, 774, 72, 76],
    chat: [126, 774, 72, 76],
    remote: [210, 774, 72, 76],
    profile: [290, 774, 72, 76]
  };

  const AUTO_NEXT = {
    "journey-a11": "journey-a12",
    "journey-a12": "journey-a13",
    "journey-a13": "journey-a14",
    "journey-a14": "report-a15",
    "journey-b11": "journey-b12",
    "journey-b12": "journey-b13",
    "journey-b13": "journey-b14",
    "journey-b14": "report-b15"
  };

  /*
   * 进入 002-A1 / 002-B1 后，直到对应的 A15 / B15 完成页，
   * 底部四个主导航全部禁用，保证问诊是单链过程。
   */
  const LOCKED_SCREENS = new Set(
    ["a", "b"].flatMap((branch) => [
      ...Array.from({ length: 6 }, (_, index) => `triage-${branch}${index + 1}`),
      ...Array.from(
        { length: 4 },
        (_, index) => `plan-${branch}${index + 7}`
      ),
      ...Array.from(
        { length: 4 },
        (_, index) => `journey-${branch}${index + 11}`
      ),
      `report-${branch}15`
    ])
  );
  const REPORT_SCREENS = new Set(["report-a15", "report-b15"]);
  const HEALTH_DETAIL_RE = /^health-[ab](?:-updated)?-(history|emotion|sleep)$/;

  const el = {
    device: document.getElementById("device"),
    stage: document.getElementById("screenStage"),
    nav: document.getElementById("navStage"),
    navIcons: document.getElementById("navIconStage"),
    dynamic: document.getElementById("dynamicLayer"),
    hotspots: document.getElementById("hotspotLayer"),
    loader: document.getElementById("loader"),
    loaderText: document.getElementById("loaderText"),
    toast: document.getElementById("toast"),
    chatTemplate: document.getElementById("chatTemplate")
  };

  const params = new URLSearchParams(location.search);
  if (params.get("debug") === "1") {
    document.documentElement.dataset.debug = "true";
  }

  let renderToken = 0;
  let autoTimer = 0;
  let toastTimer = 0;
  let fitFrame = 0;
  let navigationLoaderTimer = 0;
  let stableViewportHeight = Math.max(
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
    window.visualViewport?.height || 0
  );
  let isTransitioning = false;
  const imageCache = new Map();

  const state = loadSession();
  ensureInitialState();

  function screen(nodeId, figmaName) {
    return {
      src: `./assets/screens/${nodeId}.png`,
      nodeId: nodeId.replace("-", ":"),
      figmaName
    };
  }

  function apiUrl(path) {
    const base = AI_API_BASE.trim().replace(/\/+$/, "");
    const isConfigured =
      base &&
      !base.includes("YOUR-WORKER") &&
      /^https:\/\/[a-z0-9.-]+$/i.test(base);
    return isConfigured ? `${base}${path}` : "";
  }

  function loadSession() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (parsed && typeof parsed === "object") {
        return {
          condition: parsed.condition,
          currentScreen: parsed.currentScreen,
          updatedCondition: parsed.updatedCondition || null,
          journey: parsed.journey || null,
          chat: Array.isArray(parsed.chat)
            ? parsed.chat.map(normalizeChatMessage).filter(Boolean)
            : [],
          remote: {
            motor: parsed.remote?.motor !== false,
            vent: parsed.remote?.vent !== false,
            mic: parsed.remote?.mic !== false
          }
        };
      }
    } catch (error) {
      console.warn("[RK1] 无法读取会话状态", error);
    }
    return {
      condition: null,
      currentScreen: null,
      updatedCondition: null,
      journey: null,
      chat: [],
      remote: { motor: true, vent: true, mic: true }
    };
  }

  function ensureInitialState() {
    const forced = params.get("condition");
    const forcedScreen = params.get("screen");
    if (params.get("reset") === "1") {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(MEMORY_KEY);
      Object.assign(state, {
        condition: null,
        currentScreen: null,
        updatedCondition: null,
        journey: null,
        chat: [],
        remote: { motor: true, vent: true, mic: true }
      });
    }

    /*
     * 没有指定 condition/screen、也没有未完成问诊时，视为一次新的 Demo 进入。
     * 重新抽取病例，避免 sessionStorage 中上一次的 cough 让首页永远停在病症 2。
     */
    const hasActiveJourney =
      state.journey &&
      !state.journey.committed &&
      typeof state.journey.resumeScreen === "string" &&
      SCREENS[state.journey.resumeScreen];
    if (!forced && !forcedScreen && !hasActiveJourney) {
      state.condition = drawCondition();
      state.currentScreen = null;
      state.updatedCondition = null;
      state.journey = null;
    }

    if (forced === "vomit" || forced === "cough") {
      state.condition = forced;
      if (!forcedScreen) {
        state.currentScreen = null;
        state.updatedCondition = null;
        state.journey = null;
      }
    }

    if (!CONDITIONS[state.condition]) {
      state.condition = drawCondition();
    }

    if (forcedScreen && SCREENS[forcedScreen]) {
      state.currentScreen = forcedScreen;
    }

    if (!state.currentScreen || !SCREENS[resolveScreenKey(state.currentScreen)]) {
      state.currentScreen = healthRoot();
    }

    if (!state.chat.length) {
      state.chat = [
        createChatMessage(
          "assistant",
          "你好，我是 Tod 的 AI 健康助手。我会结合他的基础资料、当前状态和最近两次病症记录理解我们的对话。今天想先聊聊什么？"
        )
      ];
    }
    saveSession();
  }

  function drawCondition() {
    if (globalThis.crypto?.getRandomValues) {
      const randomByte = new Uint8Array(1);
      globalThis.crypto.getRandomValues(randomByte);
      return randomByte[0] & 1 ? "cough" : "vomit";
    }
    return Math.random() < 0.5 ? "vomit" : "cough";
  }

  function createChatMessage(role, content) {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: role === "user" ? "user" : role === "system" ? "system" : "assistant",
      content: String(content || "").trim(),
      at: new Date().toISOString()
    };
  }

  function normalizeChatMessage(message) {
    if (!message || typeof message.content !== "string") return null;
    const content = message.content.trim();
    if (!content) return null;
    return {
      id:
        typeof message.id === "string"
          ? message.id
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role:
        message.role === "user"
          ? "user"
          : message.role === "system"
            ? "system"
            : "assistant",
      content,
      at:
        typeof message.at === "string"
          ? message.at
          : new Date().toISOString()
    };
  }

  function saveSession() {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          condition: state.condition,
          currentScreen: state.currentScreen,
          updatedCondition: state.updatedCondition,
          journey: state.journey,
          chat: state.chat.slice(-20),
          remote: state.remote
        })
      );
    } catch (error) {
      console.warn("[RK1] 无法保存会话状态", error);
    }
  }

  function getMemory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MEMORY_KEY) || "null");
      if (parsed && Array.isArray(parsed.records)) {
        const records = parsed.records
          .filter((item) => CONDITIONS[item?.condition])
          .slice(0, 2);
        if (records.length) return { records };
      }
    } catch (error) {
      console.warn("[RK1] 无法读取 RAG 记忆", error);
    }
    return { records: DEFAULT_RECORDS.map((item) => ({ ...item })) };
  }

  function commitMemory() {
    if (state.journey?.committed) return;
    const condition = CONDITIONS[state.condition];
    const memory = getMemory();
    memory.records.unshift({
      condition: condition.code,
      diagnosis: condition.diagnosis,
      at: new Date().toISOString()
    });
    memory.records = memory.records.slice(0, 2);

    try {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify({
          records: memory.records,
          updatedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      console.warn("[RK1] 无法写入 RAG 记忆", error);
    }

    state.updatedCondition = state.condition;
    if (!state.journey) state.journey = {};
    state.journey.committed = true;
    state.journey.completedAt = new Date().toISOString();
    saveSession();
    showToast("本次病症、诊断与用药已写入健康档案");
  }

  function healthRoot() {
    const branch = CONDITIONS[state.condition].branch;
    return state.updatedCondition === state.condition
      ? `health-${branch}-updated`
      : `health-${branch}`;
  }

  function resolveScreenKey(logicalKey) {
    if (logicalKey === "profile-history") return profileHistoryScreen();
    if (logicalKey === "remote-controls-live") return remoteControlsScreen();
    if (logicalKey === "remote-live") {
      return state.remote.motor ? "remote" : "remote-off";
    }
    if (logicalKey === "remote-mechanics-live") {
      return state.remote.motor ? "remote-mechanics" : "remote-mechanics-off";
    }
    return logicalKey;
  }

  function profileHistoryScreen() {
    const records = getMemory().records.slice(0, 2);
    const pair = records.map((item) => (item.condition === "cough" ? "b" : "a"));
    while (pair.length < 2) pair.push(pair[0] || "a");
    const key = pair.join("");
    return {
      ab: "profile-history-ab",
      ba: "profile-history-ba",
      aa: "profile-history-aa",
      bb: "profile-history-bb"
    }[key] || "profile-history-ab";
  }

  function remoteControlsScreen() {
    if (state.remote.vent && state.remote.mic) return "remote-controls";
    if (!state.remote.vent && state.remote.mic) {
      return "remote-controls-vent-off";
    }
    return "remote-controls-both-off";
  }

  function isChatInputFocused() {
    return document.activeElement?.id === "chatInput";
  }

  function updateKeyboardInset(scale) {
    const viewport = window.visualViewport;
    if (!viewport || !isChatInputFocused()) {
      document.documentElement.style.setProperty("--keyboard-inset", "0px");
      document.documentElement.dataset.keyboard = "closed";
      return;
    }

    const rawInset = Math.max(
      0,
      stableViewportHeight - viewport.height - (viewport.offsetTop || 0)
    );
    const keyboardInset = rawInset > 140 ? Math.min(360, rawInset / scale) : 0;
    document.documentElement.style.setProperty(
      "--keyboard-inset",
      `${keyboardInset.toFixed(1)}px`
    );
    document.documentElement.dataset.keyboard = keyboardInset ? "open" : "closed";
  }

  function fitDevice() {
    const mobile = matchMedia("(max-width: 520px), (max-height: 950px)").matches;
    const viewport = window.visualViewport;
    const currentLayoutHeight = Math.max(
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0,
      viewport?.height || 0
    );
    const keyboardVisible =
      isChatInputFocused() &&
      viewport &&
      stableViewportHeight - viewport.height - (viewport.offsetTop || 0) > 140;

    if (!keyboardVisible) stableViewportHeight = currentLayoutHeight;

    const viewportWidth =
      viewport?.width || document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = keyboardVisible
      ? stableViewportHeight
      : viewport?.height || document.documentElement.clientHeight || window.innerHeight;
    const horizontalReserve = mobile ? 0 : 20;
    const verticalReserve = mobile ? 0 : 78;
    const scale = Math.max(
      0.2,
      Math.min(
        1,
        (viewportWidth - horizontalReserve) / DEVICE.width,
        (viewportHeight - verticalReserve) / DEVICE.height
      )
    );
    document.documentElement.style.setProperty("--device-scale", String(scale));
    updateKeyboardInset(scale);
  }

  function scheduleFitDevice() {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fitDevice);
  }

  function beginNavigationLoading() {
    clearTimeout(navigationLoaderTimer);
    navigationLoaderTimer = setTimeout(() => {
      el.loaderText.textContent = "正在载入下一界面…";
      el.loader.classList.add("loader--navigation");
      el.loader.classList.remove("is-hidden");
    }, 160);
  }

  function endNavigationLoading() {
    clearTimeout(navigationLoaderTimer);
    navigationLoaderTimer = 0;
    el.loader.classList.add("is-hidden");
    el.loader.classList.remove("loader--navigation");
  }

  function preload(key) {
    const resolved = resolveScreenKey(key);
    const config = SCREENS[resolved];
    if (!config) return Promise.reject(new Error(`未知页面：${key}`));
    if (imageCache.has(config.src)) return imageCache.get(config.src);

    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(
        () => reject(new Error(`载入超时：${config.src}`)),
        30000
      );
      const finish = (callback) => {
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        callback();
      };
      image.decoding = "async";
      image.fetchPriority = "high";
      image.onload = () => finish(() => resolve(config.src));
      image.onerror = () =>
        finish(() => reject(new Error(`无法载入 ${config.src}`)));
      image.src = config.src;
    });
    imageCache.set(config.src, promise);
    promise.catch(() => imageCache.delete(config.src));
    return promise;
  }

  async function showScreen(logicalKey, options = {}) {
    const token = ++renderToken;
    const resolved = resolveScreenKey(logicalKey);
    const config = SCREENS[resolved];
    if (!config || (isTransitioning && !options.force)) return;

    clearTimeout(autoTimer);
    const kind = options.kind || "fade";
    const transition = TRANSITIONS[kind] || TRANSITIONS.fade;
    const duration = transition.duration;
    isTransitioning = duration > 0;
    if (kind !== "none") beginNavigationLoading();

    try {
      await preload(logicalKey);
    } catch (error) {
      isTransitioning = false;
      endNavigationLoading();
      showFatal(error.message);
      return;
    }
    if (token !== renderToken) return;
    endNavigationLoading();

    const previous = el.stage.querySelector(".screen-frame:last-child");
    if (transition.tab && previous) {
      await runTabTransition({
        token,
        logicalKey,
        resolved,
        config,
        previous
      });
      return;
    }

    const next = createScreenFrame(logicalKey, resolved, config);
    next.style.setProperty("--transition-duration", `${duration}ms`);
    next.style.setProperty("--enter-x", transition.enter[0]);
    next.style.setProperty("--enter-y", transition.enter[1]);

    if (previous && duration) {
      previous.style.setProperty("--transition-duration", `${duration}ms`);
      previous.style.setProperty("--exit-x", transition.exit[0]);
      previous.style.setProperty("--exit-y", transition.exit[1]);
      previous.classList.add("screen-frame--motion-out");
    }

    if (duration) {
      if (transition.expand) {
        next.classList.add("screen-frame--expand-in");
      } else if (transition.locked) {
        next.classList.add("screen-frame--locked-in");
      } else {
        next.classList.add("screen-frame--motion-in");
      }
    }

    el.stage.append(next);
    updateNavigationFrame(config, logicalKey, duration);
    state.currentScreen = logicalKey;
    if (state.journey && isJourneyScreen(logicalKey)) {
      state.journey.resumeScreen = logicalKey;
    }
    saveSession();
    mountDynamicLayer(logicalKey);
    buildHotspots(logicalKey);

    if (previous) {
      setTimeout(() => {
        if (previous.isConnected) previous.remove();
      }, duration + 34);
    }

    setTimeout(() => {
      isTransitioning = false;
    }, duration);

    if (logicalKey === "triage-a1" || logicalKey === "triage-b1") {
      const branch = logicalKey.includes("-a") ? "a" : "b";
      autoTimer = setTimeout(
        () =>
          showScreen(`triage-${branch}2`, {
            kind: "fade",
            force: true
          }),
        3000
      );
    } else if (logicalKey === "triage-a6" || logicalKey === "triage-b6") {
      autoTimer = setTimeout(
        () =>
          showScreen(
            logicalKey === "triage-a6" ? "plan-a7" : "plan-b7",
            { kind: "locked", force: true }
          ),
        1450
      );
    } else if (AUTO_NEXT[logicalKey]) {
      autoTimer = setTimeout(() => advanceLockedJourney(logicalKey), 2400);
    } else if (REPORT_SCREENS.has(logicalKey)) {
      commitMemory();
    }
  }

  function createScreenFrame(logicalKey, resolved, config) {
    if (resolved === "profile-owner") {
      return createProfileOwnerFrame(logicalKey, resolved, config);
    }

    const frame = document.createElement("img");
    frame.className = "screen-frame";
    frame.src = config.src;
    frame.alt = "";
    frame.dataset.screen = logicalKey;
    frame.dataset.resolvedScreen = resolved;
    frame.dataset.figmaNode = config.nodeId;
    frame.draggable = false;
    return frame;
  }

  /*
   * 004-A3 的旧导出图把整页内容整体上移，且主人卡片在底部被截短。
   * 不改动其余页面资源，仅将同一张导出图拆成两个局部片段重新对齐，
   * 再用 Figma 20:934 的 177–858px 主人卡片尺寸补齐底部。
   */
  function createProfileOwnerFrame(logicalKey, resolved, config) {
    const frame = document.createElement("div");
    frame.className = "screen-frame screen-frame--profile-owner";
    frame.dataset.screen = logicalKey;
    frame.dataset.resolvedScreen = resolved;
    frame.dataset.figmaNode = config.nodeId;

    const card = document.createElement("span");
    card.className = "profile-owner-frame__card";
    frame.append(card);

    const header = createProfileOwnerFragment(
      config.src,
      "profile-owner-frame__fragment profile-owner-frame__fragment--header"
    );
    const details = createProfileOwnerFragment(
      config.src,
      "profile-owner-frame__fragment profile-owner-frame__fragment--details"
    );
    const tail = document.createElement("span");
    tail.className = "profile-owner-frame__tail";
    frame.append(header, details, tail);

    return frame;
  }

  function createProfileOwnerFragment(src, className) {
    const crop = document.createElement("span");
    crop.className = className;

    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.draggable = false;
    crop.append(image);

    return crop;
  }

  function waitFor(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function runTabTransition({
    token,
    logicalKey,
    resolved,
    config,
    previous
  }) {
    const next = createScreenFrame(logicalKey, resolved, config);
    next.classList.add("screen-frame--tab-waiting");
    el.stage.append(next);
    updateNavigationFrame(config, logicalKey, NAV_FADE_MS);
    el.hotspots.replaceChildren();

    previous.classList.add("screen-frame--tab-out");
    el.dynamic.classList.add("dynamic-layer--tab-out");
    await waitFor(TAB_PHASE_MS);
    if (token !== renderToken) return;

    previous.remove();
    state.currentScreen = logicalKey;
    if (state.journey && isJourneyScreen(logicalKey)) {
      state.journey.resumeScreen = logicalKey;
    }
    saveSession();

    el.dynamic.classList.remove("dynamic-layer--tab-out");
    el.dynamic.classList.add("dynamic-layer--tab-waiting");
    mountDynamicLayer(logicalKey);
    void next.offsetHeight;
    void el.dynamic.offsetHeight;

    next.classList.remove("screen-frame--tab-waiting");
    next.classList.add("screen-frame--tab-in");
    el.dynamic.classList.remove("dynamic-layer--tab-waiting");
    el.dynamic.classList.add("dynamic-layer--tab-in");
    await waitFor(TAB_PHASE_MS);
    if (token !== renderToken) return;

    next.classList.remove("screen-frame--tab-in");
    el.dynamic.classList.remove("dynamic-layer--tab-in");
    isTransitioning = false;
    buildHotspots(logicalKey);
  }

  function updateNavigationFrame(config, logicalKey, duration) {
    if (!el.navIcons) return;
    const previous = el.navIcons.querySelector(
      ".nav-icon-frame:last-child"
    );
    const next = document.createElement("div");
    next.className = "nav-icon-frame";
    next.dataset.screen = logicalKey;

    const activeTab = currentTab(logicalKey) || "health";
    Object.keys(NAV_RECTS).forEach((tab) => {
      const item = document.createElement("span");
      item.className = `nav-item${tab === activeTab ? " is-active" : ""}`;
      item.dataset.tab = tab;
      item.setAttribute("aria-hidden", "true");
      item.innerHTML = navIconMarkup(tab);
      next.append(item);
    });

    if (previous && duration) {
      previous.classList.add("nav-icon-frame--fade-out");
      next.classList.add("nav-icon-frame--fade-in");
    }

    el.navIcons.append(next);
    if (previous) {
      setTimeout(() => {
        if (previous.isConnected) previous.remove();
      }, duration ? NAV_FADE_MS + 34 : 0);
    }
  }

  function navIconMarkup(tab) {
    const icons = {
      health: `
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="7" cy="7" r="2.15"></circle>
          <circle cx="12" cy="5.3" r="2.15"></circle>
          <circle cx="17" cy="7" r="2.15"></circle>
          <circle cx="5" cy="11.2" r="1.75"></circle>
          <circle cx="19" cy="11.2" r="1.75"></circle>
          <path d="M12 10.2c-4.3 0-7.1 3.05-7.1 6.1 0 2.25 1.75 3.8 4.05 3.8 1.15 0 2.05-.62 3.05-.62s1.9.62 3.05.62c2.3 0 4.05-1.55 4.05-3.8 0-3.05-2.8-6.1-7.1-6.1Z"></path>
        </svg>`,
      chat: `
        <svg viewBox="0 0 24 24" focusable="false">
          <g class="nav-radial-dots">
            <circle cx="8" cy="8" r="1.35"></circle><circle cx="12" cy="8" r="1.35"></circle><circle cx="16" cy="8" r="1.35"></circle>
            <circle cx="8" cy="12" r="1.35"></circle><circle cx="12" cy="12" r="1.35"></circle><circle cx="16" cy="12" r="1.35"></circle>
            <circle cx="8" cy="16" r="1.35"></circle><circle cx="12" cy="16" r="1.35"></circle><circle cx="16" cy="16" r="1.35"></circle>
          </g>
        </svg>`,
      remote: `
        <svg viewBox="0 0 24 24" focusable="false" class="nav-garage-icon">
          <path d="M4.2 10.2 12 4.4l7.8 5.8"></path>
          <path d="M5.4 9.4v10.2h13.2V9.4"></path>
          <path d="M8.2 12.1h7.6v7.5H8.2z"></path>
          <path d="M9.8 14.2h4.4M9.8 16.6h4.4"></path>
        </svg>`,
      profile: `
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="8.1" r="3.2"></circle>
          <path d="M5.8 19.2c.45-4.05 2.75-6.1 6.2-6.1s5.75 2.05 6.2 6.1c-1.75 1.05-3.8 1.55-6.2 1.55s-4.45-.5-6.2-1.55Z"></path>
        </svg>`
    };
    return icons[tab] || icons.health;
  }

  function isJourneyScreen(key) {
    return (
      key.startsWith("triage-") ||
      key.startsWith("plan-") ||
      key.startsWith("journey-") ||
      key.startsWith("report-")
    );
  }

  function advanceLockedJourney(from) {
    if (state.currentScreen !== from) return;
    const next = AUTO_NEXT[from];
    if (!next) return;
    showScreen(next, { kind: "locked", force: true });
  }

  function mountDynamicLayer(key) {
    el.dynamic.replaceChildren();
    el.dynamic.classList.toggle("dynamic-layer--interactive", key === "agent-chat");
    if (key === "agent-chat") {
      mountAgentChat();
    }
  }

  function buildHotspots(key) {
    el.hotspots.replaceChildren();
    el.hotspots.classList.toggle("hotspot-layer--passthrough", key === "agent-chat");

    if (!LOCKED_SCREENS.has(key)) buildNavigationHotspots(key);

    if (key === healthRoot()) {
      buildHealthRootHotspots(key);
      return;
    }

    const healthDetail = key.match(HEALTH_DETAIL_RE);
    if (healthDetail) {
      const backRect =
        healthDetail[1] === "history"
          ? [22, 174, 76, 72]
          : [20, 356, 78, 78];
      addHotspot(backRect, "返回健康首页", () =>
        showScreen(healthRoot(), { kind: "expand" })
      );
      return;
    }

    if (key === "triage-a1" || key === "triage-b1") {
      /* A1/B1 只允许等待 3 秒自动进入 A2/B2，不再通过输入框点击跳转。 */
      return;
    }

    if (key === "triage-a2" || key === "triage-b2") {
      buildDetailChoiceHotspots(key);
      return;
    }

    if (/^triage-[ab][345]$/.test(key)) {
      buildSelectedDetailHotspots(key);
      return;
    }

    if (key === "plan-a7" || key === "plan-b7") {
      buildTimeChoiceHotspots(key);
      return;
    }

    if (/^plan-[ab](8|9|10)$/.test(key)) {
      buildSelectedTimeHotspots(key);
      return;
    }

    if (REPORT_SCREENS.has(key)) {
      addHotspot([29, 690, 344, 61], "返回健康首页", () => {
        commitMemory();
        state.journey = null;
        showScreen(healthRoot(), { kind: "right", force: true });
      });
      return;
    }

    if (key === "remote" || key === "remote-off" || key === "remote-live") {
      buildRemoteRootHotspots();
      return;
    }

    if (key === "remote-location") {
      addHotspot([25, 545, 74, 76], "返回远程控制", () =>
        showScreen("remote-live", { kind: "expand" })
      );
      addHotspot([22, 625, 360, 145], "查看实时方位", () =>
        showScreen("remote-tracking", { kind: "expand" })
      );
      return;
    }

    if (key === "remote-tracking") {
      addHotspot([328, 60, 68, 70], "退出方位查询", () =>
        showScreen("remote-live", { kind: "expand" })
      );
      return;
    }

    if (
      key === "remote-controls-live" ||
      key.startsWith("remote-controls")
    ) {
      buildRemoteControlHotspots();
      return;
    }

    if (
      key === "remote-mechanics-live" ||
      key === "remote-mechanics" ||
      key === "remote-mechanics-off"
    ) {
      buildRemoteMechanicHotspots();
      return;
    }

    if (key === "profile") {
      buildProfileHotspots();
      return;
    }

    if (key === "profile-pet") {
      addHotspot([308, 538, 60, 66], "完成宠物信息查看", () =>
        showScreen("profile", { kind: "expand" })
      );
      return;
    }

    if (key === "profile-owner") {
      addHotspot([307, 194, 72, 72], "完成主人信息查看", () =>
        showScreen("profile", { kind: "expand" })
      );
      return;
    }

    if (key === "profile-history") {
      addHotspot([24, 304, 76, 76], "返回资料页", () =>
        showScreen("profile", { kind: "expand" })
      );
      return;
    }

    if (key === "profile-address") {
      addHotspot([15, 48, 76, 74], "返回资料页", () =>
        showScreen("profile", { kind: "expand" })
      );
    }
  }

  function buildNavigationHotspots(key) {
    const active = currentTab(key);
    const actions = {
      health: () =>
        showScreen(healthRoot(), { kind: "tab" }),
      chat: () =>
        showScreen("agent-chat", { kind: "tab" }),
      remote: () =>
        showScreen("remote-live", { kind: "tab" }),
      profile: () =>
        showScreen("profile", { kind: "tab" })
    };

    Object.entries(NAV_RECTS).forEach(([tab, rect]) => {
      if (tab === active) return;
      addHotspot(rect, `前往${tabLabel(tab)}`, actions[tab], "hotspot--nav");
    });
  }

  function currentTab(key) {
    if (key.startsWith("health-")) return "health";
    if (
      key.startsWith("triage-") ||
      key.startsWith("plan-") ||
      key.startsWith("journey-") ||
      key.startsWith("report-") ||
      key === "agent-chat"
    ) {
      return "chat";
    }
    if (key.startsWith("remote")) return "remote";
    if (key.startsWith("profile")) return "profile";
    return null;
  }

  function tabLabel(tab) {
    return {
      health: "健康首页",
      chat: "Agent",
      remote: "远程控制",
      profile: "个人资料"
    }[tab];
  }

  function buildHealthRootHotspots(key) {
    const branch = CONDITIONS[state.condition].branch;
    const updated = key.includes("-updated");
    const prefix = updated ? `health-${branch}-updated` : `health-${branch}`;

    addHotspot([16, 165, 370, 183], "展开历史小计", () =>
      showScreen(`${prefix}-history`, { kind: "expand" })
    );
    addHotspot([16, 360, 180, 174], "展开情绪评估", () =>
      showScreen(`${prefix}-emotion`, { kind: "expand" })
    );
    addHotspot([207, 360, 179, 174], "展开睡眠指数", () =>
      showScreen(`${prefix}-sleep`, { kind: "expand" })
    );

    if (!updated) {
      addHotspot([28, 684, 346, 70], "进行 Agent 智能代诊预约", beginJourney);
    }
  }

  function beginJourney() {
    const branch = CONDITIONS[state.condition].branch;
    const resume = state.journey?.resumeScreen;
    if (
      state.journey &&
      !state.journey.committed &&
      state.journey.condition === state.condition &&
      resume &&
      SCREENS[resume]
    ) {
      showScreen(resume, { kind: "left" });
      return;
    }

    state.journey = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      condition: state.condition,
      detailChoice: null,
      timeChoice: null,
      resumeScreen: `triage-${branch}1`,
      committed: false,
      startedAt: new Date().toISOString()
    };
    saveSession();
    showScreen(`triage-${branch}1`, { kind: "left" });
  }

  function buildDetailChoiceHotspots(key) {
    const branch = key.includes("-a") ? "a" : "b";
    const targets =
      branch === "a"
        ? ["triage-a3", "triage-a4", "triage-a5"]
        : ["triage-b3", "triage-b4", "triage-b5"];
    const labels =
      branch === "a"
        ? ["持续 1 天", "精神一般", "有异味"]
        : ["持续 1 天", "夜间明显", "呼吸稍快"];
    const rects = [
      [28, 472, 104, 39],
      [147, 472, 104, 39],
      [264, 472, 104, 39]
    ];

    targets.forEach((target, index) => {
      addHotspot(rects[index], labels[index], () => {
        if (state.journey) state.journey.detailChoice = index;
        showScreen(target, { kind: "fade" });
      });
    });
  }

  function buildSelectedDetailHotspots(key) {
    const branch = key.includes("-a") ? "a" : "b";
    const targets =
      branch === "a"
        ? ["triage-a3", "triage-a4", "triage-a5"]
        : ["triage-b3", "triage-b4", "triage-b5"];
    const rects = [
      [28, 472, 104, 39],
      [147, 472, 104, 39],
      [264, 472, 104, 39]
    ];
    targets.forEach((target, index) => {
      addHotspot(rects[index], `选择补充信息 ${index + 1}`, () => {
        if (state.journey) state.journey.detailChoice = index;
        showScreen(target, { kind: "fade" });
      });
    });
    addHotspot([27, 654, 118, 47], "跳过上传并生成计划", () =>
      showScreen(`triage-${branch}6`, { kind: "locked", force: true })
    );
  }

  function buildTimeChoiceHotspots(key) {
    const branch = key.includes("-a") ? "a" : "b";
    const targets = [
      `plan-${branch}8`,
      `plan-${branch}9`,
      `plan-${branch}10`
    ];
    const rects = [
      [36, 601, 108, 88],
      [154, 601, 108, 88],
      [273, 601, 108, 88]
    ];
    targets.forEach((target, index) => {
      addHotspot(rects[index], `选择时段 ${index + 1}`, () => {
        if (state.journey) state.journey.timeChoice = index;
        showScreen(target, { kind: "fade" });
      });
    });
  }

  function buildSelectedTimeHotspots(key) {
    const branch = key.includes("-a") ? "a" : "b";
    buildTimeChoiceHotspots(key);
    addHotspot([36, 702, 346, 62], "确认计划并授权", () => {
      if (state.journey) {
        state.journey.authorizedAt = new Date().toISOString();
      }
      showScreen(`journey-${branch}11`, { kind: "locked", force: true });
    });
  }

  function buildRemoteRootHotspots() {
    addHotspot([16, 67, 370, 283], "查看 Tod 实时方位", () =>
      showScreen("remote-tracking", { kind: "expand" })
    );
    addHotspot([16, 362, 370, 161], "展开远程控制", () =>
      showScreen("remote-controls-live", { kind: "expand" })
    );
    addHotspot([16, 532, 186, 237], "查看舱体机械状态", () =>
      showScreen("remote-mechanics-live", { kind: "expand" })
    );
    addHotspot([208, 532, 178, 237], "查看位置", () =>
      showScreen("remote-location", { kind: "expand" })
    );
  }

  function buildRemoteControlHotspots() {
    addHotspot([24, 178, 77, 72], "收起远程控制", () =>
      showScreen("remote-live", { kind: "expand" })
    );
    addHotspot([282, 300, 88, 38], "切换通风", () => {
      state.remote.vent = !state.remote.vent;
      if (state.remote.vent && !state.remote.mic) state.remote.mic = true;
      saveSession();
      showScreen("remote-controls-live", { kind: "fade", force: true });
    });
    addHotspot([282, 374, 88, 38], "保持恒温 23 度", () =>
      showToast("恒温目标保持为 23°C")
    );
    addHotspot([282, 445, 88, 42], "切换远程麦克风", () => {
      if (state.remote.vent) state.remote.vent = false;
      state.remote.mic = !state.remote.mic;
      saveSession();
      showScreen("remote-controls-live", { kind: "fade", force: true });
    });
  }

  function buildRemoteMechanicHotspots() {
    addHotspot([24, 548, 78, 72], "退出机械状态查看", () =>
      showScreen("remote-live", { kind: "expand" })
    );
    addHotspot([102, 627, 270, 55], "切换电机状态", () => {
      state.remote.motor = !state.remote.motor;
      saveSession();
      showScreen("remote-mechanics-live", { kind: "fade", force: true });
    });
  }

  function buildProfileHotspots() {
    addHotspot([16, 68, 370, 193], "查看 Tod 宠物信息", () =>
      showScreen("profile-pet", { kind: "expand" })
    );
    addHotspot([16, 267, 370, 193], "查看 Abby 主人信息", () =>
      showScreen("profile-owner", { kind: "expand" })
    );
    addHotspot([16, 465, 370, 146], "查看最近病史", () =>
      showScreen("profile-history", { kind: "expand" })
    );
    addHotspot([16, 615, 370, 150], "查看地址与订阅信息", () =>
      showScreen("profile-address", { kind: "expand" })
    );
  }

  function bindPress(target, handler) {
    let pointerStart = null;
    let lastTouchActivation = 0;

    const invoke = (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    };

    if ("PointerEvent" in window) {
      target.addEventListener(
        "pointerdown",
        (event) => {
          if (event.pointerType === "mouse") return;
          pointerStart = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY
          };
        },
        { passive: true }
      );
      target.addEventListener(
        "pointercancel",
        () => {
          pointerStart = null;
        },
        { passive: true }
      );
      target.addEventListener(
        "pointerup",
        (event) => {
          if (event.pointerType === "mouse") return;
          const start = pointerStart;
          pointerStart = null;
          if (!start || start.id !== event.pointerId) return;
          if (
            Math.abs(event.clientX - start.x) > 12 ||
            Math.abs(event.clientY - start.y) > 12
          ) {
            return;
          }
          lastTouchActivation = performance.now();
          invoke(event);
        },
        { passive: false }
      );
    } else {
      let touchStart = null;
      target.addEventListener(
        "touchstart",
        (event) => {
          const touch = event.changedTouches[0];
          touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
        },
        { passive: true }
      );
      target.addEventListener(
        "touchend",
        (event) => {
          const touch = event.changedTouches[0];
          const start = touchStart;
          touchStart = null;
          if (!touch || !start) return;
          if (
            Math.abs(touch.clientX - start.x) > 12 ||
            Math.abs(touch.clientY - start.y) > 12
          ) {
            return;
          }
          lastTouchActivation = performance.now();
          invoke(event);
        },
        { passive: false }
      );
    }

    target.addEventListener("click", (event) => {
      if (performance.now() - lastTouchActivation < 700) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      invoke(event);
    });
  }

  function addHotspot(rect, label, action, className = "") {
    const [left, top, width, height] = rect;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hotspot ${className}`.trim();
    button.setAttribute("aria-label", label);
    button.style.cssText = [
      `left:${left}px`,
      `top:${top}px`,
      `width:${width}px`,
      `height:${height}px`
    ].join(";");
    bindPress(button, () => {
      if (isTransitioning) return;
      action();
    });
    el.hotspots.append(button);
    return button;
  }

  function mountAgentChat() {
    const fragment = el.chatTemplate.content.cloneNode(true);
    el.dynamic.append(fragment);

    const chat = el.dynamic.querySelector(".agent-chat");
    const messagesEl = document.getElementById("chatMessages");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const send = document.getElementById("chatSend");
    const jump = document.getElementById("chatJump");
    const clear = document.getElementById("chatClear");
    const status = document.getElementById("chatStatus");
    const statusText = document.getElementById("chatStatusText");

    const renderMessages = () => {
      messagesEl.replaceChildren();
      state.chat.forEach((message) => {
        messagesEl.append(createBubble(message));
      });
      scrollChatToEnd(messagesEl, false);
    };

    const appendMessage = (message) => {
      messagesEl.append(createBubble(message));
      scrollChatToEnd(messagesEl, true);
    };

    const resizeInput = () => {
      input.style.height = "0px";
      input.style.height = `${Math.min(72, Math.max(40, input.scrollHeight))}px`;
      form.classList.toggle("is-ready", Boolean(input.value.trim()));
      send.querySelector("span").textContent = input.value.trim() ? "↑" : "＋";
      requestAnimationFrame(() => {
        chat.style.setProperty("--composer-height", `${form.offsetHeight}px`);
      });
    };

    messagesEl.addEventListener(
      "scroll",
      () => {
        const distance =
          messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight;
        jump.classList.toggle("is-visible", distance > 86);
      },
      { passive: true }
    );
    bindPress(jump, () => scrollChatToEnd(messagesEl, true));

    bindPress(clear, () => {
      state.chat = [
        createChatMessage(
          "assistant",
          "对话已清空。我仍会保留 Tod 的基础资料和最近两条健康记录。现在想从哪里开始？"
        )
      ];
      saveSession();
      renderMessages();
      showToast("当前对话已清空，健康记忆未删除");
    });

    input.addEventListener("pointerdown", () => {
      stableViewportHeight = Math.max(
        stableViewportHeight,
        window.innerHeight || 0,
        document.documentElement.clientHeight || 0,
        window.visualViewport?.height || 0
      );
    }, { passive: true });
    input.addEventListener("focus", scheduleFitDevice);
    input.addEventListener("blur", () => {
      document.documentElement.style.setProperty("--keyboard-inset", "0px");
      document.documentElement.dataset.keyboard = "closed";
      scheduleFitDevice();
    });
    input.addEventListener("input", resizeInput);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit(send);
        } else {
          send.click();
        }
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text || form.classList.contains("is-busy")) return;

      const userMessage = createChatMessage("user", text);
      state.chat.push(userMessage);
      input.value = "";
      resizeInput();
      saveSession();
      appendMessage(userMessage);

      form.classList.add("is-busy");
      input.setAttribute("aria-busy", "true");
      send.disabled = true;
      const typing = createTypingBubble();
      messagesEl.append(typing);
      scrollChatToEnd(messagesEl, true);

      const result = await requestAgentReply(text);
      typing.remove();
      const assistantMessage = createChatMessage("assistant", result.reply);
      state.chat.push(assistantMessage);
      state.chat = state.chat.slice(-20);
      saveSession();
      if (messagesEl.isConnected) appendMessage(assistantMessage);

      form.classList.remove("is-busy");
      input.removeAttribute("aria-busy");
      send.disabled = false;
      if (result.failed) {
        setChatStatus(status, statusText, "error", "AI 暂时不可用");
      } else if (result.offline) {
        setChatStatus(status, statusText, "local", "本地演示回复");
        showToast("真实 AI 未连接，当前回复来自本地演示逻辑");
      } else {
        setChatStatus(
          status,
          statusText,
          "online",
          `${result.provider || "AI"} 已连接`
        );
      }
    });

    renderMessages();
    resizeInput();
    checkAgentConnection(status, statusText);
  }

  function scrollChatToEnd(messagesEl, smooth) {
    requestAnimationFrame(() => {
      messagesEl.scrollTo({
        top: messagesEl.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    });
  }

  function createBubble(message) {
    const row = document.createElement("article");
    const normalizedRole =
      message.role === "user"
        ? "user"
        : message.role === "system"
          ? "system"
          : "assistant";
    row.className = `chat-row chat-row--${normalizedRole}`;
    if (message.id) row.dataset.messageId = message.id;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    if (normalizedRole === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "chat-avatar";
      avatar.textContent = "AI";
      avatar.setAttribute("aria-hidden", "true");
      row.append(avatar);
    }

    const sender = document.createElement("span");
    sender.className = "chat-bubble__sender";
    sender.textContent =
      normalizedRole === "user"
        ? "你"
        : normalizedRole === "system"
          ? "系统"
          : "RK1 Agent";

    const body = document.createElement("p");
    body.className = "chat-bubble__body";
    body.textContent = message.content;

    const time = document.createElement("time");
    time.className = "chat-bubble__time";
    time.dateTime = message.at || "";
    time.textContent = formatChatTime(message.at);

    bubble.append(sender, body, time);
    row.append(bubble);
    return row;
  }

  function createTypingBubble() {
    const row = createBubble(
      createChatMessage("assistant", "正在整理上下文")
    );
    const bubble = row.querySelector(".chat-bubble");
    const body = row.querySelector(".chat-bubble__body");
    const time = row.querySelector(".chat-bubble__time");
    bubble.classList.add("chat-bubble--typing");
    if (time) time.remove();
    body.replaceChildren(
      dot(),
      dot(),
      dot()
    );
    return row;
  }

  function dot() {
    const item = document.createElement("span");
    item.className = "typing-dot";
    return item;
  }

  function formatChatTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function setChatStatus(status, text, stateName, label) {
    if (!status?.isConnected || !text?.isConnected) return;
    status.dataset.state = stateName;
    text.textContent = label;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    if (!("AbortController" in window)) {
      return fetch(url, options);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function checkAgentConnection(status, text) {
    const base = apiUrl("/api/health");
    if (!base) {
      setChatStatus(status, text, "local", "待填写 DeepSeek Worker 地址");
      return;
    }

    try {
      const response = await fetchWithTimeout(
        base,
        {
          method: "GET",
          credentials: "omit"
        },
        5000
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (data.ok || data.configured || data.service) {
        setChatStatus(
          status,
          text,
          "online",
          `${data.provider || data.service || "AI"} 已连接`
        );
      } else {
        setChatStatus(status, text, "local", "API Key 未配置");
      }
    } catch (error) {
      console.info("[RK1] AI 代理状态检查失败", error.message);
      setChatStatus(status, text, "error", "AI 代理未启动");
    }
  }

  async function requestAgentReply(userText) {
    const base = apiUrl("/api/chat");
    if (!base) {
      return {
        reply: buildOfflineReply(userText),
        provider: "Context Demo Agent",
        offline: true
      };
    }

    // 对话记录沿用 state.chat，不再单独维护 conversationHistory
    const payload = {
      messages: state.chat.slice(-12).map(({ role, content }) => ({
        role,
        content
      })),
      context: buildAgentContext(),
      userText
    };

    try {
      const response = await fetchWithTimeout(
        base,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          credentials: "omit"
        },
        35000
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) {
        throw new Error(data.details || data.error || "AI 请求失败");
      }
      return {
        reply: String(data.reply),
        provider: data.provider || data.model || "AI",
        offline: false
      };
    } catch (error) {
      console.error(error);
      return {
        reply: "暂时无法连接 AI，请稍后重试。",
        offline: true,
        failed: true
      };
    }
  }

  function buildAgentContext() {
    const condition = CONDITIONS[state.condition];
    return {
      pet: {
        name: "Tod",
        breed: "意大利灵缇",
        sex: "雄性（已绝育）",
        age: "3岁6个月",
        weight: "4.8kg"
      },
      currentScenario: {
        condition: condition.code,
        symptom: condition.symptom,
        department: condition.department,
        risk: condition.risk,
        journeyStage: state.currentScreen
      },
      recentRecords: getMemory().records,
      responseStyle:
        "用自然、简洁的中文回复；优先结合 Tod 的资料和最近两次记录；不要声称替代兽医诊断。"
    };
  }

  function buildOfflineReply(userText) {
    const text = userText.toLowerCase();
    const condition = CONDITIONS[state.condition];
    const latest = getMemory().records[0];

    if (/吐|呕吐|食欲|胃/.test(text)) {
      return "我记下了。Tod 最近有呕吐与食欲下降的记录，可以先观察饮水、精神和再次呕吐的频率；若反复呕吐、无法进水或明显萎靡，请尽快联系兽医。";
    }
    if (/咳|呼吸|喘|气/.test(text)) {
      return "结合 Tod 近期的咳嗽记录，建议继续留意静息呼吸频率、夜间是否加重，以及是否出现张口呼吸。若呼吸费力或牙龈颜色异常，应立即就医。";
    }
    if (/药|服用|剂量/.test(text)) {
      return `最近档案中的诊后用药为 ${condition.medicine}。具体剂量仍应以本次兽医处方为准，不建议自行增减或停药。`;
    }
    if (/记录|历史|上次/.test(text)) {
      const latestText = latest
        ? `${latest.condition === "vomit" ? "呕吐" : "咳嗽"}（${latest.diagnosis}）`
        : "暂无记录";
      return `Tod 最近一条健康记录是：${latestText}。我会在当前对话中结合这条记录继续判断需要补充哪些信息。`;
    }
    return `好的，我会结合 Tod 的基础资料和近期“${condition.symptom}”记录一起理解。你可以继续告诉我：什么时候开始、精神和饮食有没有变化，以及是否出现新的异常。`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, 2600);
  }

  function showFatal(message) {
    el.loaderText.textContent = message;
    el.loader.classList.remove("is-hidden");
  }

  async function initialize() {
    fitDevice();
    window.addEventListener("resize", scheduleFitDevice, { passive: true });
    window.addEventListener("orientationchange", scheduleFitDevice, {
      passive: true
    });
    window.visualViewport?.addEventListener("resize", scheduleFitDevice, {
      passive: true
    });
    window.visualViewport?.addEventListener("scroll", scheduleFitDevice, {
      passive: true
    });
    window.addEventListener("pageshow", scheduleFitDevice, { passive: true });

    try {
      await showScreen(state.currentScreen, { kind: "none", force: true });
      endNavigationLoading();
      warmLikelyScreens();
    } catch (error) {
      showFatal(`载入失败：${error.message}`);
    }
  }

  function warmLikelyScreens() {
    const branch = CONDITIONS[state.condition].branch;
    const keys = [
      healthRoot(),
      `triage-${branch}1`,
      `triage-${branch}2`,
      `plan-${branch}7`,
      "agent-chat",
      "remote",
      "profile"
    ];
    const touchConstrained =
      navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches;
    const selectedKeys = touchConstrained ? keys.slice(0, 2) : keys;
    const warm = async () => {
      for (const key of selectedKeys) {
        try {
          await preload(key);
        } catch (error) {
          console.info("[RK1] 后台预载失败，将在点击时重试", key, error.message);
        }
      }
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => warm(), { timeout: 1800 });
    } else {
      setTimeout(() => warm(), 500);
    }
  }

  initialize();
})();
