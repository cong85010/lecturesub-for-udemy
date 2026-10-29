(() => {
  'use strict';
  const app = globalThis.CCUdemy;
  const $ = selector => document.querySelector(selector);
  let settings = app.normalizeSettings({}), words = [], filtered = [], lastDeleted;
  let pending = 0, saveRevision = 0, availabilityRevision = 0, lastPair = '';
  let settingsEvents = 0, vocabularyEvents = 0;
  const controls = [];
  const setStatus = (text, error = false) => {
    $('#save-status').textContent = text; $('#save-status').classList.toggle('error', error);
    $('.save-state').dataset.state = error ? 'error' : text === 'Đã lưu' ? 'saved' : 'idle';
  };
  const demo = app.createPreview();
  function preview(value) {
    const s = app.normalizeSettings(value), box = $('.preview-captions'), source = $('.preview-source'), target = $('.preview-target');
    source.style.fontSize = `${s.sourceFontSize}px`; target.style.fontSize = `${s.targetFontSize}px`;
    source.style.color = s.sourceColor; target.style.color = s.targetColor;
    source.style.order = s.reverseOrder ? '2' : '0'; target.style.order = s.reverseOrder ? '0' : '2';
    source.hidden = s.displayMode === 'translation'; target.hidden = s.displayMode === 'source';
    box.style.fontFamily = app.FONT_FAMILIES[s.fontFamily]; box.style.fontWeight = s.fontWeight;
    box.style.lineHeight = s.lineHeight; box.style.gap = `${s.lineGap}px`; box.style.textAlign = s.textAlign;
    box.style.width = `${s.captionWidth}%`; box.style.left = `${(100 - s.captionWidth) / 2}%`;
    demo.setOffset(s.bottomOffset);
    box.style.backgroundColor = s.backgroundColor + Math.round(s.backgroundOpacity * 255).toString(16).padStart(2, '0');
    box.style.opacity = s.enabled ? '1' : '.4';
    demo.reflow();
  }
  async function availability() {
    const pair = `${settings.sourceLanguage}|${settings.targetLanguage}`;
    if (pair === lastPair) return;
    lastPair = pair;
    const revision = ++availabilityRevision;
    const status = $('.pair-status');
    if (settings.sourceLanguage === settings.targetLanguage) { status.textContent = 'Nguồn và đích giống nhau; không cần bộ dịch.'; return; }
    if (!globalThis.Translator?.availability) { status.textContent = 'Kiểm tra và bật bộ dịch trên video trong Chrome 138+.'; return; }
    status.textContent = 'Đang kiểm tra cặp ngôn ngữ trên máy…';
    try {
      const state = await Translator.availability({ sourceLanguage: settings.sourceLanguage, targetLanguage: settings.targetLanguage });
      if (revision !== availabilityRevision) return;
      status.textContent = state === 'unavailable' ? 'Cặp ngôn ngữ này chưa dùng được trên máy. Chọn cặp khác để tiếp tục.'
        : state === 'available' ? 'Cặp ngôn ngữ này có thể dùng. Bật bộ dịch trên video để bắt đầu.'
          : 'Cặp ngôn ngữ có thể cần tải bộ ngôn ngữ. Bấm bật dịch trên video để tải.';
    } catch { if (revision === availabilityRevision) status.textContent = 'Chưa kiểm tra được. Hãy thử bật bộ dịch trên video.'; }
  }
  function renderSettings(value) {
    settings = app.normalizeSettings(value); controls.forEach(control => control.update(settings)); preview(settings); void availability();
  }
  async function mutate(type, payload = {}) {
    const revision = ++saveRevision;
    const eventsBefore = settingsEvents;
    pending++; setStatus('Đang lưu…');
    try {
      const result = await app.call(type, payload);
      if (revision === saveRevision && settingsEvents === eventsBefore) renderSettings(result);
      if (revision === saveRevision) setStatus('Đã lưu');
    } catch (error) { if (revision === saveRevision) { setStatus(error.message, true); renderSettings(settings); } }
    finally { pending--; }
  }
  const change = patch => mutate('settings.patch', { patch });
  controls.push(app.createControls($('#enable-control'), ['enabled'], { change }));
  controls.push(app.createControls($('#language-controls'), ['sourceLanguage', 'targetLanguage', 'displayMode'], { change }));
  const groupTabs = [], groupPanels = [], tabNames = ['Kiểu chữ', 'Bố cục', 'Tra từ'];
  function activateGroup(index, focus = false) {
    groupTabs.forEach((tab, current) => { tab.setAttribute('aria-selected', String(current === index)); tab.tabIndex = current === index ? 0 : -1; });
    groupPanels.forEach((panel, current) => { panel.hidden = current !== index; });
    if (focus) groupTabs[index].focus();
  }
  for (const [index, group] of app.SETTINGS_GROUPS.slice(1).entries()) {
    const section = document.createElement('section'); section.className = 'settings-section';
    section.id = `settings-panel-${index}`; section.setAttribute('role', 'tabpanel'); section.setAttribute('aria-labelledby', `settings-tab-${index}`);
    const tab = document.createElement('button'); tab.type = 'button'; tab.id = `settings-tab-${index}`;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', section.id); tab.textContent = tabNames[index];
    tab.addEventListener('click', () => activateGroup(index));
    tab.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
      if (target < 0) return;
      event.preventDefault(); activateGroup(target, true);
    });
    groupTabs.push(tab); groupPanels.push(section); $('#setting-tabs').append(tab);
    const title = document.createElement('h2'); title.textContent = group.title;
    const description = document.createElement('p'); description.className = 'section-description'; description.textContent = group.description;
    section.append(title, description); $('#settings-groups').append(section);
    const keys = index === 1 ? [...group.keys, 'reverseOrder'] : group.keys;
    controls.push(app.createControls(section, keys, {
      change: patch => mutate('settings.patch', { patch }), preview: patch => preview({ ...settings, ...patch }),
    }));
  }
  activateGroup(0);
  $('#reset').addEventListener('click', () => mutate('settings.reset'));
  const views = { settings: ['Phụ đề', 'Chọn ngôn ngữ và chỉnh cách hiển thị.'],
    vocabulary: ['Từ vựng', 'Từ đã lưu cùng ngữ cảnh trong bài học.'], help: ['Hướng dẫn', 'Các thao tác chính và cách khắc phục sự cố.'] };
  function showView() {
    const view = Object.hasOwn(views, location.hash.slice(1)) ? location.hash.slice(1) : 'settings';
    document.body.dataset.view = view;
    if (view !== 'settings') demo.stop();
    for (const key of Object.keys(views)) $(`#${key}-view`).hidden = key !== view;
    for (const button of document.querySelectorAll('nav button')) {
      if (button.dataset.view === view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    }
    $('#page-title').textContent = views[view][0]; $('#page-description').textContent = views[view][1];
    document.title = `LectureSub for Udemy — ${views[view][0]}`;
  }
  document.querySelectorAll('nav button').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.view; }));
  window.addEventListener('hashchange', showView); showView();
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    const target = document.body.dataset.view === 'settings' ? $('#enable-control input') : $('#page-title');
    target.focus(); target.scrollIntoView({ block: 'nearest' });
  });
  const folded = text => String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  function renderWords() {
    demo.setVocabulary(words);
    const query = folded($('#word-search').value);
    filtered = words.filter(item => folded(`${item.word} ${item.meaning} ${item.sentence}`).includes(query));
    $('#word-count').textContent = query ? `${filtered.length} / ${words.length} từ` : `${words.length} / 2.000 từ đã lưu`;
    $('#export').textContent = `Xuất CSV (${filtered.length})`; $('#export').disabled = !filtered.length;
    $('#empty').hidden = filtered.length > 0;
    $('#empty h2').textContent = words.length ? 'Không tìm thấy từ phù hợp.' : 'Chưa có từ nào được lưu.';
    $('#empty p').textContent = words.length ? 'Thử tìm bằng một phần của từ, nghĩa hoặc câu gốc.' : 'Bấm một từ trên phụ đề gốc, xem nghĩa rồi chọn Lưu từ.';
    $('#words').replaceChildren(...filtered.slice().reverse().map(item => {
      const entry = document.createElement('li'); entry.className = 'word-entry';
      const top = document.createElement('div'); top.className = 'word-top';
      const copy = document.createElement('div'), heading = document.createElement('h2'), meaning = document.createElement('p');
      heading.textContent = item.word; heading.dir = 'auto'; meaning.textContent = item.meaning; meaning.dir = 'auto'; meaning.className = 'word-meaning'; copy.append(heading, meaning);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-word'; remove.textContent = 'Xóa'; remove.setAttribute('aria-label', `Xóa từ ${item.word}`);
      remove.addEventListener('click', async () => {
        remove.disabled = true; $('#word-error').textContent = '';
        try {
          const result = await app.call('vocabulary.delete', { id: item.id });
          lastDeleted = item; words = app.readVocabulary(result); renderWords(); $('#undo-area').hidden = false; $('#undo').focus();
        } catch (error) { $('#word-error').textContent = error.message; remove.disabled = false; }
      });
      top.append(copy, remove); entry.append(top);
      if (item.sentence) { const context = document.createElement('p'); context.className = 'word-context'; context.textContent = item.sentence; context.dir = 'auto'; entry.append(context); }
      const meta = document.createElement('div'); meta.className = 'word-meta';
      const language = document.createElement('span'); language.textContent = `${app.languageName(item.sourceLanguage)} → ${app.languageName(item.targetLanguage)}`; meta.append(language);
      if (item.url) {
        const link = document.createElement('a'); link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Mở bài học'; meta.append(link);
        const time = document.createElement('span'), seconds = Math.floor(item.time); time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; meta.append(time);
      }
      entry.append(meta); return entry;
    }));
  }
  $('#word-search').addEventListener('input', renderWords);
  $('#export').addEventListener('click', () => app.downloadFile('lecturesub-tu-vung.csv', app.vocabularyCsv(filtered), 'text/csv;charset=utf-8'));
  $('#undo').addEventListener('click', async () => {
    if (!lastDeleted) return;
    const item = lastDeleted; $('#undo').disabled = true;
    try { await app.call('vocabulary.add', { item }); lastDeleted = undefined; $('#undo-area').hidden = true; $('#word-error').textContent = ''; }
    catch (error) { $('#word-error').textContent = error.message; }
    finally { $('#undo').disabled = false; }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.ccUdemySettings) { settingsEvents++; renderSettings(changes.ccUdemySettings.newValue); if (!pending) setStatus('Đã lưu'); }
    if (changes.ccUdemyVocabulary) { vocabularyEvents++; words = app.readVocabulary(changes.ccUdemyVocabulary.newValue); renderWords(); }
  });
  renderSettings(settings); renderWords();
  const initialSettingsEvents = settingsEvents, initialVocabularyEvents = vocabularyEvents, initialSaveRevision = saveRevision;
  Promise.all([app.call('settings.get'), app.call('vocabulary.list')]).then(([value, items]) => {
    if (initialSettingsEvents === settingsEvents && initialSaveRevision === saveRevision) renderSettings(value);
    if (initialVocabularyEvents === vocabularyEvents) { words = app.readVocabulary(items); renderWords(); }
    if (!pending && initialSaveRevision === saveRevision) setStatus('Tự lưu thay đổi');
  }).catch(error => setStatus(error.message, true));
})();
