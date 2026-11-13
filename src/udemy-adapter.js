(() => {
  'use strict';
  const app = globalThis.CCUdemy ||= {};
  app.findVideo = () => [...document.querySelectorAll('video')]
    .filter(video => video.getBoundingClientRect().width > 100)
    .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];

  app.createUdemyAdapter = (video, getLanguages = () => ({ sourceLanguage: 'en', targetLanguage: 'vi' })) => {
    const container = video.closest('[data-purpose="video-player"], [class*="video-player--video-player"], [class*="video-viewer"], [class*="video-container"]')
      || video.closest('[id^="shaka-video-container-"]')
      || video.parentElement;
    let enabled = false;
    const oldPosition = container.style.position;
    const changedPosition = getComputedStyle(container).position === 'static';
    if (changedPosition) container.style.position = 'relative';
    const oldModes = new Map();
    const style = document.createElement('style');
    style.id = 'cc-udemy-native-caption-style';
    style.textContent = `
      html[data-cc-udemy-active] [class*="captions-display"],
      html[data-cc-udemy-active] [class*="captions-container"],
      html[data-cc-udemy-active] [data-purpose*="captions-display"],
      html[data-cc-udemy-active] [data-purpose*="caption-cue"],
      html[data-cc-udemy-active] [data-purpose*="captions-cue-text"],
      html[data-cc-udemy-active] [class*="shaka-text-container"],
      html[data-cc-udemy-active] [class*="well--text"],
      html[data-cc-udemy-active] [class*="well--container"],
      html[data-cc-udemy-active] [class*="well--container"] [class*="text"],
      html[data-cc-udemy-active] [class*="well--container"] span,
      html[data-cc-udemy-active] [class*="captions-under"],
      html[data-cc-udemy-active] [class*="captions-below"],
      html[data-cc-udemy-active] [data-purpose*="captions-under"],
      html[data-cc-udemy-active] [data-purpose*="captions-below"],
      html[data-cc-udemy-active] [class*="video-viewer--captions"],
      html[data-cc-udemy-active] [data-cc-udemy-native-cue],
      [data-cc-udemy-active] [class*="captions-display"],
      [data-cc-udemy-active] [class*="captions-container"],
      [data-cc-udemy-active] [data-purpose*="captions-display"],
      [data-cc-udemy-active] [data-purpose*="caption-cue"],
      [data-cc-udemy-active] [class*="shaka-text-container"],
      [data-cc-udemy-active] [data-cc-udemy-native-cue] {
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `;
    (document.head || container).append(style);

    const language = track => {
      const lang = (track.language || '').toLowerCase();
      if (/^en(?:-|$)/.test(lang) || (!lang && /english|tiếng anh/i.test(track.label))) return 'en';
      if (/^vi(?:-|$)/.test(lang) || (!lang && /vietnamese|tiếng việt/i.test(track.label))) return 'vi';
      if (/^zh-(hant|tw|hk)/.test(lang)) return 'zh-Hant';
      return lang.split('-')[0];
    };

    function prepareTracks() {
      if (!enabled) return;
      const tracks = [...video.textTracks].filter(track => ['subtitles', 'captions'].includes(track.kind));
      const { sourceLanguage, targetLanguage } = getLanguages();
      // A host selection changes one or more modes away from our "hidden" state.
      // Snapshot the whole set together so restoring never resurrects a second selection.
      if (tracks.some(track => oldModes.has(track) && track.mode !== 'hidden')) {
        for (const track of tracks) oldModes.set(track, track.mode);
      }
      for (const track of tracks) {
        if (!['subtitles', 'captions'].includes(track.kind)) continue;
        if ([sourceLanguage, targetLanguage].includes(language(track)) || track.mode === 'showing') {
          if (!oldModes.has(track)) oldModes.set(track, track.mode);
          if (track.mode !== 'hidden') {
            track.mode = 'hidden';
          }
        }
      }
    }

    let autoCaptionAttempted = false;
    function tryAutoEnableUdemyCaptions() {
      if (!enabled || autoCaptionAttempted) return;
      const { sourceLanguage } = getLanguages();
      const tracks = [...video.textTracks];
      const sourceTrack = tracks.find(track => language(track) === sourceLanguage);
      if (sourceTrack?.cues?.length) return;

      const cueSelector = '[class*="captions-cue-text"], [data-purpose="captions-cue-text"], [data-purpose="caption-cue"], [data-purpose*="caption-cue"], [class*="well--text"]';
      if (container?.querySelector?.(cueSelector) || document?.querySelector?.(cueSelector)) return;

      const ccBtn = (container?.querySelector && container.querySelector('[data-purpose="captions-dropdown-button"], button[aria-label*="Captions" i], button[aria-label*="Subtitles" i], button[data-purpose*="captions" i]'))
        || (typeof document !== 'undefined' && document?.querySelector && document.querySelector('[data-purpose="captions-dropdown-button"], button[aria-label*="Captions" i], button[aria-label*="Subtitles" i]'));
      if (!ccBtn || typeof ccBtn.click !== 'function') return;

      const btnLabel = (ccBtn.getAttribute('aria-label') || '').toLowerCase();
      if (btnLabel.includes('english') && !btnLabel.includes('off') && !btnLabel.includes('tắt')) return;

      autoCaptionAttempted = true;
      try {
        if (ccBtn.getAttribute('aria-haspopup') !== 'true' && ccBtn.dataset.purpose === 'captions-toggle-button') {
          ccBtn.click();
          return;
        }
        ccBtn.click();
        setTimeout(() => {
          const menuItems = document.querySelectorAll('[role="menuitemradio"], [data-purpose*="captions-menu-item"], [class*="captions-menu"] li, [role="menu"] button, [role="menu"] label');
          let matchedItem = null;
          for (const item of menuItems) {
            const text = (item.textContent || '').toLowerCase();
            if (sourceLanguage === 'en' && /english|tiếng anh/i.test(text)) {
              matchedItem = item;
              break;
            } else if (sourceLanguage === 'vi' && /vietnamese|tiếng việt/i.test(text)) {
              matchedItem = item;
              break;
            }
          }
          if (matchedItem) {
            matchedItem.click();
          }
          setTimeout(() => {
            if (ccBtn.getAttribute('aria-expanded') === 'true') {
              ccBtn.click();
            }
          }, 60);
        }, 60);
      } catch { /* Auto-caption selection is best effort. */ }
    }

    function setEnabled(value) {
      if (enabled && !value) prepareTracks();
      enabled = value;
      container.toggleAttribute('data-cc-udemy-active', value);
      document.documentElement?.toggleAttribute('data-cc-udemy-active', value);
      if (value) {
        prepareTracks();
        if (!autoCaptionAttempted) tryAutoEnableUdemyCaptions();
      } else {
        for (const [track, mode] of oldModes) track.mode = mode;
        oldModes.clear();
      }
    }

    function read() {
      prepareTracks();
      const tracks = [...video.textTracks];
      const { sourceLanguage, targetLanguage } = getLanguages();
      const sourceCues = tracks.find(track => language(track) === sourceLanguage)?.cues;
      const targetCues = tracks.find(track => language(track) === targetLanguage)?.cues;
      let source = app.cueAt(sourceCues, video.currentTime);
      // Shaka and modern Udemy player use a custom DOM renderer instead of native TextTracks.
      if (!sourceCues?.length) {
        const cueSelector = [
          '[class*="captions-cue-text"]',
          '[data-purpose="captions-cue-text"]',
          '[data-purpose*="captions-cue"]',
          '[data-purpose*="caption-cue"]',
          '[class*="caption-cue"]',
          '[class*="captions-cue"]',
          '[class*="well--text"]',
          '[class*="well--container"] [class*="text"]',
          '[class*="well--container"] span',
          '[class*="shaka-text-container"] span',
          '[class*="captions-display"] [class*="cue"]',
          '[class*="captions-display"] span',
          '[class*="captions-display"] p',
          '[data-purpose*="captions-display"] span',
          '[data-purpose*="captions-display"] p',
          '[class*="captions-container"] span',
          '[class*="captions-container"] p',
          '[data-purpose*="captions-container"] span',
          '[data-purpose*="captions-container"] p',
          '[class*="captions-below"] span',
          '[class*="captions-under"] span',
          '[data-purpose*="captions-below"] span',
          '[data-purpose*="captions-under"] span',
          '[class*="video-viewer--captions"] span',
          '[class*="video-viewer--captions"] p',
        ].join(', ');

        let cues = container?.querySelectorAll ? container.querySelectorAll(cueSelector) : [];
        if (!cues.length && typeof document !== 'undefined' && document?.querySelectorAll) {
          cues = document.querySelectorAll(cueSelector);
        }

        if (cues.length) {
          const validCues = [...cues].filter(el => {
            return !el.closest?.('[class*="transcript-panel"], [data-purpose*="transcript-panel"], [class*="tabs-container"], [data-purpose*="course-tabs"], [class*="curriculum-navigation"], #cc-udemy-overlay');
          });
          if (validCues.length) {
            source = validCues.map(cue => {
              cue.setAttribute?.('data-cc-udemy-native-cue', 'true');
              return (cue.textContent || '').trim();
            }).filter(Boolean).join(' ');
          }
        }

        // Direct fallback for Udemy "Display under video" container
        if (!source && typeof document !== 'undefined') {
          const underVideoContainers = [
            '[class*="well--container"]',
            '[class*="well--well"]',
            '[class*="well--"]',
            '[data-purpose*="captions-under"]',
            '[data-purpose*="captions-below"]',
            '[class*="captions-under"]',
            '[class*="captions-below"]',
            '[class*="captions-display--captions-container"]',
            '[data-purpose="captions-display"]',
            '[data-purpose="captions-container"]',
            '[class*="video-viewer--captions"]',
          ].join(', ');

          let underElements = document?.querySelectorAll ? [...document.querySelectorAll(underVideoContainers)] : [];
          if (!underElements.length && document?.querySelector) {
            const single = document.querySelector(underVideoContainers);
            if (single) underElements = [single];
          }

          for (const el of underElements) {
            if (el.closest?.('[class*="transcript-panel"], [data-purpose*="transcript-panel"], [class*="tabs-container"], [data-purpose*="course-tabs"], #cc-udemy-overlay')) continue;
            const text = (el.textContent || '').trim();
            if (text && text.length < 500 && !/^(cài đặt|caption settings|tốc độ|speed|auto|tắt|off|ghi chú|notes)$/i.test(text)) {
              source = text;
              el.setAttribute?.('data-cc-udemy-native-cue', 'true');
              break;
            }
          }

          // Check sibling element directly beneath video-player container
          if (!source && container?.nextElementSibling) {
            const sibling = container.nextElementSibling;
            if (!sibling.closest?.('[class*="tabs-container"], [data-purpose*="course-tabs"], [class*="curriculum-navigation"]')
                && !sibling.matches?.('[class*="tabs-container"], [data-purpose*="course-tabs"], [class*="curriculum-navigation"]')) {
              const text = (sibling.textContent || '').trim();
              if (text && text.length < 500 && !/^(cài đặt|caption settings|ghi chú|notes|thông báo|announcements)$/i.test(text)) {
                source = text;
                sibling.setAttribute?.('data-cc-udemy-native-cue', 'true');
              }
            }
          }
        }
      }
      if (!source && !autoCaptionAttempted && (video.currentTime > 0.1 || !video.paused)) {
        tryAutoEnableUdemyCaptions();
      }
      source = app.cleanCaption(source);
      const translated = app.cueAt(targetCues, video.currentTime);
      const upcoming = Array.from(sourceCues || []).filter(cue => cue.startTime > video.currentTime).slice(0, 1).map(cue => app.cleanCaption(cue.text));
      return { source, translated, upcoming,
        key: `${location.pathname}|${video.id}|${video.currentSrc}|${sourceLanguage}|${targetLanguage}|${source}|${translated}` };
    }

    return { video, container, read, setEnabled,
      destroy() {
        setEnabled(false);
        document.documentElement?.removeAttribute('data-cc-udemy-active');
        style.remove();
        if (changedPosition) container.style.position = oldPosition;
      },
    };
  };
})();
