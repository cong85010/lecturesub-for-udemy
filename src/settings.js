(() => {
  const app = globalThis.CCUdemy ||= {};
  app.DEFAULT_SETTINGS = Object.freeze({
    version: 2, enabled: true, sourceLanguage: 'en', targetLanguage: 'vi', displayMode: 'bilingual', reverseOrder: false,
    sourceFontSize: 24, targetFontSize: 20, fontFamily: 'system', fontWeight: 500,
    sourceColor: '#ffffff', targetColor: '#f4d9a4', backgroundColor: '#151218', backgroundOpacity: .92,
    lineHeight: 1.5, lineGap: 4, captionWidth: 90, bottomOffset: 72, textAlign: 'center',
    pauseOnLookup: true, resumeOnClose: true, shortcutsEnabled: true,
  });
  app.normalizeSettings = value => {
    const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const defaults = app.DEFAULT_SETTINGS;
    const result = { ...defaults };
    const numeric = { sourceFontSize: [14, 40], targetFontSize: [12, 40], backgroundOpacity: [0, 1],
      lineHeight: [1.2, 2], lineGap: [0, 20], captionWidth: [50, 100], bottomOffset: [0, 240] };
    const migrated = { ...input };
    if (!('sourceFontSize' in input) && typeof input.fontSize === 'number') migrated.sourceFontSize = input.fontSize;
    if (!('targetFontSize' in input) && typeof input.fontSize === 'number') migrated.targetFontSize = Math.round(input.fontSize * .84);
    for (const [key, [min, max]] of Object.entries(numeric)) {
      if (typeof migrated[key] === 'number' && Number.isFinite(migrated[key])) result[key] = Math.round(Math.min(max, Math.max(min, migrated[key])) * 100) / 100;
    }
    for (const key of ['enabled', 'reverseOrder', 'pauseOnLookup', 'resumeOnClose', 'shortcutsEnabled']) {
      if (typeof input[key] === 'boolean') result[key] = input[key];
    }
    for (const key of ['sourceLanguage', 'targetLanguage']) {
      if (app.LANGUAGES.some(([code]) => code === input[key])) result[key] = input[key];
    }
    for (const key of ['sourceColor', 'targetColor', 'backgroundColor']) {
      if (typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key])) result[key] = input[key].toLowerCase();
    }
    for (const [key, allowed] of Object.entries({ displayMode: ['bilingual', 'source', 'translation'],
      fontFamily: ['system', 'serif', 'mono'], fontWeight: [400, 500, 600, 700], textAlign: ['left', 'center', 'right'] })) {
      if (allowed.includes(input[key])) result[key] = input[key];
    }
    return result;
  };
  app.FONT_FAMILIES = Object.freeze({
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: 'Georgia, "Times New Roman", serif', mono: 'Menlo, Consolas, monospace',
  });
})();
