# Unloop

A browser extension that breaks the doomscroll loop on Instagram Reels and YouTube Shorts through progressive friction — not hard blocks.

---

## What it does

Unloop watches how many reels you've watched in a session and applies increasing resistance the deeper you go. It doesn't stop you — it makes you conscious of the choice to keep going.

```
Phase 1 → Light usage         → No interruption
Phase 2 → Threshold reached   → Soft overlay prompt
Phase 3 → Deep usage          → Blur + mute friction
Phase 4 → Hard limit          → Session lock + cooldown
```

---

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `unloop/` folder

The extension icon will appear in your toolbar. It only activates on `instagram.com/reels` and `youtube.com/shorts`.

---

## File structure

```
unloop/
├── manifest.json
├── background/
│   └── worker.js         — Tab mute control, midnight reset alarm
├── content/
│   ├── observer.js       — Scroll counter, session tracker, HUD
│   ├── overlay.js        — Phase 2 soft interrupt card
│   ├── friction.js       — Phase 3 blur + mute friction engine
│   └── lock.js           — Phase 4 session lock + countdown
├── popup/
│   ├── popup.html        — Dashboard UI
│   └── popup.js          — Live stats, mode switcher
└── styles/
    └── overlay.css       — All injected UI styles
```

---

## Modes

Set your friction level from the popup:

| Mode     | Soft interrupt | Deep friction | Best for       |
| -------- | -------------- | ------------- | -------------- |
| Light    | 6 reels        | 10 reels      | Casual use     |
| Balanced | 4 reels        | 6 reels       | Default        |
| Focus    | 2 reels        | 4 reels       | Deep work days |

The lock threshold is always 60 reels regardless of mode.

---

## How the friction works

**Phase 2 — Soft overlay**
A card appears over the feed showing how many reels you've watched and an estimated time spent. You can continue or take a break. It doesn't block the feed underneath.

**Phase 3 — Blur friction**
On 50% of reels, the feed blurs for 5 seconds and the tab is muted. A progress bar counts down. After the blur lifts, you can scroll normally. This repeats randomly as you continue.

**Phase 4 — Session lock**
A fullscreen lock screen appears with a 15-minute countdown timer. The circular progress ring drains in real time. Stats from the session are shown (reels watched, estimated time spent).

---

## Session tracking

- Count persists across page refreshes for up to 2 hours
- After 2 hours of inactivity the session resets automatically
- Today's count and all-time totals are stored separately
- The popup shows live session stats, phase, and lifetime totals

---

## Popup dashboard

Open the extension popup any time to see:

- Reels watched this session + estimated time
- Current phase (4-dot indicator)
- Session progress bar with threshold markers
- Today / all-time / total time stats
- Mode selector (Light / Balanced / Focus)
- On/off toggle

---

## Permissions

| Permission | Why                                      |
| ---------- | ---------------------------------------- |
| `storage`  | Save session count, mode, lifetime stats |
| `alarms`   | Reset today's count at midnight          |
| `tabs`     | Mute/unmute the tab during blur friction |

---

## Known limitations

- Instagram's CSS class names (like `xp9pnto`) occasionally change when Instagram pushes frontend updates. If counting stops working, open DevTools console on the Reels page and run the debug selector script to find the new class.
- YouTube Shorts support uses `ytd-reel-video-renderer` — this is stable but may need updating after major YouTube redesigns.
- The extension cannot detect reels watched before it was installed.

---

## Thresholds (default — Balanced mode)

```js
const MODES = {
  light: { soft: 6, deep: 10, lock: 60 },
  balanced: { soft: 4, deep: 6, lock: 60 },
  focus: { soft: 2, deep: 4, lock: 60 },
};
```

To change the cooldown duration, edit `COOLDOWN_MINUTES` in `content/lock.js`.

---

## Built with

- Manifest V3 Chrome Extension API
- `IntersectionObserver` for reel detection
- `chrome.storage.local` for persistence
- `chrome.tabs` for tab-level mute
- `WeakSet` for deduplication of counted elements
- No external dependencies — vanilla JS only
