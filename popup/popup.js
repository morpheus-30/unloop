// popup.js

const AVG_SECS = 18;

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

function updatePhaseUI(count) {
  const phases = [
    { label: "Light usage", dotClass: "active" },
    { label: "Soft interrupt", dotClass: "warn" },
    { label: "Deep usage", dotClass: "warn" },
    { label: "Session locked", dotClass: "danger" },
  ];

  let phase = 0;
  if (count >= 60) phase = 3;
  else if (count >= 40) phase = 2;
  else if (count >= 20) phase = 1;

  document.getElementById("phase-text").textContent = phases[phase].label;

  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot${i + 1}`);
    dot.className = "phase-dot";
    if (i < phase) dot.classList.add("active");
    if (i === phase) dot.classList.add(phases[phase].dotClass);
  }

  // Progress bar
  const pct = Math.min(100, (count / 60) * 100);
  const fill = document.getElementById("progress-fill");
  fill.style.width = `${pct}%`;
  fill.className = "progress-fill";
  if (count >= 40) fill.classList.add("danger");
  else if (count >= 20) fill.classList.add("warn");

  // Big numbers color
  const countEl = document.getElementById("pop-count");
  const timeEl = document.getElementById("pop-time");
  countEl.className = "big-num";
  timeEl.className = "big-num";
  if (count >= 40) {
    countEl.classList.add("danger");
    timeEl.classList.add("danger");
  } else if (count >= 20) {
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
  if (count > 0)
    document.getElementById("session-card").classList.add("has-data");

  // Phase UI
  updatePhaseUI(count);

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

// Toggle handler
document.getElementById("main-toggle").addEventListener("change", (e) => {
  chrome.storage.local.set({ ul_enabled: e.target.checked });
});

// Restore toggle state
chrome.storage.local.get("ul_enabled", (data) => {
  const enabled = data.ul_enabled !== false;
  document.getElementById("main-toggle").checked = enabled;
});

// Mode buttons
const modeBtns = {
  light: document.getElementById("mode-light"),
  balanced: document.getElementById("mode-balanced"),
  focus: document.getElementById("mode-focus"),
};

function setMode(mode) {
  // Update button styles
  Object.keys(modeBtns).forEach((k) => {
    modeBtns[k].classList.toggle("active", k === mode);
  });
  // Save to storage — observer.js will pick this up on next page load
  chrome.storage.local.set({ ul_mode: mode });
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
