(() => {
  'use strict';
  const app = globalThis.CCUdemy ||= {};
  const CACHE_KEY = 'ccUdemyTranslationsV2';
  const MAX_ENTRIES = 500;
  app.createTranslator = ({ api = globalThis.Translator, storage } = {}) => {
    let source = 'en', target = 'vi', generation = 0;
    let translator, enabling, saving, dirty = false;
    const cache = new Map(), pending = new Map();
    const cacheKey = (text, from = source, to = target) => JSON.stringify([from, to, text]);
    const ready = Promise.resolve().then(async () => {
      try {
        const stored = await storage?.get([CACHE_KEY, 'ccUdemyTranslationsV1']);
        const old = stored?.ccUdemyTranslationsV1;
        if (Array.isArray(old)) for (const entry of old.slice(-MAX_ENTRIES)) {
          if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string') {
            cache.set(cacheKey(entry[0], 'en', 'vi'), entry[1]);
          }
        }
        if (Array.isArray(stored?.[CACHE_KEY])) for (const entry of stored[CACHE_KEY].slice(-MAX_ENTRIES)) {
          if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string') {
            try {
              const parsed = JSON.parse(entry[0]);
              if (Array.isArray(parsed) && parsed.length === 3 && parsed.every(value => typeof value === 'string')) cache.set(entry[0], entry[1]);
            } catch { /* Ignore invalid cache keys. */ }
          }
        }
        while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
      } catch { /* Cache is optional. */ }
    });
    async function flush() {
      await ready;
      if (saving) await saving;
      if (!dirty || !storage) return;
      dirty = false;
      saving = Promise.resolve().then(() => storage.set({ [CACHE_KEY]: [...cache].slice(-MAX_ENTRIES) })).catch(() => {}).finally(() => { saving = null; });
      await saving;
      if (dirty) await flush();
    }
    function setLanguages(from, to) {
      if (source === from && target === to) return false;
      generation++; source = from; target = to;
      try { translator?.destroy?.(); } catch { /* A completed model may already be gone. */ }
      translator = undefined; enabling = undefined;
      return true;
    }
    // Synchronous create invocation preserves the trusted click's user activation.
    function enable(onProgress = () => {}) {
      if (source === target || translator) return Promise.resolve();
      if (enabling) return enabling;
      if (!api?.create) return Promise.reject(Error('Cần Chrome 138 trở lên trên máy tính để dùng bộ dịch miễn phí.'));
      const version = generation;
      try {
        const creation = api.create({ sourceLanguage: source, targetLanguage: target,
          monitor(monitor) { monitor.addEventListener('downloadprogress', event => {
            if (version === generation) onProgress(Math.round(event.loaded * 100));
          }); } });
        const task = Promise.resolve(creation).then(result => {
          if (version !== generation) { result.destroy?.(); throw Error('Đã hủy tải vì đổi ngôn ngữ.'); }
          translator = result;
        }).finally(() => { if (version === generation) enabling = undefined; });
        enabling = task;
        return task;
      } catch (error) { enabling = undefined; return Promise.reject(error); }
    }
    async function translate(text) {
      const normalized = String(text || '').trim();
      if (!normalized) return '';
      const from = source, to = target, engine = translator;
      if (from === to) return normalized;
      const key = cacheKey(normalized, from, to);
      await ready;
      if (cache.has(key)) return cache.get(key);
      if (!engine) throw Error('Bật dịch miễn phí để tra từ và dịch phụ đề.');
      if (pending.has(key)) return pending.get(key);
      const task = Promise.resolve().then(() => engine.translate(normalized)).then(result => {
        if (typeof result !== 'string' || !result.trim()) throw Error('Không nhận được bản dịch. Hãy thử lại.');
        cache.delete(key); cache.set(key, result.trim());
        while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
        dirty = true; void flush();
        return result.trim();
      }).finally(() => pending.delete(key));
      pending.set(key, task);
      return task;
    }
    return { ready, enable, translate, flush, setLanguages,
      peek: text => source === target ? String(text || '').trim() : cache.get(cacheKey(String(text || '').trim())),
      isEnabled: () => source === target || Boolean(translator),
      async availability() {
        if (source === target) return 'available';
        if (!api?.create) return 'unavailable';
        try { return api.availability ? await api.availability({ sourceLanguage: source, targetLanguage: target }) : 'downloadable'; }
        catch { return 'unavailable'; }
      },
    };
  };
})();
