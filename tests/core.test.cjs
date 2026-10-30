const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load(name) {
  const context = vm.createContext({ console, setTimeout, clearTimeout, Map, Promise });
  context.globalThis = context;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), context);
  return context.CCUdemy;
}

test('captions respect exclusive ends, gaps, overlapping speakers and VTT formatting', () => {
  const { cueAt } = load('captions.js');
  const cues = [
    { startTime: 0, endTime: 2, text: '<v Teacher>Hello &amp; welcome</v>' },
    { startTime: 1, endTime: 3, text: '<i>Second speaker</i>' },
    { startTime: 5, endTime: 6, text: 'Next sentence' },
  ];
  assert.equal(cueAt(cues, 0), 'Hello & welcome');
  assert.equal(cueAt(cues, 1), 'Hello & welcome Second speaker');
  assert.equal(cueAt(cues, 2), 'Second speaker');
  assert.equal(cueAt(cues, 3), '');
  assert.equal(cueAt(cues, 6), '');
});

test('word tokens preserve contractions, punctuation, Unicode and original spacing', () => {
  const { tokenize } = load('captions.js');
  const text = "It's a pre-trained model, isn’t it? 42!";
  const tokens = tokenize(text);
  assert.equal(tokens.map(t => t.text).join(''), text);
  assert.deepEqual(Array.from(tokens.filter(t => t.word), t => t.text), ["It's", 'a', 'pre-trained', 'model', 'isn’t', 'it']);
});

test('translator reports absent browser support instead of fake translations', async () => {
  const { createTranslator } = load('translator.js');
  const provider = createTranslator({ api: undefined });
  assert.equal(await provider.availability(), 'unavailable');
  await assert.rejects(provider.enable(), /Chrome/);
  await assert.rejects(provider.translate('hello'), /Bật dịch/);
});

test('enable calls browser create immediately, preserving the user gesture', async () => {
  const { createTranslator } = load('translator.js');
  let called = false;
  const provider = createTranslator({ api: {
    availability: async () => 'downloadable',
    create: () => { called = true; return Promise.resolve({ translate: async () => 'xin chào' }); },
  } });
  const enabling = provider.enable();
  assert.equal(called, true);
  await enabling;
  assert.equal(await provider.translate('hello'), 'xin chào');
});

test('translation deduplicates in-flight work and restores persisted results', async () => {
  const { createTranslator } = load('translator.js');
  let calls = 0;
  let saved = {};
  const storage = { get: async () => saved, set: async value => { saved = value; } };
  const api = { create: async () => ({ translate: async () => { calls++; return 'mô hình'; } }) };
  const provider = createTranslator({ api, storage });
  await provider.enable();
  assert.deepEqual(await Promise.all([provider.translate('model'), provider.translate('model')]), ['mô hình', 'mô hình']);
  assert.equal(calls, 1);
  await provider.flush();
  const restored = createTranslator({ api, storage });
  await restored.ready;
  assert.equal(await restored.translate('model'), 'mô hình');
  assert.equal(calls, 1);
});

test('a failed language download or translation can be retried', async () => {
  const { createTranslator } = load('translator.js');
  let creates = 0;
  let attempts = 0;
  const provider = createTranslator({ api: {
    create: async () => {
      if (++creates === 1) throw Error('download failed');
      return { translate: async () => { if (++attempts === 1) throw Error('translate failed'); return 'dữ liệu'; } };
    },
  } });
  await assert.rejects(provider.enable(), /download failed/);
  await provider.enable();
  await assert.rejects(provider.translate('data'), /translate failed/);
  assert.equal(await provider.translate('data'), 'dữ liệu');
});

test('lookup restores playing state but leaves an originally paused video paused', async () => {
  const { createPlaybackSession } = load('playback.js');
  const video = { paused: false, ended: false, isConnected: true,
    pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); } };
  const playing = createPlaybackSession(video);
  playing.open(); playing.open(); // Switching selected words must not lose the initial state.
  assert.equal(video.paused, true);
  await playing.close();
  assert.equal(video.paused, false);
  video.paused = true;
  const paused = createPlaybackSession(video);
  paused.open(); await paused.close();
  assert.equal(video.paused, true);
});

test('replacing the lecture cancels resume of the old video', async () => {
  const { createPlaybackSession } = load('playback.js');
  const video = { paused: false, ended: false, isConnected: true,
    pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); } };
  const session = createPlaybackSession(video);
  session.open(); session.cancel(); await session.close();
  assert.equal(video.paused, true);
});

test('udemy-adapter prioritizes video-player container and captures cues inside or outside in well--container', () => {
  const context = vm.createContext({ console, setTimeout, clearTimeout, Map, Promise, location: { pathname: '/test' } });
  context.globalThis = context;
  for (const file of ['captions.js', 'udemy-adapter.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);
  }
  const { createUdemyAdapter } = context.CCUdemy;

  const styleEl = { remove() {} };
  const doc = {
    head: { append() {} },
    documentElement: { toggleAttribute(name, val) { this[name] = val; }, removeAttribute(name) { delete this[name]; } },
    createElement: () => styleEl,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  context.document = doc;
  context.getComputedStyle = () => ({ position: 'relative' });

  const videoPlayer = {
    dataset: {},
    style: {},
    toggleAttribute(name, val) { this[name] = val; },
    querySelectorAll: () => [],
    closest: () => null,
  };
  const shakaContainer = {
    parentElement: videoPlayer,
    closest(selector) {
      if (selector.includes('video-player')) return videoPlayer;
      if (selector.includes('shaka')) return shakaContainer;
      return null;
    },
  };
  const video = {
    parentElement: shakaContainer,
    textTracks: [],
    currentTime: 10,
    id: 'vid',
    currentSrc: 'src',
    closest(selector) {
      if (selector.includes('video-player')) return videoPlayer;
      if (selector.includes('shaka')) return shakaContainer;
      return null;
    },
  };

  const adapter = createUdemyAdapter(video);
  assert.equal(adapter.container, videoPlayer, 'adapter chooses video-player over inner shaka-container');

  adapter.setEnabled(true);
  assert.equal(doc.documentElement['data-cc-udemy-active'], true);
  assert.equal(videoPlayer['data-cc-udemy-active'], true);

  doc.querySelector = sel => sel.includes('well--container') ? { textContent: 'Under video caption.' } : null;
  const cue = adapter.read();
  assert.equal(cue.source, 'Under video caption.', 'captures cues placed in under-video container');

  adapter.destroy();
  assert.equal('data-cc-udemy-active' in doc.documentElement, false);
});
