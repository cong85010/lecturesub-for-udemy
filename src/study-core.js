(() => {
  const app = globalThis.CCUdemy ||= {};
  const text = (value, max) => {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Nội dung bộ ôn không hợp lệ hoặc quá dài.');
    return value.trim();
  };
  app.studyLesson = value => {
    const url = new URL(value?.url);
    if (url.origin !== 'https://www.udemy.com' || !/^\/course\/[^/]+\/learn\/lecture\/\d+\/?$/.test(url.pathname)) throw Error('Hãy mở một bài giảng Udemy.');
    return { url: url.origin + url.pathname.replace(/\/$/, ''), title: text(value.title, 500), course: text(value.course, 500), transcript: text(value.transcript, 60000) };
  };
  app.studyDeck = (value, lesson) => {
    const source = lesson.transcript.replace(/\s+/g, ' ');
    const read = (items, fields, max) => {
      if (!Array.isArray(items) || !items.length || items.length > max) throw Error('AI chưa trả về đủ câu hỏi và flashcard. Hãy thử lại.');
      return items.map(item => {
        const result = Object.fromEntries(fields.map(field => [field, text(item?.[field], 2000)]));
        result.quote = text(item?.quote, 1000);
        if (!source.includes(result.quote.replace(/\s+/g, ' '))) throw Error('AI trả về dẫn chứng không có trong transcript. Hãy thử lại.');
        return result;
      });
    };
    return { questions: read(value?.questions, ['question', 'answer'], 8), flashcards: read(value?.flashcards, ['front', 'back'], 12) };
  };
  app.studyGrade = (old, remembered, now = Date.now()) => {
    const step = remembered ? Math.min(4, (Number.isInteger(old?.step) ? Math.max(0,old.step) : 0) + 1) : 0;
    return { step, due: now + [0,1,3,7,14][step] * 86400000 };
  };
})();
