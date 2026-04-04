# Chrome Web Store Submission Notes

Last updated: April 4, 2026

## One-line summary

Unloop adds progressive friction to Instagram Reels and YouTube Shorts by counting watched items locally and slowing the session before it turns into a doomscroll.

## Suggested short description

Reduce doomscrolling on Reels and Shorts with local session tracking, soft nudges, friction, and cooldowns.

## Suggested full description

Unloop helps you interrupt compulsive short-form video scrolling without fully blocking the apps you use.

On Instagram Reels and YouTube Shorts, Unloop tracks the current session locally on your device and gradually increases friction as the session grows:

- soft interruption after early use
- stronger friction deeper into the session
- cooldown lock after the session cap is reached
- live popup dashboard with session stats and thresholds
- adjustable modes for lighter or stricter limits

How it works:

- counts watched reels or shorts in the current session
- estimates time spent
- shows a soft overlay after the soft threshold
- adds blur and tab mute during deeper scrolling
- pauses the session with a cooldown at the lock threshold

Unloop does not send your browsing activity to a remote server. Session and stats data are stored locally using Chrome extension storage.

## Data disclosure notes for listing

You should disclose that:

- the extension reads page state on `instagram.com` and `youtube.com`
- usage data is stored locally on-device
- no personal data is sold or shared
- no remote analytics or advertising SDKs are used

## Assets checklist

- 128x128 extension icon
- store tile images
- at least one screenshot of the popup
- at least one screenshot of the in-page overlay or HUD
- privacy policy URL hosted publicly

## Final QA checklist

- direct open to `youtube.com/shorts` counts correctly
- navigate from `youtube.com` to Shorts counts correctly
- Instagram Reels still counts correctly
- popup mode changes update live
- cooldown lock triggers and clears correctly
- no console errors on supported pages
- no remote font or third-party requests are made by the extension UI
