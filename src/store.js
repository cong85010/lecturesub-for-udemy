(() => {
  const app = globalThis.CCUdemy ||= {};
  app.createStore = storage => {
    let queue = Promise.resolve();
    async function execute(message) {
      switch (message.type) {
        case 'settings.get': return app.normalizeSettings((await storage.get('ccUdemySettings')).ccUdemySettings);
        case 'settings.patch': {
          const old = app.normalizeSettings((await storage.get('ccUdemySettings')).ccUdemySettings);
          const next = app.normalizeSettings({ ...old, ...(message.patch && typeof message.patch === 'object' ? message.patch : {}) });
          await storage.set({ ccUdemySettings: next });
          return next;
        }
        case 'settings.reset': {
          const next = app.normalizeSettings({});
          await storage.set({ ccUdemySettings: next }); return next;
        }
        case 'vocabulary.list': return app.readVocabulary((await storage.get('ccUdemyVocabulary')).ccUdemyVocabulary);
        case 'vocabulary.add': {
          const item = app.normalizeWord(message.item);
          const items = app.readVocabulary((await storage.get('ccUdemyVocabulary')).ccUdemyVocabulary);
          const existing = items.find(value => value.id === item.id);
          if (existing) return existing;
          if (items.length >= 2000) throw Error('Sổ từ đã đủ 2.000 từ. Xuất CSV và xóa bớt trước khi lưu thêm.');
          await storage.set({ ccUdemyVocabulary: [...items, item] }); return item;
        }
        case 'vocabulary.delete': {
          const items = app.readVocabulary((await storage.get('ccUdemyVocabulary')).ccUdemyVocabulary);
          const next = items.filter(item => item.id !== message.id);
          await storage.set({ ccUdemyVocabulary: next }); return next;
        }
        default: throw Error('Thao tác không được hỗ trợ.');
      }
    }
    return { handle(message) {
      const job = queue.then(() => execute(message || {}));
      queue = job.catch(() => {});
      return job;
    } };
  };
})();
