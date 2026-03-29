// worker.js — background service worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    ul_locked: false,
    ul_session_count: 0,
    ul_total_reels: 0,
    ul_total_seconds: 0,
    ul_today_count: 0,
    ul_today: new Date().toDateString(),
  });
});

// Reset today count at midnight
chrome.alarms.create("midnight-reset", {
  when: getNextMidnight(),
  periodInMinutes: 1440,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "midnight-reset") {
    chrome.storage.local.set({
      ul_today: new Date().toDateString(),
      ul_today_count: 0,
    });
  }
});

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === "muteTab") {
    chrome.tabs.update(sender.tab.id, { muted: true });
  }
  if (msg.action === "unmuteTab") {
    chrome.tabs.update(sender.tab.id, { muted: false });
  }
});
