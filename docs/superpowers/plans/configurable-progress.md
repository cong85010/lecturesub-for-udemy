# Progress — 2026-10-28-configurable-extension.md

User wants many more features/full configuration and improved UI/UX; no specific extra learning priority. Implementer chose settings + vocabulary, deferring replay without reliable timing. Existing dark player identity is preserved; full settings become a separate extension options tab with live sample preview. No new approval round is needed for the already-requested implementation.

Pre-flight: shared normalized settings feed provider, adapter, UI and storage. Background is the single writer for mutations; translation creation stays in content-script trusted click flow. No code from the page is executed and no text is transmitted to remote translation endpoints.

Task 1: complete. Observed 8 new failing tests, then 16/16 unit tests passed for migration/validation, serialized settings/word storage, CSV safety, language cache isolation/stale creation and pause/resume options.

Tasks 2–3: implemented. Browser tests pass for language/mode switches, word save/context, playable canvas stream pause/resume preferences, keyboard shortcut while caption focus is active, stale captions, native tracks/restoration, fullscreen and short/narrow player containment. Exact manifest loads in a disposable profile; actual options/popup persist and synchronize across Udemy/options/popup, preview/reset work, notebook search/delete/undo/CSV work. Desktop and narrow screenshots inspected.

Regression found during verification: overlay stopped all keydown bubbling, blocking Alt+Shift+C while a caption was focused. A failing focused-shortcut browser assertion reproduced this; allowing the specific shortcut to reach the document handler made it pass.

Verification boundary: live Chrome Translator probe remains downloading after 12 seconds in a clean profile. No successful live translation or full Udemy E2E is claimed. Native caption/translation fixtures and real extension UI/storage tests are distinct evidence.

Final review: independent reviewer found two P2 issues and no critical findings. Fixed both with failing regressions before implementation: early storage subscription and event counters prevent stale initialization/mutation responses overwriting newer settings in content/options/popup; only explicit word retries preserve an earlier occurrence, while fresh clicks record the current sentence/time.

Final verification (2026-10-29): npm test 19/19 green; browser main suite and separate options/popup delayed-response suite green; runtime syntax checks green; Impeccable detector returned []; v0.2.0 unpacked folder and ZIP generated and ZIP contents/integrity inspected.

Final: minor (deferred): popup shows configuration loading/saving status; translator availability/download status is shown on the video and full settings page, rather than additionally in the quick popup.

Task 4: complete. No new permissions beyond storage; distribution stays at dist/cc-udemy so existing unpacked installations can reload without losing local data. Real-model/Udemy validation limits remain explicit in README.
