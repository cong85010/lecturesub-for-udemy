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
      html[data-cc-udemy-active] [class*="well--container"] [class*="text"],
      html[data-cc-udemy-active] [class*="well--container"] span,
      [data-cc-udemy-active] [class*="captions-display"],
      [data-cc-udemy-active] [class*="captions-container"],
      [data-cc-udemy-active] [data-purpose*="captions-display"],
      [data-cc-udemy-active] [data-purpose*="caption-cue"],
      [data-cc-udemy-active] [class*="shaka-text-container"] {
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

    function setEnabled(value) {
      if (enabled && !value) prepareTracks();
      enabled = value;
      container.toggleAttribute('data-cc-udemy-active', value);
      document.documentElement?.toggleAttribute('data-cc-udemy-active', value);
      if (value) prepareTracks();
      else {
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
        const cueSelector = '[class*="captions-cue-text"], [data-purpose="captions-cue-text"], [data-purpose="caption-cue"], [data-purpose*="caption-cue"], [class*="well--text"]';
        let cues = container.querySelectorAll(cueSelector);
        if (!cues.length) {
          cues = document.querySelectorAll(cueSelector);
        }
        if (!cues.length) {
          cues = container.querySelectorAll('[class*="captions-display"] [class*="cue"], [class*="shaka-text-container"] span');
          if (!cues.length) {
            cues = document.querySelectorAll('[class*="captions-display"] [class*="cue"], [class*="shaka-text-container"] span, [class*="well--container"] [class*="text"], [class*="well--container"] span');
          }
        }
        if (cues.length) {
          source = [...cues].map(cue => cue.textContent.trim()).filter(Boolean).join(' ');
        } else {
          // Direct fallback for Udemy "Display under video" container
          const well = document.querySelector('[class*="well--container"], [data-purpose*="captions-under-video"]');
          if (well) {
            source = well.textContent.trim();
          }
        }
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
