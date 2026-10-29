(() => {
  'use strict';
  const app = globalThis.CCUdemy;
  if (app.started) return;
  app.started = true;
  const provider = app.createTranslator({ storage: chrome.storage.local });
  let settings = app.normalizeSettings({});
  let adapter, ui, playback, currentCue, lookupContext;
  let lesson = '', cueVersion = 0, lookupVersion = 0, languageVersion = 0;
  let translationState = 'idle', translationError = '', downloadProgress = '';
  let savedWords = [];
  let initialized = false, settingsEvents = 0, vocabularyEvents = 0;
  const pairLabel = () => `${app.languageName(settings.sourceLanguage)} → ${app.languageName(settings.targetLanguage)}`;
  const saved = context => savedWords.some(item => item.sourceLanguage === context.sourceLanguage && item.targetLanguage === context.targetLanguage && item.word.normalize('NFC').toLocaleLowerCase(item.sourceLanguage) === context.word.normalize('NFC').toLocaleLowerCase(item.sourceLanguage));

  function refreshStatus() {
    if (!ui || !settings.enabled) return;
    if (translationState === 'loading') ui.status(`Đang tải bộ dịch ${pairLabel()}${downloadProgress}…`);
    else if (translationState === 'error') ui.status(translationError, true);
    else if (!currentCue?.source) ui.status(settings.sourceLanguage === 'en' ? 'Bật phụ đề tiếng Anh trong menu CC của Udemy.' : `Chọn ${app.languageName(settings.sourceLanguage)} trong menu CC của Udemy.`);
    else if (translationState === 'unsupported') ui.status(`Máy chưa hỗ trợ cặp ${pairLabel()}. Chọn cặp khác hoặc kiểm tra Chrome.`, true);
    else if (settings.displayMode === 'source' && !lookupContext) ui.status('');
    else if (settings.sourceLanguage === settings.targetLanguage) ui.status('Nguồn và đích trùng nhau; không cần tải bộ dịch.');
    else if (translationState !== 'ready') ui.status('Bấm “Bật dịch miễn phí” để tải bộ ngôn ngữ và tra từ.');
    else ui.status('');
  }
  function renderCue(force = false) {
    if (!adapter || !settings.enabled) return;
    const cue = adapter.read();
    if (!force && currentCue?.key === cue.key) return;
    currentCue = cue;
    const version = ++cueVersion;
    ui.english(cue.source); ui.vietnamese(cue.translated || ''); refreshStatus();
    if (!cue.source || cue.translated || settings.displayMode === 'source') return;
    const cached = provider.peek(cue.source);
    if (cached) { ui.vietnamese(cached); return; }
    if (!provider.isEnabled()) return;
    ui.vietnamese('Đang dịch…', true);
    provider.translate(cue.source).then(result => {
      if (version !== cueVersion || !settings.enabled || !ui) return;
      ui.vietnamese(result); refreshStatus();
      if (cue.upcoming[0]) void provider.translate(cue.upcoming[0]).catch(() => {});
    }).catch(() => {
      if (version !== cueVersion || !settings.enabled || !ui) return;
      ui.vietnamese(''); ui.status('Không dịch được câu này. Hãy thử lại.', true);
    });
  }
  function enableTranslation() {
    if (translationState === 'loading') return;
    const version = languageVersion;
    translationState = 'loading'; downloadProgress = ''; ui?.translatorState('loading'); refreshStatus();
    // Keep this call synchronous in the trusted click; availability/storage awaits belong elsewhere.
    const enabling = provider.enable(percent => { downloadProgress = ` · ${percent}%`; refreshStatus(); });
    enabling.then(() => {
      if (version !== languageVersion) return;
      translationState = 'ready'; ui?.translatorState('ready'); renderCue(true);
      if (lookupContext) lookup(lookupContext.word, true);
    }).catch(error => {
      if (version !== languageVersion) return;
      translationState = 'error';
      translationError = error.name === 'NotAllowedError'
        ? 'Chrome chưa cho tải bộ dịch. Bấm “Bật dịch miễn phí” để thử lại.'
        : `Chưa tải được bộ dịch ${pairLabel()}. Kiểm tra Chrome, mạng hoặc chọn cặp khác.`;
      ui?.translatorState('error'); refreshStatus();
    });
  }
  function lookup(word, retry = false) {
    if (!ui || !settings.enabled) return;
    const old = lookupContext;
    const same = retry && old?.word === word && old.sourceLanguage === settings.sourceLanguage && old.targetLanguage === settings.targetLanguage;
    lookupContext = same ? old : { word, sourceLanguage: settings.sourceLanguage, targetLanguage: settings.targetLanguage,
      sentence: currentCue?.source || '', url: location.href, time: adapter.video.currentTime, title: document.title, meaning: '' };
    const context = lookupContext, version = ++lookupVersion;
    playback.open();
    ui.lookup(word, provider.isEnabled() || provider.peek(word) ? 'Đang tra nghĩa…' : 'Bấm “Bật dịch miễn phí” phía trên để tra nghĩa.');
    ui.saveState('unavailable'); refreshStatus();
    if (!provider.isEnabled() && !provider.peek(word)) return;
    provider.translate(word).then(result => {
      if (version !== lookupVersion || !ui || !settings.enabled) return;
      context.meaning = result; ui.lookup(word, result); ui.saveState(saved(context) ? 'saved' : 'ready');
    }).catch(() => {
      if (version === lookupVersion && ui && settings.enabled) { ui.lookup(word, 'Chưa tra được nghĩa. Hãy thử lại.', true); ui.saveState('unavailable'); }
    });
  }
  async function saveWord() {
    const context = lookupContext;
    if (!context?.meaning || !ui) return;
    ui.saveState('saving');
    try {
      const item = await app.call('vocabulary.add', { item: context });
      if (!savedWords.some(word => word.id === item.id)) savedWords.push(item);
      if (context === lookupContext && ui) ui.saveState('saved');
    } catch (error) { if (context === lookupContext && ui) ui.saveState('error', error.message); }
  }
  function dismiss() {
    lookupContext = undefined; lookupVersion++; ui?.closeLookup(); void playback?.close(); refreshStatus();
  }
  function replayCue() {
    if (!adapter?.video || lookupContext?.time === undefined) return;
    const targetTime = Math.max(0, lookupContext.time - 0.2);
    adapter.video.currentTime = targetTime;
    if (adapter.video.paused) {
      adapter.video.play().catch(() => {});
    }
  }
  async function patchSettings(patch) {
    const before = settingsEvents;
    try {
      const result = await app.call('settings.patch', { patch });
      if (settingsEvents === before) applySettings(result);
    }
    catch (error) { ui?.settings(settings); ui?.status(error.message, true); }
  }
  async function openOptions(section) {
    try { await app.call('options.open', { section }); }
    catch (error) { ui?.status(error.message, true); }
  }
  function checkAvailability() {
    const version = languageVersion;
    provider.availability().then(result => {
      if (version !== languageVersion || translationState !== 'idle') return;
      if (provider.isEnabled()) translationState = 'ready';
      else if (result === 'unavailable' || result === 'no') translationState = 'unsupported';
      ui?.translatorState(translationState); refreshStatus();
    }).catch(() => {});
  }
  function applySettings(value, initial = false) {
    const next = app.normalizeSettings(value);
    if (!initial && JSON.stringify(next) === JSON.stringify(settings)) return;
    const changedPair = next.sourceLanguage !== settings.sourceLanguage || next.targetLanguage !== settings.targetLanguage;
    if (changedPair || !next.enabled) dismiss();
    settings = next;
    if (changedPair || initial) {
      languageVersion++; provider.setLanguages(settings.sourceLanguage, settings.targetLanguage);
      translationState = provider.isEnabled() ? 'ready' : 'idle'; translationError = ''; checkAvailability();
    }
    cueVersion++; currentCue = undefined;
    if (!ui) return;
    adapter.setEnabled(settings.enabled); ui.settings(settings); ui.enabled(settings.enabled); ui.translatorState(translationState);
    if (settings.enabled) renderCue(true);
  }
  function detach() {
    cueVersion++; lookupVersion++; lookupContext = undefined; playback?.cancel(); ui?.destroy(); adapter?.destroy();
    adapter = undefined; ui = undefined; playback = undefined; currentCue = undefined;
  }
  function tick() {
    if (!/\/course\/[^/]+\/learn(?:\/|$)/.test(location.pathname)) { if (adapter) detach(); return; }
    const video = app.findVideo();
    if (!video) { if (adapter) detach(); return; }
    const nextLesson = `${location.pathname}|${video.id}|${video.currentSrc}`;
    if (!adapter || adapter.video !== video || lesson !== nextLesson || !ui.host.isConnected) {
      detach(); lesson = nextLesson;
      adapter = app.createUdemyAdapter(video, () => settings);
      playback = app.createPlaybackSession(video, () => settings);
      ui = app.createOverlay(adapter.container, { enable: enableTranslation,
        toggle: value => patchSettings({ enabled: value }), patch: patchSettings,
        settings: () => openOptions(), notebook: () => openOptions('vocabulary'),
        word: lookup, saveWord, dismiss, replay: replayCue,
        retry() { if (provider.isEnabled()) renderCue(true); else enableTranslation(); },
      });
      adapter.setEnabled(settings.enabled); ui.settings(settings); ui.enabled(settings.enabled); ui.translatorState(translationState);
    }
    renderCue();
  }
  // Subscribe before any asynchronous settings/cache reads so newer state always wins.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.ccUdemySettings) {
      settingsEvents++;
      if (initialized) applySettings(changes.ccUdemySettings.newValue);
      else settings = app.normalizeSettings(changes.ccUdemySettings.newValue);
    }
    if (changes.ccUdemyVocabulary) {
      vocabularyEvents++; savedWords = changes.ccUdemyVocabulary.newValue || [];
      if (lookupContext?.meaning && ui) ui.saveState(saved(lookupContext) ? 'saved' : 'ready');
    }
  });
  async function start() {
    const settingsBefore = settingsEvents;
    try {
      const initial = await app.call('settings.get');
      if (settingsBefore === settingsEvents) settings = app.normalizeSettings(initial);
    } catch { /* Default settings remain usable. */ }
    await provider.ready;
    provider.setLanguages(settings.sourceLanguage, settings.targetLanguage);
    translationState = provider.isEnabled() ? 'ready' : 'idle';
    initialized = true; tick(); setInterval(tick, 150); checkAvailability();
    const vocabularyBefore = vocabularyEvents;
    app.call('vocabulary.list').then(items => { if (vocabularyBefore === vocabularyEvents) savedWords = items; }).catch(() => {});
    document.addEventListener('keydown', event => {
      if (!adapter || !settings.shortcutsEnabled || event.repeat || event.isComposing) return;
      if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey || event.code !== 'KeyC') return;
      const editing = event.composedPath().some(node => node instanceof Element && (node.matches('input,textarea,select,[role="textbox"]') || node.isContentEditable));
      if (editing) return;
      event.preventDefault(); void patchSettings({ enabled: !settings.enabled });
    });
  }
  void start();
})();
