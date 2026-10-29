const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const settle = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

async function harness({ waitForCache = false, waitForSettings = false } = {}) {
  const cache = deferred(), initial = deferred(), listeners = [];
  const video = { id: 'lesson', currentSrc: 'fixture', currentTime: 10 };
  let cue = { source: 'A model learns.', translated: '', upcoming: [], key: 'first' }, handlers, tick, rendered, saved;
  const context = vm.createContext({ console, setTimeout, clearTimeout, location: {
    pathname: '/course/fixture/learn/lecture/1', href: 'https://www.udemy.com/course/fixture/learn/lecture/1',
  }, document: { title: 'Fixture course', addEventListener() {} },
  setInterval(fn) { tick = fn; }, chrome: { storage: { local: {}, onChanged: { addListener(fn) { listeners.push(fn); } } } } });
  const run = file => vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);
  run('languages.js'); run('settings.js');
  const app = context.CCUdemy;
  const defaults = app.normalizeSettings({ pauseOnLookup: false });
  app.createTranslator = () => ({ ready: waitForCache ? cache.promise : Promise.resolve(), setLanguages() {},
    isEnabled: () => true, availability: async () => 'available', peek: () => '', translate: async () => 'mô hình' });
  app.call = async (type, payload) => {
    if (type === 'settings.get') return waitForSettings ? initial.promise : defaults;
    if (type === 'vocabulary.list') return [];
    if (type === 'vocabulary.add') { saved = { ...payload.item, id: 'saved' }; return saved; }
  };
  app.findVideo = () => video;
  app.createUdemyAdapter = () => ({ video, container: {}, setEnabled() {}, read: () => cue, destroy() {} });
  app.createPlaybackSession = () => ({ open() {}, close() {}, cancel() {} });
  app.createOverlay = (_, callbacks) => {
    handlers = callbacks;
    return { host: { isConnected: true }, settings(value) { rendered = value; }, enabled() {}, translatorState() {},
      english() {}, vietnamese() {}, status() {}, lookup() {}, saveState() {}, closeLookup() {}, destroy() {} };
  };
  run('content.js'); await settle();
  return {
    app, video, get handlers() { return handlers; }, get rendered() { return rendered; }, get saved() { return saved; },
    emitSettings(value) { listeners.forEach(fn => fn({ ccUdemySettings: { newValue: value } }, 'local')); },
    releaseCache() { cache.resolve(); }, releaseSettings() { initial.resolve(defaults); },
    advance() { video.currentTime = 20; cue = { ...cue, source: 'The model fails.', key: 'second' }; tick(); },
  };
}

test('settings events during cache loading are applied when the player mounts', async () => {
  const h = await harness({ waitForCache: true });
  h.emitSettings(h.app.normalizeSettings({ targetLanguage: 'ja' }));
  h.releaseCache(); await settle();
  assert.equal(h.rendered.targetLanguage, 'ja');
});

test('a delayed initial settings response cannot replace a newer event', async () => {
  const h = await harness({ waitForSettings: true });
  h.emitSettings(h.app.normalizeSettings({ targetLanguage: 'ja' }));
  h.releaseSettings(); await settle();
  assert.equal(h.rendered.targetLanguage, 'ja');
});

test('retry preserves an occurrence but a fresh same-word click records the current cue and time', async () => {
  const h = await harness();
  h.handlers.word('model'); await settle();
  h.advance();
  h.handlers.word('model', true); await settle();
  await h.handlers.saveWord();
  assert.equal(h.saved.sentence, 'A model learns.');
  assert.equal(h.saved.time, 10);
  h.handlers.word('model'); await settle();
  await h.handlers.saveWord();
  assert.equal(h.saved.sentence, 'The model fails.');
  assert.equal(h.saved.time, 20);
});
