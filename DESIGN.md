# CC Udemy · Reading Room · 0.3.1

The user selected generated concept B (Reading Room) after rejecting the earlier generic form and neutral utility treatments. The approved image is the visual authority: `/Users/thanhcong/.codex/generated_images/01a1830e-6e3f-7402-9539-241f1742183f/exec-b0145c85-8945-416e-97e3-ca0e1c3a93aa.png`.

## Composition

Paper-white workspace, near-black wordmark/type, restrained chartreuse selections. Permanent language inspector on the left, three advanced tabs underneath, large example lesson on the right. Match this content hierarchy rather than treating the redesign as a palette swap.

The example background is a local generated image plate; editable lesson title, teaching diagram, subtitles, dictionary, playback and settings remain HTML/SVG. It is always labeled as an example, not a live Udemy stream. Source text/meaning are authored English–Vietnamese samples, not a model availability claim. No pronunciation or hover-lookup feature is implied by incidental pixels in the approved concept.

## System and controls

- Shared tokens in `src/ui.css`: warm paper/white surfaces, charcoal text/action, chartreuse `#c6ed61`, dark-green accessible focus/link color.
- System UI sans with a confident black wordmark. Compact labeled controls, native language selects, accessible segmented radio groups, color presets plus custom picker, numeric font-size controls.
- Language controls stay visible while Kiểu chữ / Bố cục / Tra từ panels switch. Tabs and radio groups support arrow keys/Home/End and retain one tab stop per group.
- User caption colors/fonts/sizes remain independent of the UI theme and are preserved on update.

## Preview and word cards

- Main preview is an editorial lesson canvas with a local image background, an HTML title and simple semantic SVG diagram.
- A 12-second sample can play/pause/seek. Leaving the page/view pauses it. Clicking the highlighted word opens/closes an example definition; saving is explicit and labeled Lưu từ mẫu.
- Example captions/definition remain bounded at maximum offsets and narrow sizes. Real player keeps its existing adaptive font fit.
- Live selected words get chartreuse emphasis; their definition card anchors near the selected word, with save/notebook actions and visible loading/error feedback.

## Popup and responsive

- Compact text wordmark and enabled switch; stacked language picks; three-way subtitle mode; black settings action and secondary notebook action.
- Desktop 1024–1440px preserves the inspector/lesson split. Smaller widths retain all controls; at <=640px the inspector and preview stack.
- Keyboard focus, skip navigation, native track restoration, reduced motion, translated-only/source-only modes and local storage behaviors must keep passing their regressions.

## Assets and provenance

Local lesson background: `src/assets/lesson-preview.png`. Built-in imagegen source and prompt are recorded in `docs/design/reading-room-assets.md`. No remote runtime font/image dependency.
