# LectureSub study prototype

Goal: Try the approved transcript → server → DeepSeek → saved questions and flashcards flow without requiring learners to bring an AI account.

This is a local prototype, not a public AI service. Keep the existing Reading Room style. The server binds to loopback, keeps the DeepSeek key in its environment and accepts only the configured extension origin. No deployment or public endpoint is included.

- [x] Add transcript extraction using observed Udemy transcript-panel/cue-text selectors. Reject missing/oversized transcripts, discard reads when the lesson changes.
- [x] Add a local Node server calling DeepSeek JSON mode, bounded payloads, timeout, concurrency/rate limits and strict output validation with source quotes.
- [x] Add an extension background service for generation, duplicate-request suppression, local persistence and a study page. Ask for transcript consent on each generation.
- [x] Add question reveal, flashcard flip, simple due dates, library navigation and saved-deck reuse. Expose “Ôn bài” on the player and popup.
- [x] Test missing transcript, bad AI output, API errors, caching, storage, consent, questions and card interactions. Run existing suites, package and inspect screenshots.

Provider: DeepSeek, selected by the user. Implementation choice: plain Node HTTP server and the existing vanilla JS MV3 extension. Configure DEEPSEEK_API_KEY and EXTENSION_ID on the server; never include credentials in extension assets. No secrets will be searched from unrelated projects. A live generation requires the owner to configure the key.

Verification: unit suite plus the existing browser suite pass; the study browser test runs the real extension and local HTTP server with a mocked paid DeepSeek boundary. Desktop/narrow screenshots inspected. Live DeepSeek generation has not been verified: no key configured. Impeccable detector reports pre-existing tiny popup copy and a popup hover contrast warning; no new study-surface findings.

Server implementation and paid-provider integration tests were subsequently moved into a separate private repository; the public extension owns only capture, API calls, local storage and UI.
