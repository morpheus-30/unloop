const MODES = {
  light: {
    soft: 12, // first nudge after real engagement
    deep: 20, // noticeable friction kicks in
    lock: 80, // long session guard
  },

  balanced: {
    soft: 8, // early awareness
    deep: 14, // consistent friction
    lock: 60, // standard cap
  },

  focus: {
    soft: 5, // very early interruption
    deep: 9, // strong friction quickly
    lock: 40, // strict cap
  },
};

let THRESHOLDS = MODES.balanced; // default until storage loads
const AVG_SECONDS_PER_REEL = 18;

let itemCount = 0;
let currentPhase = 1;
let sessionStart = Date.now();
const seenElements = new WeakSet();
let firstReelHandled = false;
let initialLoadLocked = false;

// Fallback selector chains — tries each until one matches
const SELECTOR_CHAINS = {
  "instagram.com": ["div.xp9pnto", "div.xyamay9", "div.x1qjc9v5"],
  "youtube.com": ["ytd-reel-video-renderer", "ytd-short-video-renderer"],
};

function isReelsPage() {
  const path = location.pathname;
  const host = location.hostname.replace("www.", "");
  if (host === "instagram.com") return path.startsWith("/reels");
  if (host === "youtube.com") return path.startsWith("/shorts");
  return false;
}

function getElements() {
  if (!isReelsPage()) {
    console.log("[Unloop] not a reels page, skipping:", location.pathname);
    return { els: [], sel: null };
  }

  const host = location.hostname.replace("www.", "");
  const chains = SELECTOR_CHAINS[host] || [];

  for (const sel of chains) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      console.log("[Unloop] using selector:", sel, `(${els.length} found)`);
      return { els, sel };
    }
  }

  console.warn(
    "[Unloop] no selector matched. Open console and run the debug script."
  );
  return { els: [], sel: null };
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function getStats() {
  const estimatedSeconds = itemCount * AVG_SECONDS_PER_REEL;
  return {
    count: itemCount,
    estimatedTime: formatTime(estimatedSeconds),
    estimatedSeconds,
    phase: currentPhase,
  };
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.intersectionRatio < 0.8) return;
      if (seenElements.has(entry.target)) return;
      if (Date.now() <= (window.__ul_ignoreReelsUntil || 0)) return;

      const video = entry.target.querySelector("video");

      // ✅ ONLY real filter you need
      if (!video || !video.currentSrc) return;

      // optional but safer than duration
      if (video.readyState < 1) return;

      seenElements.add(entry.target);
      observer.unobserve(entry.target);

      itemCount++;

      if (itemCount > THRESHOLDS.deep && itemCount <= THRESHOLDS.lock) {
        window.__ul_onReelChange?.();
      }

      console.log("[Unloop] reel counted:", itemCount, video.currentSrc);

      saveToStorage();
      evaluatePhase();
    });
  },
  { threshold: [0.8, 1.0] }
);

function saveToStorage() {
  chrome.storage.local.get(
    ["ul_total_reels", "ul_total_seconds", "ul_today", "ul_today_count"],
    (data) => {
      const today = new Date().toDateString();
      chrome.storage.local.set({
        ul_session_count: itemCount,
        ul_session_start: sessionStart,
        ul_total_reels: (data.ul_total_reels || 0) + 1,
        ul_total_seconds: (data.ul_total_seconds || 0) + AVG_SECONDS_PER_REEL,
        ul_today: today,
        ul_today_count:
          (data.ul_today === today ? data.ul_today_count || 0 : 0) + 1,
      });
    }
  );
}

function evaluatePhase() {
  let newPhase = 1;
  if (itemCount >= THRESHOLDS.lock) newPhase = 4;
  else if (itemCount >= THRESHOLDS.deep) newPhase = 3;
  else if (itemCount >= THRESHOLDS.soft) newPhase = 2;

  if (newPhase !== currentPhase) {
    currentPhase = newPhase;
    handlePhaseChange(newPhase);
  }

  window.dispatchEvent(new CustomEvent("ul:stats", { detail: getStats() }));
}

function handlePhaseChange(phase) {
  const stats = getStats();
  if (phase === 2) window.__ul_showOverlay?.(stats);
  if (phase === 3) window.__ul_startFriction?.(stats);
  if (phase === 4) window.__ul_lockSession?.(stats);
}

let activeSelector = null;

function observeItems() {
  const { els, sel } = getElements();
  if (!sel) return;
  activeSelector = sel;
  els.forEach((el) => {
    if (!seenElements.has(el)) observer.observe(el);
  });
}

let mutationTimer = null;
const mutationObs = new MutationObserver(() => {
  clearTimeout(mutationTimer);
  mutationTimer = setTimeout(observeItems, 120);
});
mutationObs.observe(document.body, { childList: true, subtree: true });
observeItems();

window.__ul_getStats = getStats;
window.__ul_resetCount = () => {
  itemCount = 0;
  currentPhase = 1;
  sessionStart = Date.now();
  chrome.storage.local.set({
    ul_session_count: 0,
    ul_session_start: sessionStart,
  });
};

function injectHUD() {
  if (document.getElementById("ul-hud")) return;
  const hud = document.createElement("div");
  hud.id = "ul-hud";
  hud.innerHTML = `
    <span id="ul-hud-icon">∞</span>
    <span id="ul-hud-count">0 reels</span>
    <span id="ul-hud-sep">·</span>
    <span id="ul-hud-time">~0s</span>
  `;
  document.body.appendChild(hud);

  window.addEventListener("ul:stats", (e) => {
    const { count, estimatedTime } = e.detail;
    document.getElementById("ul-hud-count").textContent = `${count} reel${
      count !== 1 ? "s" : ""
    }`;
    document.getElementById("ul-hud-time").textContent = `~${estimatedTime}`;
    hud.classList.remove("ul-hud-pulse");
    void hud.offsetWidth;
    hud.classList.add("ul-hud-pulse");
  });
}

if (document.body) injectHUD();
else document.addEventListener("DOMContentLoaded", injectHUD);
chrome.storage.local.get(["ul_session_count", "ul_session_start"], (data) => {
  const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000;
  const now = Date.now();
  const savedStart = data.ul_session_start || 0;

  if (data.ul_mode && MODES[data.ul_mode]) {
    THRESHOLDS = MODES[data.ul_mode];
    console.log("[Unloop] mode loaded:", data.ul_mode);
  }

  if (now - savedStart > SESSION_EXPIRY_MS) {
    chrome.storage.local.set({ ul_session_count: 0, ul_session_start: now });
    sessionStart = now;
    return;
  }

  if (data.ul_session_count) {
    itemCount = data.ul_session_count;
    if (itemCount >= THRESHOLDS.lock) currentPhase = 4;
    else if (itemCount >= THRESHOLDS.deep) currentPhase = 3;
    else if (itemCount >= THRESHOLDS.soft) currentPhase = 2;

    window.dispatchEvent(new CustomEvent("ul:stats", { detail: getStats() }));

    // Re-trigger phase behaviour after restore — but delay so other
    // scripts have time to register their handlers first
    setTimeout(() => {
      if (currentPhase === 4) window.__ul_lockSession?.(getStats());
      // Phase 3: start friction silently — no banner spam on refresh
      if (currentPhase === 3) window.__ul_startFriction?.(getStats());
      // Phase 2: don't re-show overlay on refresh, too annoying
    }, 800);
  }

  if (data.ul_session_start) sessionStart = data.ul_session_start;
});
