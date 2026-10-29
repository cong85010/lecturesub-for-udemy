# Progress — 2026-10-28-udemy-bilingual.md

Pre-flight: Task 2 consumes the provider and playback interfaces from Task 1; names and lifecycle agree. Task 3 consumes the unpacked manifest and runtime source; no build step.

Implementation note: this directory is a dedicated non-Git workspace. Keep progress here; do not invent commit history or an unrelated worktree.

Integration evidence: live Udemy video has no text tracks; its caption text is in `captions-display-module--captions-cue-text--…` within the video container. Implement DOM fallback first, alongside native-track support.

Task 1: complete — npm test: 8/8 passed after observing the missing implementation failures.

Task 2: implementation complete — browser tests passed for DOM/native captions, Vietnamese native track selection, stale results, toggle/native restoration, lesson replacement, word lookup/focus, fullscreen and desktop/narrow containment. Independent disposable-profile Chromium loaded the exact manifest. Actual Translator probe is recorded separately and must not be equated with the deterministic translation fixture.

Visual fix: narrow player originally clipped lookup above the video; added a failing containment assertion and moved positioning into player coordinates with resize observation. The regression now passes. Impeccable detector returned no findings.

Final review: independent read-only reviewer found two P2 issues and no critical issues. Both were reproduced with failing browser assertions and fixed: bounded bilingual rows with automatic font fitting for longer cues in short players, and atomic restoration of the latest native subtitle selection. Browser suite and all 8 unit tests pass after fixes; runtime JS syntax checks pass.

Final: minor (deferred): browser playback fixture has no playable media, so pause/resume integration is covered by the state-machine unit test, not a real playback transition in the fixture. This does not establish behavior on a live Udemy lesson.

Final verification limits: actual Chrome Translator was still downloading after a 12-second probe in a clean temporary profile. No successful real model translation or live installed-extension Udemy E2E is claimed. Real Udemy fullscreen behavior and translation quality remain unverified; only fixture containment and translation lifecycle were tested.

Task 3: complete — package generated, contents inspected, final unit/browser/syntax checks green; README includes installation steps and all material verification limits.
