# Privacy Policy for Unloop

Last updated: April 4, 2026

Unloop is a Chrome extension that helps users reduce compulsive short-form video scrolling on Instagram Reels and YouTube Shorts.

## What Unloop collects

Unloop does not collect personal information for transmission to a server.

The extension processes limited browsing activity on supported pages only:

- current page URL and path on `instagram.com` and `youtube.com`
- whether the active page is a Reels or Shorts view
- page video state needed to count watched items in the current session

The extension stores the following data locally in `chrome.storage.local` on the user's device:

- current session reel/short count
- session start time
- selected mode (`light`, `balanced`, or `focus`)
- daily totals
- lifetime totals
- lock and cooldown state

## How Unloop uses data

This data is used only to provide the extension's user-facing features:

- count watched reels and shorts
- estimate session time spent
- apply progressive friction and cooldowns
- show popup dashboard statistics
- restore session state after refresh
- mute and unmute the current tab during friction events

## What Unloop does not do

- does not sell user data
- does not share user data with third parties
- does not send browsing history, page content, or usage analytics to any remote server
- does not use data for advertising
- does not use data for creditworthiness, lending, or eligibility decisions

## Permissions explanation

- `storage`: saves mode, session counters, totals, and cooldown state locally
- `alarms`: supports daily reset behavior
- `tabs`: mutes and unmutes the current tab during friction events
- host access to `instagram.com` and `youtube.com`: needed to detect Reels and Shorts pages and inject the on-page UI

## Data retention

Data remains on the user's device until:

- it is naturally reset by extension logic
- the user clears extension storage
- the extension is removed

## Contact

If you publish Unloop, replace this section with your real support contact email or website before submitting to the Chrome Web Store.
