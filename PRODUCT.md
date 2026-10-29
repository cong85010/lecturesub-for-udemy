# CC Udemy

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Approved design: unpacked Chrome Manifest V3 extension, plain JavaScript, HTML and CSS. No build or paid service required.

## Users
The user watches English-language courses on Udemy and wants to understand the lesson while learning vocabulary.

## Product Purpose
Show configurable bilingual captions and let the learner look up and save words while watching a lesson.

## Operating Context
Desktop Chrome, Udemy lecture player, including fullscreen. The actual open Udemy player renders captions in DOM and exposes no native text tracks (observed 2026-10-28).

## Capabilities and Constraints
Free, no API key. Source/target languages and caption appearance are configurable; use matching native tracks when available, otherwise Chrome Translator. Download a language pack on first use. Local vocabulary stores words with lesson context and supports search/CSV. Popup and full options page share validated settings. Paid AI translation, speech recognition and precise cue looping remain future scope. Word lookup is single-word translation, not a full dictionary.

## Brand Commitments
User reference: Language Reactor functionality. Keep the Udemy lesson central; interface copy in Vietnamese.

## Product Principles
- Keep captions aligned with the current lesson.
- Show honest availability and translation errors.
- Keep course text on the device.
- Respect the learner's playback state.
