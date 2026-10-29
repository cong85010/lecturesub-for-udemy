# UI refresh — UI UX Pro Max

User requested replacing the current generic-looking interface using nextlevelbuilder/ui-ux-pro-max-skill. Existing functionality, settings and vocabulary stay supported.

Applied skill: `/Users/thanhcong/.codex/skills/ui-ux-pro-max/SKILL.md`. Search results verified Minimalism & Swiss Style and UX guidance for labeled forms, feedback, native controls and progressive disclosure. The generator's landing-page pattern, children's typography and productivity-timer palette do not fit this extension; they are not persisted as recommendations. Desktop-native settings patterns are the explicit fallback for those mismatches.

Direction: neutral off-white/white surfaces, charcoal text/actions, restrained rust accent; compact top navigation, four accessible settings tabs, adjacent preview, consistent popup/overlay styling. System UI font fits the desktop extension; no remote runtime font dependencies.

- [x] Add a regression for settings tab switching and arrow-key navigation; keep existing controls accessible.
- [x] Replace options layout/styles, add grouping tabs, polish shared controls, popup and overlay.
- [x] Check desktop/375/768/1024/1440 layouts and reduced motion; run unit/browser suites.
- [ ] Inspect screenshots, update DESIGN.md/version, package, and deliver the actual redesigned UI.

Evidence: observed missing tab regression before implementing accessible tabs; current browser suite passes keyboard tab activation, all four widths, reduced-motion focus, actual extension options/popup/storage and prior playback/dictionary regressions. Unit suite 19/19 and runtime syntax checks pass. Screenshots captured with animations disabled to show final selection state. DESIGN.md and README updated, version 0.2.1. ZIP integrity and inclusion of shared ui.css verified. Targeted independent UI review is pending.
