# CC Udemy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved free bilingual-caption and word-lookup extension.

**Architecture:** Plain scripts in an isolated content-script world, scoped shadow DOM overlay, document-based Chrome Translator provider. Read real native text tracks or the observed Udemy DOM caption cue. Use cue identity and generation tokens to prevent stale translations and a bounded local cache.

**Tech Stack:** JavaScript, Chrome MV3, node:test, browser integration tests.

**Spec:** ../specs/2026-10-28-udemy-bilingual-design.md

## Global Constraints
- No API key, external translation endpoint or paid service.
- No build required for Load unpacked; Chrome 138+ desktop.
- No speech recognition; do not claim live Udemy verification from a fixture.
- Existing project directory is not a Git repository; implement in this dedicated workspace without creating an unrelated worktree.
- User approved design and said to implement; execute inline without another approval round.

## Review Focus
- DOM captions arriving after video discovery and replacement across lessons.
- Out-of-order translations while seeking, changing lessons or disabling.
- Playback state when dismissing or replacing word lookup.
- Language-pack creation requiring a real user gesture.
- Native caption restoration, fullscreen containment and narrow player layout.

### Task 1: Caption and translation core
**Files:** `src/captions.js`, `src/translator.js`, `src/playback.js`, `tests/core.test.cjs`, `package.json`.
**Interfaces:** `CCUdemy.cueAt(cues,time)`, `tokenize(text)`, `createTranslator({api,storage})`, `createPlaybackSession(video)`. Provider exposes `availability()`, `enable(onProgress)`, `translate(text)`, `peek(text)`.
- [x] Write tests for cue boundaries/overlap, punctuation and contractions, cache/retry/deduplication, unavailable provider, playback restoration and cancelled async results.
- [x] Run `npm test`; observe failures before implementation.
- [x] Implement the core and run `npm test` to green.

### Task 2: Udemy adapter and accessible overlay
**Files:** `manifest.json`, `src/udemy-adapter.js`, `src/overlay.js`, `src/overlay.css`, `src/content.js`, `src/popup.html`, `src/popup.js`, browser fixture/tests.
**Interfaces:** adapter returns `{video,container,read(),setEnabled(enabled),destroy()}`; `read()` returns `{english,vietnamese,key,upcoming}`. Overlay emits enable/disable, font-size, retry, word and dismiss events. Content controller owns revision tokens and cleanup.
- [x] Add failing DOM/browser tests for actual observed caption classes, late captions, translation/lookup, stale results, settings, native restoration and video replacement.
- [x] Implement adapter, UI and controller. Call Translator.create directly in trusted click flow before awaiting progress/storage.
- [x] Run unit and integration tests. Verify Chromium can load the manifest and detect Translator; separately record whether a real language pack is available.

### Task 3: Verification and delivery
**Files:** `README.md`, `scripts/package.mjs`, test screenshot/report, zip.
- [x] Run the whole suite and syntax/manifest checks.
- [x] Inspect rendered overlay at desktop and narrow sizes; run the Impeccable detector once on changed UI.
- [x] Request an independent review, resolve material issues and rerun affected/full tests.
- [x] Package only runtime files and installation instructions; give exact install steps and disclose live translation/Udemy limits.
