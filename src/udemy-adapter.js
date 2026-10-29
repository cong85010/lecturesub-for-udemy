(() => {
  'use strict';
  const app = globalThis.CCUdemy ||= {};
  app.findVideo = () => [...document.querySelectorAll('video')]
    .filter(video => video.getBoundingClientRect().width > 100)
    .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];

  app.createUdemyAdapter = (video, getLanguages = () => ({ sourceLanguage: 'en', targetLanguage: 'vi' })) => {
    const container = video.closest('[id^="shaka-video-container-"], [class*="video-container"], [data-purpose="video-player"]') || video.parentElement;
    let enabled = false;
    const oldPosition = container.style.position;
    const changedPosition = getComputedStyle(container).position === 'static';
    if (changedPosition) container.style.position = 'relative';
    const oldModes = new Map();
    const style = document.createElement('style');
    style.textContent = '[data-cc-udemy-active] [class*="captions-display"][class*="captions-container"], [data-cc-udemy-active] [data-purpose="captions-display"] { visibility: hidden !important; }';
    container.append(style);

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
      // Shaka on current Udemy uses a custom DOM renderer instead of native TextTracks.
      if (!sourceCues?.length) {
        const cues = container.querySelectorAll('[class*="captions-cue-text"], [data-purpose="caption-cue"]');
        source = [...cues].map(cue => cue.textContent.trim()).filter(Boolean).join(' ');
      }
      const translated = app.cueAt(targetCues, video.currentTime);
      const upcoming = Array.from(sourceCues || []).filter(cue => cue.startTime > video.currentTime).slice(0, 1).map(cue => app.cleanCaption(cue.text));
      return { source, translated, upcoming,
        key: `${location.pathname}|${video.id}|${video.currentSrc}|${sourceLanguage}|${targetLanguage}|${source}|${translated}` };
    }

    return { video, container, read, setEnabled,
      destroy() {
        setEnabled(false);
        style.remove();
        if (changedPosition) container.style.position = oldPosition;
      },
    };
  };
})();
