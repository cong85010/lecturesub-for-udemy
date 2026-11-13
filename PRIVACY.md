# Privacy Policy for LectureSub for Udemy

Last updated: November 1, 2026

**LectureSub for Udemy** ("the Extension") is dedicated to protecting your privacy. This Privacy Policy explains our practices regarding user data.

## 1. Information Collection and Usage

- **No Personal Data Collected:** LectureSub does not collect, transmit, sell, or share any personal information, browsing history, Udemy account credentials, or payment details.
- **Local Storage:** All settings (such as font size, colors, target language, and subtitle display modes), saved study decks and your saved vocabulary list are stored strictly on your local device via Chrome's `chrome.storage.local` API.
- **No Remote Tracking or Analytics:** The extension contains zero tracking scripts, telemetry, analytics cookies, or advertising SDKs.

## 2. Permissions Justification

- **`storage`**: Used exclusively to store your personal caption preferences and your saved vocabulary notebook locally in your browser.
- **Host Permission (`https://www.udemy.com/*`)**: Required solely to read existing course subtitles and render the bilingual subtitle overlay, controls, and contextual definition card on Udemy lecture pages.

## 3. Translation Processing

Translations are performed using Google Chrome's built-in on-device Translator API. Caption translation does not send text to third-party translation servers. The separate optional study feature sends the lecture title and transcript through the configured local LectureSub server to DeepSeek only after the user consents and clicks Generate. This is not on-device AI; DeepSeek processes that submitted text under its own privacy terms. No Udemy cookies, credentials, or video are sent. The local prototype does not log or persist transcript on the server. Generated decks stay in local extension storage. Up to five temporary transcript drafts remain locally for at most 30 minutes of validity, with expired drafts purged on the next capture.

The development build additionally requests `http://127.0.0.1:8787/*` to contact the local study server; it does not ship a public AI endpoint.

## 4. Third-Party Disclaimer

LectureSub is an independent open-source tool and is not affiliated with, endorsed by, or sponsored by Udemy, Inc. "Udemy" is a registered trademark of Udemy, Inc.

## 5. Contact

If you have questions or feedback regarding this Privacy Policy, please contact:
- Email: contact@congphan.dev
- Website: https://lecturesub.congphan.dev
- GitHub Issues: https://github.com/cong85010/lecturesub-for-udemy/issues
