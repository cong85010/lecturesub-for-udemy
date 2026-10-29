(() => {
  const app = globalThis.CCUdemy ||= {};
  const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
  app.normalizeWord = value => {
    const input = value && typeof value === 'object' ? value : {};
    const languages = app.normalizeSettings(input);
    const word = text(input.word, 160).normalize('NFC');
    const meaning = text(input.meaning, 4000);
    if (!word || !meaning) throw Error('Cần có từ và nghĩa trước khi lưu.');
    const sourceLanguage = languages.sourceLanguage, targetLanguage = languages.targetLanguage;
    const id = JSON.stringify([sourceLanguage, targetLanguage, word.toLocaleLowerCase(sourceLanguage)]);
    let url = '';
    try {
      const parsed = new URL(input.url);
      if (parsed.protocol === 'https:' && parsed.hostname === 'www.udemy.com' && /^\/course\/[^/]+\/learn(?:\/|$)/.test(parsed.pathname)) {
        url = `${parsed.origin}${parsed.pathname}`;
      }
    } catch { /* External/untrusted links are omitted. */ }
    return { id, word, meaning, sourceLanguage, targetLanguage, sentence: text(input.sentence, 5000),
      title: text(input.title, 240), url, time: Number.isFinite(input.time) ? Math.max(0, Math.min(1e7, input.time)) : 0,
      createdAt: typeof input.createdAt === 'number' && Number.isFinite(input.createdAt) ? input.createdAt : Date.now() };
  };
  app.readVocabulary = values => Array.isArray(values) ? values.slice(0, 2000).flatMap(item => {
    try { return [app.normalizeWord(item)]; } catch { return []; }
  }) : [];
  app.vocabularyCsv = items => {
    const cell = value => {
      let text = String(value ?? '');
      if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = [['Từ', 'Nghĩa', 'Nguồn', 'Đích', 'Câu gốc', 'Bài học', 'Giây', 'Liên kết'],
      ...items.map(item => [item.word, item.meaning, item.sourceLanguage, item.targetLanguage, item.sentence, item.title, item.time, item.url])];
    return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
  };
})();
