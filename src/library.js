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
    const srsRepetitions = Number.isInteger(input.srsRepetitions) && input.srsRepetitions >= 0 ? input.srsRepetitions : 0;
    const srsInterval = Number.isInteger(input.srsInterval) && input.srsInterval >= 0 ? input.srsInterval : 0;
    const srsEase = typeof input.srsEase === 'number' && input.srsEase >= 1.3 && input.srsEase <= 3.5 ? Math.round(input.srsEase * 100) / 100 : 2.5;
    const srsDueDate = typeof input.srsDueDate === 'number' && Number.isFinite(input.srsDueDate) ? input.srsDueDate : 0;
    const srsLastReviewed = typeof input.srsLastReviewed === 'number' && Number.isFinite(input.srsLastReviewed) ? input.srsLastReviewed : 0;
    return { id, word, meaning, sourceLanguage, targetLanguage, sentence: text(input.sentence, 5000),
      title: text(input.title, 240), url, time: Number.isFinite(input.time) ? Math.max(0, Math.min(1e7, input.time)) : 0,
      createdAt: typeof input.createdAt === 'number' && Number.isFinite(input.createdAt) ? input.createdAt : Date.now(),
      srsRepetitions, srsInterval, srsEase, srsDueDate, srsLastReviewed };
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
  app.calculateSrs = (card, rating) => {
    const repetitions = Number.isInteger(card?.srsRepetitions) ? card.srsRepetitions : 0;
    const ease = typeof card?.srsEase === 'number' && card.srsEase >= 1.3 ? card.srsEase : 2.5;
    const interval = Number.isInteger(card?.srsInterval) ? card.srsInterval : 0;

    let nextReps = 0;
    let nextEase = ease;
    let nextInterval = 0;

    if (rating === 1) {
      nextReps = 0;
      nextInterval = 0;
      nextEase = Math.max(1.3, ease - 0.2);
    } else if (rating === 2) {
      nextReps = repetitions + 1;
      nextEase = ease;
      if (nextReps === 1) nextInterval = 1;
      else if (nextReps === 2) nextInterval = 6;
      else nextInterval = Math.max(1, Math.round(interval * ease));
    } else {
      nextReps = repetitions + 1;
      nextEase = Math.min(3.0, ease + 0.15);
      if (nextReps === 1) nextInterval = 3;
      else if (nextReps === 2) nextInterval = 8;
      else nextInterval = Math.max(1, Math.round(interval * ease * 1.3));
    }

    const now = Date.now();
    const srsDueDate = nextInterval === 0 ? now + 5 * 60 * 1000 : now + nextInterval * 86400 * 1000;

    return {
      ...card,
      srsRepetitions: nextReps,
      srsEase: Math.round(nextEase * 100) / 100,
      srsInterval: nextInterval,
      srsDueDate,
      srsLastReviewed: now
    };
  };
  app.SAMPLE_TECH_CARDS = [
    {
      word: 'backpropagation',
      meaning: 'lan truyền ngược: thuật toán tính đạo hàm riêng (gradient) của hàm mất mát theo từng trọng số để tối ưu hóa mạng nơ-ron.',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      sentence: 'In deep neural networks, backpropagation calculates the error gradient backwards from output to input.',
      title: 'Machine Learning Fundamentals'
    },
    {
      word: 'overfitting',
      meaning: 'quá khớp: hiện tượng mô hình học vẹt chi tiết thừa và nhiễu trên dữ liệu huấn luyện, dẫn đến kết quả kém trên thực tế.',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      sentence: 'When a model learns training noise instead of true patterns, it suffers from overfitting.',
      title: 'Machine Learning Fundamentals'
    },
    {
      word: 'hyperparameters',
      meaning: 'siêu tham số: các thông số cấu hình do kỹ sư tự thiết lập trước khi huấn luyện (như learning rate, epochs), không tự học từ dữ liệu.',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      sentence: 'Learning rate and batch size are key hyperparameters configured before training begins.',
      title: 'Machine Learning Fundamentals'
    },
    {
      word: 'asynchronous',
      meaning: 'bất đồng bộ: cơ chế xử lý không chặn (non-blocking), cho phép chương trình chạy tác vụ khác trong khi chờ phản hồi mạng hay file.',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      sentence: 'Using asynchronous programming prevents the user interface from freezing during heavy network requests.',
      title: 'JavaScript Deep Dive'
    },
    {
      word: 'idempotence',
      meaning: 'tính bất biến / lũy đẳng: tính chất một thao tác thực hiện nhiều lần vẫn mang lại kết quả giống hệt như thực hiện một lần duy nhất.',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      sentence: 'Designing HTTP endpoints with idempotence ensures safe retries in distributed networks.',
      title: 'Backend System Architecture'
    }
  ];
})();
