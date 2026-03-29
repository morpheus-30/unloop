// overlay.js — Phase 2 animated soft interrupt

let overlayShown = false;

window.__ul_showOverlay = function (stats) {
  if (overlayShown) return;
  overlayShown = true;

  const el = document.createElement("div");
  el.id = "ul-overlay";
  el.innerHTML = `
    <div class="ul-backdrop"></div>
    <div class="ul-card" id="ul-card">
      <div class="ul-card-inner">
        <div class="ul-icon-wrap">
          <div class="ul-icon-ring"></div>
          <div class="ul-icon-ring ul-ring2"></div>
          <span class="ul-icon-glyph">∞</span>
        </div>
        <h2 class="ul-title">Still scrolling?</h2>
        <p class="ul-body">You've watched</p>
        <div class="ul-stat-row">
          <div class="ul-stat">
            <span class="ul-stat-num" id="ul-ov-count">${stats.count}</span>
            <span class="ul-stat-label">reels</span>
          </div>
          <div class="ul-stat-divider"></div>
          <div class="ul-stat">
            <span class="ul-stat-num" id="ul-ov-time">~${stats.estimatedTime}</span>
            <span class="ul-stat-label">estimated</span>
          </div>
        </div>
        <div class="ul-btn-group">
          <button class="ul-btn ul-btn-break" id="ul-ov-break">
            <span class="ul-btn-icon">↗</span>Take a break
          </button>
          <button class="ul-btn ul-btn-continue" id="ul-ov-continue">
            Keep watching
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(el);

  // Trigger entrance animation after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("ul-visible");
    });
  });

  document.getElementById("ul-ov-break").onclick = () =>
    dismissOverlay(el, true);
  document.getElementById("ul-ov-continue").onclick = () =>
    dismissOverlay(el, false);
};

function dismissOverlay(el, takeBreak) {
  el.classList.add("ul-dismissing");
  setTimeout(() => {
    el.remove();
    overlayShown = false;
    if (takeBreak) {
      window.__ul_resetCount?.();
      // Don't use history.back() — just go to instagram home
      location.href = "https://www.instagram.com/";
    }
    // If continue — do nothing, just dismiss
  }, 320);
}
