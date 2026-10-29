const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function load(...files) {
  const context = vm.createContext({ console, setTimeout, clearTimeout, Map, Promise, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);
  return context.CCUdemy;
}
const stateFiles = ['languages.js', 'settings.js', 'library.js', 'store.js'];

test('old font settings migrate and invalid styles/languages are bounded', () => {
  const { normalizeSettings } = load(...stateFiles);
  const migrated = normalizeSettings({ enabled: false, fontSize: 32 });
  assert.equal(migrated.enabled, false);
  assert.equal(migrated.sourceFontSize, 32);
  assert.equal(migrated.targetFontSize, 27);
  assert.equal(migrated.sourceLanguage, 'en');
  const bounded = normalizeSettings({ sourceFontSize: 999, targetFontSize: -4, sourceColor: 'url(evil)',
    backgroundOpacity: Infinity, captionWidth: 2, sourceLanguage: 'invented', targetLanguage: 'ja', unknown: 12 });
  assert.equal(bounded.sourceFontSize, 40);
  assert.equal(bounded.targetFontSize, 12);
  assert.equal(bounded.sourceColor, '#ffffff');
  assert.equal(bounded.backgroundOpacity, .92);
  assert.equal(bounded.captionWidth, 50);
  assert.equal(bounded.sourceLanguage, 'en');
  assert.equal(bounded.targetLanguage, 'ja');
  assert.equal('unknown' in bounded, false);
});

test('simultaneous patches from two tabs merge without losing unrelated settings', async () => {
  const { createStore } = load(...stateFiles);
  let data = {};
  const storage = { get: async () => { await new Promise(r => setTimeout(r, 3)); return structuredClone(data); },
    set: async value => { await new Promise(r => setTimeout(r, 3)); data = { ...data, ...structuredClone(value) }; } };
  const store = createStore(storage);
  await Promise.all([
    store.handle({ type: 'settings.patch', patch: { targetLanguage: 'ja' } }),
    store.handle({ type: 'settings.patch', patch: { sourceFontSize: 30 } }),
  ]);
  const result = await store.handle({ type: 'settings.get' });
  assert.equal(result.targetLanguage, 'ja');
  assert.equal(result.sourceFontSize, 30);
});

test('vocabulary additions are serialized, deduplicated, persisted and independently deletable', async () => {
  const { createStore } = load(...stateFiles);
  let data = {};
  const storage = { get: async () => structuredClone(data), set: async value => { data = { ...data, ...structuredClone(value) }; } };
  const store = createStore(storage);
  const word = { word: 'Model', meaning: 'mô hình', sourceLanguage: 'en', targetLanguage: 'vi',
    sentence: 'A model learns.', url: 'https://www.udemy.com/course/test/learn/lecture/1', time: 14 };
  await Promise.all([
    store.handle({ type: 'vocabulary.add', item: word }),
    store.handle({ type: 'vocabulary.add', item: { ...word, word: 'model' } }),
    store.handle({ type: 'vocabulary.add', item: { ...word, targetLanguage: 'ja', meaning: 'モデル' } }),
  ]);
  let items = await store.handle({ type: 'vocabulary.list' });
  assert.equal(items.length, 2);
  assert.equal(items[0].sentence, 'A model learns.');
  assert.equal(items[0].time, 14);
  await store.handle({ type: 'settings.reset' });
  assert.equal((await store.handle({ type: 'vocabulary.list' })).length, 2, 'reset settings must preserve saved words');
  await store.handle({ type: 'vocabulary.delete', id: items[0].id });
  assert.equal((await store.handle({ type: 'vocabulary.list' })).length, 1);
  await assert.rejects(store.handle({ type: 'vocabulary.add', item: { word: 'x', meaning: '' } }), /nghĩa/);
});

test('vocabulary output neutralizes spreadsheet formulas and untrusted links', () => {
  const { vocabularyCsv, normalizeWord } = load(...stateFiles);
  const csv = vocabularyCsv([{ word: '=HYPERLINK("bad")', meaning: '+cmd', sentence: 'line one\n"two"',
    sourceLanguage: 'en', targetLanguage: 'vi', time: 12, url: '' }]);
  assert.match(csv, /'\=HYPERLINK/);
  assert.match(csv, /'\+cmd/);
  assert.match(csv, /""two""/);
  const word = normalizeWord({ word: 'data', meaning: 'dữ liệu', url: 'javascript:alert(1)' });
  assert.equal(word.url, '');
});

test('language-pair caches never return another pair’s translation and migrate v1 only into en–vi', async () => {
  const { createTranslator } = load('translator.js');
  const provider = createTranslator({ storage: { get: async () => ({ ccUdemyTranslationsV1: [['model', 'mô hình']] }), set: async () => {} },
    api: { create: async options => ({ translate: async () => options.targetLanguage === 'ja' ? 'モデル' : 'mô hình' }) } });
  await provider.ready;
  assert.equal(await provider.translate('model'), 'mô hình');
  provider.setLanguages('en', 'ja');
  assert.equal(provider.peek('model'), undefined);
  await provider.enable();
  assert.equal(await provider.translate('model'), 'モデル');
  provider.setLanguages('en', 'vi');
  assert.equal(provider.peek('model'), 'mô hình');
});

test('an old language-pack creation cannot activate or clear a newer pair', async () => {
  const { createTranslator } = load('translator.js');
  let resolveOld;
  const provider = createTranslator({ api: { create: options => options.targetLanguage === 'vi'
    ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ translate: async () => 'モデル' }) } });
  const old = provider.enable();
  provider.setLanguages('en', 'ja');
  await provider.enable();
  resolveOld({ translate: async () => 'wrong', destroy() {} });
  await assert.rejects(old, /đổi|hủy/i);
  assert.equal(provider.isEnabled(), true);
  assert.equal(await provider.translate('model'), 'モデル');
});

test('same-language mode does not need a model', async () => {
  const { createTranslator } = load('translator.js');
  const provider = createTranslator({ api: undefined });
  provider.setLanguages('fr', 'fr');
  assert.equal(await provider.availability(), 'available');
  assert.equal(await provider.translate('bonjour'), 'bonjour');
  assert.equal(provider.isEnabled(), true);
});

test('lookup can leave playback running or leave it paused on close according to settings', async () => {
  const { createPlaybackSession } = load('playback.js');
  const video = { paused: false, isConnected: true, ended: false,
    pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); } };
  let options = { pauseOnLookup: false, resumeOnClose: true };
  const session = createPlaybackSession(video, () => options);
  session.open(); assert.equal(video.paused, false); await session.close();
  options = { pauseOnLookup: true, resumeOnClose: false };
  session.open(); assert.equal(video.paused, true); await session.close();
  assert.equal(video.paused, true);
});
