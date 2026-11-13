(() => {
  const app = globalThis.CCUdemy ||= {};
  app.createStudyService = (storage, { fetcher = fetch, endpoint = 'http://127.0.0.1:8787/study' } = {}) => {
    const pending = new Map();
    let queue = Promise.resolve();
    const write = work => { const job = queue.then(work); queue = job.catch(() => {}); return job; };
    const read = async () => (await storage.get('ccUdemyStudy')).ccUdemyStudy || {};
    async function generate(message) {
      if (message.consent !== true) throw Error('Cần đồng ý gửi transcript tới server và DeepSeek.');
      const lesson = app.studyLesson(message.lesson);
      const saved = (await read())[lesson.url];
      if (saved?.deck) return saved;
      if (pending.has(lesson.url)) return pending.get(lesson.url);
      const job = (async () => {
        let response;
        try {
          response = await fetcher(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lesson), signal: AbortSignal.timeout(27000), credentials: 'omit' });
        } catch { throw Error('Không kết nối được server tạo bộ ôn. Kiểm tra server rồi thử lại.'); }
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw Error(({503:'Server chưa được cấu hình DeepSeek API key.',429:'Đã đạt giới hạn tạo bộ ôn. Chờ một lúc rồi thử lại.',413:'Transcript quá dài; bản thử hỗ trợ tối đa 60.000 ký tự.'})[response.status] || (typeof body.error === 'string' ? body.error.slice(0,300) : 'DeepSeek chưa tạo được bộ ôn. Hãy thử lại.'));
        }
        const deck = app.studyDeck(await response.json(), lesson);
        const item = { url:lesson.url,title:lesson.title,course:lesson.course,deck,createdAt:Date.now(),progress:{} };
        return write(async () => {
          const items = await read();
          if (items[lesson.url]?.deck) return items[lesson.url];
          if (Object.keys(items).length >= 100) throw Error('Bản thử đã đủ 100 bộ ôn.');
          items[lesson.url] = item;
          await storage.set({ccUdemyStudy:items}); return item;
        });
      })();
      pending.set(lesson.url, job);
      try { return await job; } finally { pending.delete(lesson.url); }
    }
    return { async handle(message) {
      if (message.type === 'study.generate') return generate(message);
      if (message.type === 'study.draft') return write(async () => {
        const lesson=app.studyLesson(message.lesson), key=crypto.randomUUID();
        const all=(await storage.get('ccUdemyStudyDrafts')).ccUdemyStudyDrafts || {};
        const entries=Object.entries(all).filter(([,v])=>Date.now()-v.at<1800000).slice(-4);
        await storage.set({ccUdemyStudyDrafts:{...Object.fromEntries(entries),[key]:{lesson,at:Date.now()}}}); return key;
      });
      if (message.type === 'study.getDraft') {
        const draft=(await storage.get('ccUdemyStudyDrafts')).ccUdemyStudyDrafts?.[message.id];
        if (!draft || Date.now()-draft.at>1800000) throw Error('Transcript đã hết hạn. Quay lại Udemy và bấm Ôn bài lần nữa.');
        return draft.lesson;
      }
      if (message.type === 'study.list') return Object.values(await read()).sort((a,b)=>b.createdAt-a.createdAt);
      if (message.type === 'study.grade') return write(async () => {
        const items = await read(), item = items[message.url];
        if (!item || !Number.isInteger(message.index) || !item.deck.flashcards[message.index] || typeof message.remembered !== 'boolean') throw Error('Không tìm thấy thẻ để ôn.');
        item.progress[message.index] = app.studyGrade(item.progress[message.index],message.remembered);
        await storage.set({ccUdemyStudy:items}); return item;
      });
      throw Error('Thao tác ôn bài không hợp lệ.');
    } };
  };
})();
