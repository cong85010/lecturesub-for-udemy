# Configurable CC Udemy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship multilingual settings, better caption controls and a local vocabulary notebook.
**Architecture:** Shared validated settings; background serializes storage mutations. Document-based Translator switches language pairs with revision guards and isolated cache keys. Popup/options share UI controls; overlay remains in the player.
**Tech Stack:** Plain JS, Chrome MV3, node:test, Playwright dev-only.
**Spec:** ../specs/2026-10-28-configurable-extension-draft.md

## Global Constraints
- Free, no API key, no remote text translation endpoint, no new host permissions.
- Existing dedicated non-Git workspace; preserve v0.1 settings/cache and regression tests.
- User delegated selection of extra learning features; implement configuration and vocabulary, defer precise cue looping.

## Review Focus
- Concurrent changes from multiple extension tabs and slow storage.
- Language switches while language packs or translations are pending.
- Safe CSV output and safe display of words/captions from Udemy.
- Narrow/short players, source-only/translation-only modes and font fitting.
- Keyboard focus, optional pause/resume, save retry and persistence failures.

### Task 1: Shared state and multilingual provider
Files: settings.js, languages.js, library.js, store.js, client.js, background.js, translator.js, playback.js, tests/config.test.cjs.
- [x] Write and observe failing tests for settings migration/validation, language-pair caches/stale creation, serialized patches/vocabulary and CSV escaping.
- [x] Implement normalization, paired provider and background storage/message boundary; pass unit suite.
Interfaces: normalizeSettings(input), LANGUAGES; createStore(storage).handle(message); call(type,payload); createTranslator().setLanguages(source,target); library CSV utilities.

### Task 2: Player controls and vocabulary capture
Files: udemy-adapter.js, content.js, overlay.js/css, manifest.
- [x] Add failing integration checks for changing languages/modes, optional pause/resume and saving a word with context.
- [x] Generalize source/target tracks; reset stale jobs only on pair changes, preserve translations on appearance changes. Add compact controls, status, settings and save action.
- [x] Keep previous cue/fullscreen/narrow/track-restoration regressions green.

### Task 3: Configuration UI and notebook
Files: controls.js, options.html/js/css, popup.html/js/css.
- [x] Add browser checks for real extension options/popup, migration, persistence, preview/reset, vocabulary search/delete/CSV and cross-tab changes.
- [x] Build grouped auto-saving settings and labeled preview, quick popup and accessible vocabulary list. No fake claims about available languages or actual translation quality.

### Task 4: Review and delivery
- [x] Run full unit/browser/syntax checks and inspect screenshots at desktop/narrow sizes.
- [x] Independent read-only review; fix material regressions with failing tests first.
- [x] Update README/version to 0.2.0 and package; clearly separate fixture and live translation evidence.
