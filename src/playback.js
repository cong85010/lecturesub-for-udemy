(() => {
  'use strict';
  const app = globalThis.CCUdemy ||= {};
  app.createPlaybackSession = (video, getOptions = () => ({})) => {
    let open = false;
    let resume = false;
    return {
      open() {
        if (open) return;
        open = true;
        resume = getOptions().pauseOnLookup !== false && !video.paused && !video.ended;
        if (resume) video.pause();
      },
      async close() {
        const shouldResume = open && resume && getOptions().resumeOnClose !== false && video.isConnected && !video.ended;
        open = false;
        resume = false;
        if (shouldResume && video.paused) {
          try { await video.play(); } catch { /* Browser may require a new click. */ }
        }
      },
      cancel() { open = false; resume = false; },
    };
  };
})();
