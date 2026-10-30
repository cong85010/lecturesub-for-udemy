(() => {
  const app = globalThis.CCUdemy ||= {};
  app.createPreview = () => {
    const $ = selector => document.querySelector(selector);
    const frame = $('.preview-frame'), captions = $('.preview-captions'), source = $('.preview-source'), target = $('.preview-target');
    const card = $('#sample-lookup'), save = $('#save-sample'), play = $('#preview-play'), progress = $('#preview-progress');
    const samples = [
      { text: 'A model learns patterns from data.', translation: 'Một mô hình học các mẫu từ dữ liệu.', word: 'patterns', meaning: 'mẫu' },
      { text: 'Data helps us make better predictions.', translation: 'Dữ liệu giúp chúng ta dự đoán tốt hơn.', word: 'predictions', meaning: 'dự đoán' },
      { text: 'Models improve with more examples.', translation: 'Mô hình cải thiện khi có thêm ví dụ.', word: 'examples', meaning: 'ví dụ' },
    ];
    const bookmark = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h10v14l-5-3-5 3V3Z"/></svg>';
    let offset = 72, time = 0, playing = false, previousTime, request, index = -1, revision = 0;
    let vocabulary = [], vocabularyRevision = 0, savingRevision = -1;
    card.hidden = frame.clientWidth < 600;
    function updateSave() {
      if (index < 0) return;
      const saved = vocabulary.some(item => item.sourceLanguage === 'en' && item.targetLanguage === 'vi' && item.word.toLowerCase() === samples[index].word);
      const saving = savingRevision === revision;
      save.disabled = saving || saved;
      save.innerHTML = bookmark + (saving ? 'Đang lưu…' : saved ? 'Đã lưu từ mẫu' : 'Lưu từ mẫu');
    }
    function reflow() {
      const bottom = Math.min(offset, Math.max(0, frame.clientHeight * .3));
      captions.style.bottom = `${bottom}px`;
      captions.style.maxHeight = `${Math.max(48, frame.clientHeight - bottom - 24)}px`;
      if (card.hidden) return;
      card.style.maxHeight = `${Math.max(80, frame.clientHeight - 24)}px`;
      const bounds = frame.getBoundingClientRect(), text = captions.getBoundingClientRect();
      const word = source.querySelector('button')?.getBoundingClientRect();
      const x = word ? word.left - bounds.left + word.width / 2 - card.offsetWidth / 2 : (bounds.width - card.offsetWidth) / 2;
      card.style.left = `${Math.max(12, Math.min(x, bounds.width - card.offsetWidth - 12))}px`;
      card.style.top = `${Math.max(12, Math.min(text.top - bounds.top - card.offsetHeight - 12, bounds.height - card.offsetHeight - 12))}px`;
    }
    function selectSample(next) {
      if (next === index) return;
      index = next; revision++;
      const sample = samples[index], parts = sample.text.split(sample.word);
      const word = document.createElement('button'); word.type = 'button'; word.id = 'preview-word'; word.textContent = sample.word;
      word.setAttribute('aria-expanded', String(!card.hidden)); word.setAttribute('aria-controls', 'sample-lookup');
      word.addEventListener('click', () => { card.hidden = !card.hidden; word.setAttribute('aria-expanded', String(!card.hidden)); reflow(); });
      source.replaceChildren(document.createTextNode(parts[0]), word, document.createTextNode(parts[1]));
      target.textContent = sample.translation; card.querySelector('strong').textContent = sample.word;
      card.querySelector('strong + span').textContent = sample.meaning;
      updateSave(); $('#sample-status').textContent = '';
      reflow();
    }
    function render() {
      selectSample(Math.min(2, Math.floor(time / 4)));
      progress.value = time; $('#preview-time').textContent = `0:${String(Math.floor(time)).padStart(2, '0')} / 0:12`;
    }
    function stop() {
      playing = false; cancelAnimationFrame(request); previousTime = undefined;
      play.setAttribute('aria-label', 'Phát ví dụ'); play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 13 8-13 8V4Z"/></svg>';
    }
    function advance(now) {
      if (!playing) return;
      if (previousTime !== undefined) time = Math.min(12, time + (now - previousTime) / 1000);
      previousTime = now; render();
      if (time >= 12) stop(); else request = requestAnimationFrame(advance);
    }
    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      if (time >= 12) { time = 0; render(); }
      playing = true; previousTime = undefined; play.setAttribute('aria-label', 'Tạm dừng ví dụ');
      play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z"/></svg>';
      request = requestAnimationFrame(advance);
    });
    progress.addEventListener('input', () => { time = Number(progress.value); previousTime = undefined; render(); });
    $('#close-sample').addEventListener('click', () => {
      card.hidden = true; const word = source.querySelector('button'); word?.setAttribute('aria-expanded', 'false'); word?.focus();
    });
    save.addEventListener('click', async () => {
      const snapshot = revision, sample = samples[index], before = vocabularyRevision;
      savingRevision = snapshot; updateSave();
      try {
        const item = await app.call('vocabulary.add', { item: { word: sample.word, meaning: sample.meaning, sentence: sample.text,
          sourceLanguage: 'en', targetLanguage: 'vi', title: 'Ví dụ trong cài đặt', url: '', time: index * 4 } });
        if (before === vocabularyRevision) vocabulary = [...vocabulary.filter(word => word.id !== item.id), item];
      } catch (error) {
        if (revision === snapshot) $('#sample-status').textContent = error.message;
      }
      if (savingRevision === snapshot) savingRevision = -1;
      updateSave();
      reflow();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    new ResizeObserver(reflow).observe(frame);
    render();
    return { setOffset(value) { offset = value; }, reflow, stop,
      setVocabulary(values) { vocabulary = values; vocabularyRevision++; updateSave(); } };
  };
})();
