// popup.js

const AVG_SECS = 18;
const MODES = {
  light: { soft: 12, deep: 20, lock: 80, label: "Light" },
  balanced: { soft: 8, deep: 14, lock: 60, label: "Balanced" },
  focus: { soft: 5, deep: 9, lock: 40, label: "Focus" },
};

let currentMode = "balanced";

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getModeConfig(mode) {
  return MODES[mode] || MODES.balanced;
}

function updateThresholdUI(mode) {
  const { soft, deep, lock } = getModeConfig(mode);
  document.getElementById("marker-soft").textContent = soft;
  document.getElementById("marker-deep").textContent = deep;
  document.getElementById("marker-lock").textContent = lock;
  document.getElementById(
    "mode-summary"
  ).textContent = `soft ${soft} · deep ${deep} · lock ${lock}`;

  document.getElementById("label-soft").style.left = `${(soft / lock) * 100}%`;
  document.getElementById("label-deep").style.left = `${(deep / lock) * 100}%`;
  document.getElementById("label-lock").style.left = "100%";
}

function getNextThreshold(count, mode, isLocked) {
  const { soft, deep, lock } = getModeConfig(mode);

  if (isLocked || count >= lock) {
    return { label: "lock active", remaining: 0 };
  }

  if (count < soft) {
    return { label: `soft at ${soft}`, remaining: soft - count };
  }

  if (count < deep) {
    return { label: `deep at ${deep}`, remaining: deep - count };
  }

  return { label: `lock at ${lock}`, remaining: lock - count };
}

function updateSessionSummary(count, mode, isLocked) {
  const { lock, label } = getModeConfig(mode);
  const progressPct = Math.min(100, Math.round((count / lock) * 100));
  const next = getNextThreshold(count, mode, isLocked);

  const titleEl = document.getElementById("session-title");
  const subtitleEl = document.getElementById("session-subtitle");
  const badgeEl = document.getElementById("session-badge");
  const progressNoteEl = document.getElementById("progress-note");
  const nextThresholdEl = document.getElementById("next-threshold");
  const remainingEl = document.getElementById("remaining-count");

  badgeEl.textContent = `${label.toLowerCase()} mode`;
  progressNoteEl.textContent = `${progressPct}% of this session cap used`;
  nextThresholdEl.textContent = next.label;

  if (isLocked) {
    titleEl.textContent = "Cooldown in effect";
    subtitleEl.textContent =
      "The session lock is active. The counter will reset when the cooldown ends.";
    remainingEl.textContent = "session paused";
    return;
  }

  if (count === 0) {
    titleEl.textContent = "Holding steady";
    subtitleEl.textContent =
      "Fresh session. Thresholds will adapt to your selected mode.";
    remainingEl.textContent = `${lock} to lock`;
    return;
  }

  if (count < getModeConfig(mode).soft) {
    titleEl.textContent = "Still in the clear";
    subtitleEl.textContent =
      "Light use so far. The first interruption has not kicked in yet.";
  } else if (count < getModeConfig(mode).deep) {
    titleEl.textContent = "Awareness mode";
    subtitleEl.textContent =
      "You crossed the soft threshold. The next phase will add stronger friction.";
  } else if (count < lock) {
    titleEl.textContent = "Friction is active";
    subtitleEl.textContent =
      "You are in the deep session zone now. Each extra reel is closer to a lock.";
  } else {
    titleEl.textContent = "Session limit reached";
    subtitleEl.textContent =
      "You hit the session cap. The cooldown should now block further scrolling.";
  }

  remainingEl.textContent =
    next.remaining > 0 ? `${pluralize(next.remaining, "reel")} left` : "now";
}

function updatePhaseUI(count, mode, isLocked) {
  const { soft, deep, lock } = getModeConfig(mode);
  const phases = [
    { label: "Light usage", dotClass: "active" },
    { label: "Soft interrupt", dotClass: "warn" },
    { label: "Deep usage", dotClass: "warn" },
    { label: "Session locked", dotClass: "danger" },
  ];

  let phase = 0;
  if (isLocked || count >= lock) phase = 3;
  else if (count >= deep) phase = 2;
  else if (count >= soft) phase = 1;

  document.getElementById("phase-text").textContent = phases[phase].label;

  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot${i + 1}`);
    dot.className = "phase-dot";
    if (i < phase) dot.classList.add("active");
    if (i === phase) dot.classList.add(phases[phase].dotClass);
  }

  // Progress bar
  const pct = Math.min(100, (count / lock) * 100);
  const fill = document.getElementById("progress-fill");
  fill.style.width = `${pct}%`;
  fill.className = "progress-fill";
  if (isLocked || count >= lock) fill.classList.add("danger");
  else if (count >= deep) fill.classList.add("danger");
  else if (count >= soft) fill.classList.add("warn");

  // Big numbers color
  const countEl = document.getElementById("pop-count");
  const timeEl = document.getElementById("pop-time");
  countEl.className = "big-num";
  timeEl.className = "big-num";
  if (isLocked || count >= lock) {
    countEl.classList.add("danger");
    timeEl.classList.add("danger");
  } else if (count >= deep) {
    countEl.classList.add("danger");
    timeEl.classList.add("danger");
  } else if (count >= soft) {
    countEl.classList.add("warn");
    timeEl.classList.add("warn");
  }
}

function render(data) {
  const count = data.ul_session_count || 0;
  const totalReels = data.ul_total_reels || 0;
  const todayCount = data.ul_today_count || 0;
  const totalSecs = data.ul_total_seconds || 0;
  const isLocked = data.ul_locked && data.ul_unlock_at > Date.now();
  currentMode = MODES[data.ul_mode] ? data.ul_mode : "balanced";

  // Session stats
  document.getElementById("pop-count").textContent = count;
  document.getElementById("pop-time").textContent = `~${formatTime(
    count * AVG_SECS
  )}`;

  // Status pill
  const pill = document.getElementById("status-pill");
  if (isLocked) {
    pill.textContent = "locked";
    pill.className = "status-pill locked";
  } else if (count > 0) {
    pill.textContent = "active";
    pill.className = "status-pill active";
  } else {
    pill.textContent = "idle";
    pill.className = "status-pill";
  }

  // Session card highlight
  document
    .getElementById("session-card")
    .classList.toggle("has-data", count > 0);

  // Phase UI
  updateThresholdUI(currentMode);
  updatePhaseUI(count, currentMode, isLocked);
  updateSessionSummary(count, currentMode, isLocked);

  // Lifetime
  document.getElementById("lt-today").textContent = todayCount;
  document.getElementById("lt-total").textContent = totalReels;
  document.getElementById("lt-time").textContent = formatTime(totalSecs);

  // Lock overlay
  const lockOverlay = document.getElementById("lock-overlay");
  if (isLocked) {
    lockOverlay.classList.add("visible");
    updateLockCountdown(data.ul_unlock_at);
  } else {
    lockOverlay.classList.remove("visible");
  }
}

let lockTimer = null;
function updateLockCountdown(unlockAt) {
  if (lockTimer) clearInterval(lockTimer);
  const tick = () => {
    const remaining = unlockAt - Date.now();
    document.getElementById("lock-countdown").textContent =
      formatCountdown(remaining);
    if (remaining <= 0) clearInterval(lockTimer);
  };
  tick();
  lockTimer = setInterval(tick, 1000);
}

// Initial load
chrome.storage.local.get(null, render);

// Live updates every 2s while popup is open
setInterval(() => chrome.storage.local.get(null, render), 2000);

// Mode buttons
const modeBtns = {
  light: document.getElementById("mode-light"),
  balanced: document.getElementById("mode-balanced"),
  focus: document.getElementById("mode-focus"),
};

function setMode(mode) {
  currentMode = MODES[mode] ? mode : "balanced";
  // Update button styles
  Object.keys(modeBtns).forEach((k) => {
    modeBtns[k].classList.toggle("active", k === currentMode);
  });
  updateThresholdUI(currentMode);
  chrome.storage.local.set({ ul_mode: currentMode });
}

// Set active mode from storage on popup open
chrome.storage.local.get("ul_mode", (data) => {
  const mode = data.ul_mode || "balanced";
  setMode(mode);
});

// Button click handlers
Object.keys(modeBtns).forEach((mode) => {
  modeBtns[mode].addEventListener("click", () => setMode(mode));
});
