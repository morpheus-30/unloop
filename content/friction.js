let frictionActive = false;
let listenersAttached = false;
let isBlurActive = false;
let blurTimeout = null;

window.__ul_startFriction = function (stats) {
  if (frictionActive) return;
  frictionActive = true;
  showFrictionBanner(stats);
  attachInputBlockers();
};

// Called every time a new reel is counted (phase 3 only)
window.__ul_onReelChange = function () {
  if (!frictionActive) return;
  if (isBlurActive) return;

  const stats = window.__ul_getStats?.() || { count: 0, estimatedTime: "0s" };

  if (Math.random() < 0.5) {
    applyBlurAndBlock(stats);
  }
};

// ── Input blocking ───────────────────────────────────────
function attachInputBlockers() {
  if (listenersAttached) return;
  listenersAttached = true;

  function isOurUI(el) {
    return !!(
      el.closest?.("#ul-tap-gate") ||
      el.closest?.("#ul-blur-bar") ||
      el.closest?.("#ul-hud") ||
      el.closest?.("#ul-friction-banner")
    );
  }

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!isBlurActive) return;
      if (isOurUI(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true }
  );

  document.addEventListener(
    "mousedown",
    (e) => {
      if (!isBlurActive) return;
      if (isOurUI(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true }
  );

  document.addEventListener(
    "click",
    (e) => {
      if (!isBlurActive) return;
      if (isOurUI(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true }
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (!isBlurActive) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true }
  );

  document.addEventListener(
    "wheel",
    (e) => {
      if (!isBlurActive) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true, passive: false }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!isBlurActive) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { capture: true, passive: false }
  );
}

// ── Blur ─────────────────────────────────────────────────
function getBlurTarget() {
  return (
    document.querySelector('[role="main"]') ||
    document.querySelector("main") ||
    document.querySelector("section") ||
    document.body
  );
}

function applyBlurAndBlock(stats) {
  isBlurActive = true;

  const target = getBlurTarget();
  target.style.transition = "filter 0.4s ease";
  target.style.filter = "blur(20px)";
  target.style.pointerEvents = "none";

  chrome.runtime.sendMessage({ action: "muteTab" });

  showBlurProgress(5000, stats);

  if (blurTimeout) clearTimeout(blurTimeout);
  blurTimeout = setTimeout(() => removeBlur(), 5000);
}

function removeBlur() {
  isBlurActive = false;
  if (blurTimeout) {
    clearTimeout(blurTimeout);
    blurTimeout = null;
  }

  const target = getBlurTarget();
  target.style.filter = "blur(0px)";
  target.style.pointerEvents = "";
  setTimeout(() => {
    target.style.transition = "";
  }, 400);

  // Unmute
  // Unmute tab
  chrome.runtime.sendMessage({ action: "unmuteTab" });
  document.getElementById("ul-blur-bar")?.remove();
}

// ── Blur progress bar ─────────────────────────────────────
function showBlurProgress(duration, stats) {
  document.getElementById("ul-blur-bar")?.remove();

  const messages = [
    "You chose this over your goals.",
    "This is exactly how you waste your day.",
    "Nothing here is helping you.",
    "You’re avoiding what matters.",
    "Be honest—this is just distraction.",
    "You’re still here.",
    "Another reel, same outcome.",
    "You know this leads nowhere.",
    "This is the habit you said you’d fix.",
    "You’re trading time for nothing.",
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  const bar = document.createElement("div");
  bar.id = "ul-blur-bar";
  //randomnumber from 1-10

  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const imgSrc = chrome.runtime.getURL(`images/blur${randomNumber}.jpeg`);
  bar.innerHTML = `
  <div class="ul-bar-inner">
  
    <span class="ul-bar-message">${randomMessage}</span>
    <img src="${imgSrc}" class="ul-bar-img" />
    <span class="ul-bar-text">${stats.count} reels · ~${stats.estimatedTime} · resuming in</span>
    <div class="ul-bar-track">
      <div class="ul-bar-fill" id="ul-bar-fill"></div>
    </div>
  </div>
`;
  document.body.appendChild(bar);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const fill = document.getElementById("ul-bar-fill");
      if (fill) {
        fill.style.transition = `width ${duration}ms linear`;
        fill.style.width = "100%";
      }
    });
  });

  setTimeout(() => bar.remove(), duration);
}

// ── Banner ────────────────────────────────────────────────
function showFrictionBanner(stats) {
  document.getElementById("ul-friction-banner")?.remove();

  const banner = document.createElement("div");
  banner.id = "ul-friction-banner";
  banner.innerHTML = `
    <span class="ul-fb-icon">⚠</span>
    <span class="ul-fb-text"><strong>${stats.count} reels</strong> · ~${stats.estimatedTime} · Slowing down</span>
    <button class="ul-fb-close" id="ul-fb-close">×</button>
  `;
  document.body.appendChild(banner);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => banner.classList.add("ul-fb-visible"))
  );

  document.getElementById("ul-fb-close").onclick = () => {
    banner.classList.remove("ul-fb-visible");
    setTimeout(() => banner.remove(), 300);
  };

  setTimeout(() => {
    if (banner.parentNode) {
      banner.classList.remove("ul-fb-visible");
      setTimeout(() => banner.remove(), 300);
    }
  }, 5000);
}
