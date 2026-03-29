// lock.js — Phase 4 session lock + animated cooldown

const COOLDOWN_MINUTES = 15;

window.__ul_lockSession = function (stats) {
  const unlockAt = Date.now() + COOLDOWN_MINUTES * 60 * 1000;
  chrome.storage.local.set({
    ul_locked: true,
    ul_unlock_at: unlockAt,
    ul_lock_stats: stats
  });
  showLockScreen(unlockAt, stats);
};

function showLockScreen(unlockAt, stats) {
  // Remove any existing lock
  document.getElementById('ul-lock')?.remove();

  const lock = document.createElement('div');
  lock.id = 'ul-lock';

  lock.innerHTML = `
    <div class="ul-lock-bg"></div>
    <div class="ul-lock-card">
      <div class="ul-lock-icon-wrap">
        <svg class="ul-lock-ring-svg" viewBox="0 0 120 120">
          <circle class="ul-ring-bg" cx="60" cy="60" r="50" />
          <circle class="ul-ring-progress" id="ul-ring-prog" cx="60" cy="60" r="50"
            stroke-dasharray="314"
            stroke-dashoffset="0" />
        </svg>
        <span class="ul-lock-glyph">⏸</span>
      </div>

      <h2 class="ul-lock-title">Session paused</h2>
      <p class="ul-lock-sub">You've watched <strong>${stats?.count || 0} reels</strong><br>
        (≈ ${stats?.estimatedTime || '0m'} of your time)</p>

      <div class="ul-lock-timer" id="ul-lock-timer">--:--</div>
      <p class="ul-lock-hint">Take a walk. Drink some water.</p>

      <div class="ul-lock-stats">
        <div class="ul-ls-item">
          <span class="ul-ls-num" id="ul-ls-reels">${stats?.count || 0}</span>
          <span class="ul-ls-label">reels this session</span>
        </div>
        <div class="ul-ls-item">
          <span class="ul-ls-num" id="ul-ls-time">~${stats?.estimatedTime || '0m'}</span>
          <span class="ul-ls-label">time spent</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(lock);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => lock.classList.add('ul-visible'));
  });

  const totalMs = COOLDOWN_MINUTES * 60 * 1000;
  const circumference = 314;

  function tick() {
    const remaining = Math.max(0, unlockAt - Date.now());
    const totalSecs = Math.ceil(remaining / 1000);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');

    const timerEl = document.getElementById('ul-lock-timer');
    const ringEl = document.getElementById('ul-ring-prog');
    if (timerEl) timerEl.textContent = `${m}:${s}`;

    if (ringEl) {
      const progress = remaining / totalMs;
      ringEl.style.strokeDashoffset = circumference * (1 - progress);
    }

    if (remaining <= 0) {
      clearInterval(timer);
      chrome.storage.local.set({ ul_locked: false });
      lock.classList.add('ul-dismissing');
      setTimeout(() => {
        lock.remove();
        window.__ul_resetCount?.();
      }, 400);
    }
  }

  const timer = setInterval(tick, 1000);
  tick();
}

// Check on page load if a lock is still active
chrome.storage.local.get(['ul_locked', 'ul_unlock_at', 'ul_lock_stats'], (data) => {
  if (data.ul_locked && data.ul_unlock_at > Date.now()) {
    showLockScreen(data.ul_unlock_at, data.ul_lock_stats);
  }
});
