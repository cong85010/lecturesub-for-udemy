(() => {
  'use strict';
  const app = globalThis.CCUdemy ||= {};
  app.cleanCaption = text => String(text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, entity => ({
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ',
    })[entity])
    .replace(/\s+/g, ' ').trim();
  app.cueAt = (cues, time) => Array.from(cues || [])
    .filter(cue => cue.startTime <= time && time < cue.endTime)
    .map(cue => app.cleanCaption(cue.text)).filter(Boolean).join(' ');
  app.tokenize = (text, language = 'en') => {
    if (/^(ja|zh|th)(-|$)/.test(language) && typeof Intl.Segmenter === 'function') {
      return Array.from(new Intl.Segmenter(language, { granularity: 'word' }).segment(String(text)),
        segment => ({ text: segment.segment, word: Boolean(segment.isWordLike) }));
    }
    return Array.from(String(text).matchAll(/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*|[^\p{L}\p{M}]+/gu),
      match => ({ text: match[0], word: /^[\p{L}\p{M}]/u.test(match[0]) }));
  };
})();
